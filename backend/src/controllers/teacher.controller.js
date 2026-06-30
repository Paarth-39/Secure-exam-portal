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

// 1. CREATE EXAM
const createExam = asyncHandler(async (req, res, next) => {
  const { title, subjectId, duration, totalMarks, startTime, endTime } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return next(new AppError('Start time must be before end time', 400));
  }

  // Verify subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId }
  });
  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      subjectId,
      duration,
      totalMarks,
      startTime: start,
      endTime: end,
      createdBy: req.user.userId,
      status: 'DRAFT'
    },
    include: { subject: true }
  });

  await auditLog(req.user.userId, 'EXAM_CREATED', req);

  res.status(201).json({ exam });
});

// 2. UPDATE EXAM
const updateExam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, subjectId, duration, totalMarks, startTime, endTime } = req.body;

  const exam = await prisma.exam.findUnique({
    where: { id }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Ownership Check
  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Status check
  if (exam.status === 'PUBLISHED' || exam.status === 'CLOSED') {
    return next(new AppError('Cannot update a published or closed exam', 400));
  }

  // Validation if dates are being updated
  const start = startTime ? new Date(startTime) : new Date(exam.startTime);
  const end = endTime ? new Date(endTime) : new Date(exam.endTime);

  if (start >= end) {
    return next(new AppError('Start time must be before end time', 400));
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }
  }

  const updatedExam = await prisma.exam.update({
    where: { id },
    data: {
      title: title ?? exam.title,
      subjectId: subjectId ?? exam.subjectId,
      duration: duration ?? exam.duration,
      totalMarks: totalMarks ?? exam.totalMarks,
      startTime: start,
      endTime: end
    },
    include: { subject: true }
  });

  res.status(200).json({ exam: updatedExam });
});

// 3. DELETE EXAM
const deleteExam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Ownership Check
  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Status check
  if (exam.status === 'PUBLISHED') {
    return next(new AppError('Unpublish before deleting', 400));
  }

  await prisma.exam.delete({
    where: { id }
  });

  await auditLog(req.user.userId, 'EXAM_DELETED', req);

  res.status(204).send();
});

// 4. PUBLISH EXAM
const publishExam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Ownership Check
  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Question existence check
  if (exam._count.questions === 0) {
    return next(new AppError('Cannot publish an exam with no questions', 400));
  }

  // Timing check
  if (new Date(exam.startTime) < new Date()) {
    return next(new AppError('Start time has already passed', 400));
  }

  const updatedExam = await prisma.exam.update({
    where: { id },
    data: { status: 'PUBLISHED' }
  });

  await auditLog(req.user.userId, 'EXAM_PUBLISHED', req);

  res.status(200).json({ exam: updatedExam });
});

// 5. ADD QUESTION
const addQuestion = asyncHandler(async (req, res, next) => {
  const { examId, question, optionA, optionB, optionC, optionD, correctOption, marks } = req.body;

  const exam = await prisma.exam.findUnique({
    where: { id: examId }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Ownership Check
  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Status check
  if (exam.status === 'PUBLISHED' || exam.status === 'CLOSED') {
    return next(new AppError('Cannot add questions to a published or closed exam', 400));
  }

  const newQuestion = await prisma.question.create({
    data: {
      examId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      marks
    }
  });

  res.status(201).json({ question: newQuestion });
});

// 6. UPDATE QUESTION
const updateQuestion = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { question, optionA, optionB, optionC, optionD, correctOption, marks } = req.body;

  const questionRecord = await prisma.question.findUnique({
    where: { id },
    include: { exam: true }
  });

  if (!questionRecord) {
    return next(new AppError('Question not found', 404));
  }

  // Ownership Check
  if (questionRecord.exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Status Check
  if (questionRecord.exam.status === 'PUBLISHED' || questionRecord.exam.status === 'CLOSED') {
    return next(new AppError('Cannot modify questions on a published or closed exam', 400));
  }

  const updatedQuestion = await prisma.question.update({
    where: { id },
    data: {
      question: question ?? questionRecord.question,
      optionA: optionA ?? questionRecord.optionA,
      optionB: optionB ?? questionRecord.optionB,
      optionC: optionC ?? questionRecord.optionC,
      optionD: optionD ?? questionRecord.optionD,
      correctOption: correctOption ?? questionRecord.correctOption,
      marks: marks ?? questionRecord.marks
    }
  });

  res.status(200).json({ question: updatedQuestion });
});

// 7. DELETE QUESTION
const deleteQuestion = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const questionRecord = await prisma.question.findUnique({
    where: { id },
    include: { exam: true }
  });

  if (!questionRecord) {
    return next(new AppError('Question not found', 404));
  }

  // Ownership Check
  if (questionRecord.exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  // Status Check
  if (questionRecord.exam.status === 'PUBLISHED' || questionRecord.exam.status === 'CLOSED') {
    return next(new AppError('Cannot delete questions from a published or closed exam', 400));
  }

  await prisma.question.delete({
    where: { id }
  });

  res.status(204).send();
});

// 8. GET MY EXAMS
const getMyExams = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req);

  const [exams, total] = await prisma.$transaction([
    prisma.exam.findMany({
      where: { createdBy: req.user.userId },
      include: {
        subject: true,
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.exam.count({
      where: { createdBy: req.user.userId }
    })
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

// 9. GET EXAM RESULTS
const getExamResults = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const exam = await prisma.exam.findUnique({
    where: { id }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Ownership Check
  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  const [attempts, total] = await prisma.$transaction([
    prisma.attempt.findMany({
      where: { examId: id },
      include: {
        student: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { submitTime: 'desc' }
    }),
    prisma.attempt.count({
      where: { examId: id }
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    data: attempts.map((a) => ({
      id: a.id,
      studentName: a.student.fullName,
      studentEmail: a.student.email,
      score: a.score,
      status: a.status,
      startTime: a.startTime,
      submitTime: a.submitTime
    })),
    total,
    page,
    limit,
    totalPages
  });
});

// 10. GET EXAM BY ID
const getExamById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: {
        orderBy: { id: 'asc' } // Changed from createdAt to id
      }
    }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (exam.createdBy !== req.user.userId) {
    return next(new AppError('Access denied', 403));
  }

  res.status(200).json({ exam });
});

// 11. GET SUBJECTS
const getSubjects = asyncHandler(async (req, res, next) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });
  res.status(200).json(subjects);
});

module.exports = {
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getMyExams,
  getExamResults,
  getExamById,
  getSubjects
};

