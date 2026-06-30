const { prisma } = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { auditLog } = require('../utils/audit');

// PAGINATION UTILITY
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// 1. GET PROFILE
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  res.status(200).json({ user });
});

// 2. UPDATE PROFILE
const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    return next(new AppError('Full name must be at least 2 characters', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: { fullName },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  res.status(200).json({ user: updatedUser });
});

// 3. GET AVAILABLE EXAMS
const getAvailableExams = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req);
  const now = new Date();

  const whereClause = {
    status: 'PUBLISHED',
    startTime: { lte: now },
    endTime: { gte: now }
  };

  const [exams, total] = await prisma.$transaction([
    prisma.exam.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        duration: true,
        totalMarks: true,
        startTime: true,
        endTime: true,
        subject: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { startTime: 'asc' }
    }),
    prisma.exam.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data: exams,
    total,
    page,
    limit,
    totalPages
  });
});

// 4. START EXAM
const startExam = asyncHandler(async (req, res, next) => {
  const { examId } = req.body;

  if (!examId) {
    return next(new AppError('Exam ID is required', 400));
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId }
  });

  if (!exam || exam.status !== 'PUBLISHED') {
    return next(new AppError('Exam not found or is not available', 400));
  }

  const now = new Date();
  if (now < new Date(exam.startTime) || now > new Date(exam.endTime)) {
    return next(new AppError('Exam is not available right now', 400));
  }

  // Check for existing attempt
  const existingAttempt = await prisma.attempt.findUnique({
    where: {
      uq_student_exam: {
        studentId: req.user.userId,
        examId
      }
    }
  });

  if (existingAttempt) {
    if (existingAttempt.status === 'IN_PROGRESS') {
      // Resume existing attempt
      const questions = await prisma.question.findMany({
        where: { examId },
        select: {
          id: true,
          question: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          marks: true
        }
      });

      return res.status(200).json({
        attemptId: existingAttempt.id,
        questions,
        examTitle: exam.title,
        duration: exam.duration,
        endTime: exam.endTime
      });
    } else {
      // Already submitted or timed out
      return next(new AppError('You have already submitted this exam', 400));
    }
  }

  // Create new attempt
  const attempt = await prisma.attempt.create({
    data: {
      studentId: req.user.userId,
      examId,
      status: 'IN_PROGRESS',
      startTime: now
    }
  });

  // Get exam questions explicitly excluding correctOption
  const questions = await prisma.question.findMany({
    where: { examId },
    select: {
      id: true,
      question: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      marks: true
    }
  });

  await auditLog(req.user.userId, 'EXAM_STARTED', req);

  res.status(200).json({
    attemptId: attempt.id,
    questions,
    examTitle: exam.title,
    duration: exam.duration,
    endTime: exam.endTime
  });
});

// 5. SUBMIT EXAM
const submitExam = asyncHandler(async (req, res, next) => {
  const { attemptId, answers } = req.body;

  if (!attemptId || !Array.isArray(answers)) {
    return next(new AppError('Invalid submission payload', 400));
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!attempt) {
    return next(new AppError('Exam attempt not found', 404));
  }

  // Ownership verify
  if (attempt.studentId !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return next(new AppError('Exam already submitted', 400));
  }

  const now = new Date();
  const isExpired = now > new Date(attempt.exam.endTime);
  const status = isExpired ? 'TIMED_OUT' : 'SUBMITTED';

  let totalScore = 0;
  const questionsMap = new Map();
  attempt.exam.questions.forEach((q) => {
    questionsMap.set(q.id, q);
  });

  // Evaluate and compile answers
  const answerCreateData = [];
  answers.forEach((ans) => {
    const question = questionsMap.get(ans.questionId);
    if (question) {
      const isCorrect = ans.selectedOption === question.correctOption;
      if (isCorrect) {
        totalScore += question.marks;
      }
      answerCreateData.push({
        attemptId,
        questionId: ans.questionId,
        selectedOption: ans.selectedOption
      });
    }
  });

  const submitTime = new Date();
  const timeTaken = Math.floor((submitTime.getTime() - attempt.startTime.getTime()) / 1000);

  // DB Transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing answers if resuming and re-submitting to ensure uniqueness / no duplicates
    await tx.answer.deleteMany({
      where: { attemptId }
    });

    // Bulk create answer selections
    if (answerCreateData.length > 0) {
      await tx.answer.createMany({
        data: answerCreateData
      });
    }

    // Finalize attempt details
    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        status,
        submitTime
      }
    });
  });

  await auditLog(req.user.userId, isExpired ? 'EXAM_TIMED_OUT' : 'EXAM_SUBMITTED', req);

  res.status(200).json({
    score: totalScore,
    totalMarks: attempt.exam.totalMarks,
    status,
    timeTaken
  });
});

// 6. GET MY RESULTS
const getMyResults = asyncHandler(async (req, res, next) => {
  const attempts = await prisma.attempt.findMany({
    where: {
      studentId: req.user.userId,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] }
    },
    select: {
      id: true,
      score: true,
      status: true,
      submitTime: true,
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { submitTime: 'desc' }
  });

  res.status(200).json({
    data: attempts.map((a) => ({
      id: a.id,
      examTitle: a.exam.title,
      subjectName: a.exam.subject?.name || 'N/A',
      score: a.score,
      totalMarks: a.exam.totalMarks,
      status: a.status,
      submitTime: a.submitTime
    }))
  });
});

// 7. GET RESULT DETAIL
const getResultDetail = asyncHandler(async (req, res, next) => {
  const { attemptId } = req.params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      },
      answers: true
    }
  });

  if (!attempt) {
    return next(new AppError('Exam attempt not found', 404));
  }

  // Ownership Check
  if (attempt.studentId !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  if (attempt.status === 'IN_PROGRESS') {
    return next(new AppError('Cannot view details of an in-progress exam attempt', 400));
  }

  // Load questions including correctOption this time since student is viewing finished result
  const questions = await prisma.question.findMany({
    where: { examId: attempt.examId }
  });

  const answersMap = new Map();
  attempt.answers.forEach((ans) => {
    answersMap.set(ans.questionId, ans.selectedOption);
  });

  const answersDetails = questions.map((q) => {
    const selectedOption = answersMap.get(q.id) || null;
    const isCorrect = selectedOption === q.correctOption;
    return {
      questionId: q.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      selectedOption,
      correctOption: q.correctOption,
      isCorrect,
      marks: q.marks
    };
  });

  res.status(200).json({
    attempt: {
      id: attempt.id,
      examTitle: attempt.exam.title,
      subjectName: attempt.exam.subject?.name || 'N/A',
      startTime: attempt.startTime,
      submitTime: attempt.submitTime,
      score: attempt.score,
      totalMarks: attempt.exam.totalMarks,
      status: attempt.status
    },
    answers: answersDetails
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getAvailableExams,
  startExam,
  submitExam,
  getMyResults,
  getResultDetail
};
