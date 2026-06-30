const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SUBJECTS_DATA = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Computer Science'
];

const EXAMS_DATA = [
  {
    title: 'Mathematics Midterm',
    subjectName: 'Mathematics',
    duration: 60,
    totalMarks: 50,
    questionMarks: 5,
    questions: [
      { q: 'What is 15% of 200?', a: '30', b: '25', c: '40', d: '35', correct: 'A' },
      { q: 'Solve for x: 3x + 7 = 22.', a: '4', b: '5', c: '6', d: '7', correct: 'B' },
      { q: 'What is the square root of 144?', a: '10', b: '11', c: '12', d: '13', correct: 'C' },
      { q: 'What is the sum of angles in a triangle?', a: '90', b: '180', c: '270', d: '360', correct: 'B' },
      { q: 'What is 8 multiplied by 7?', a: '54', b: '56', c: '58', d: '60', correct: 'B' },
      { q: 'Find the value of 2^5.', a: '16', b: '32', c: '64', d: '128', correct: 'B' },
      { q: 'What is the derivative of x^2?', a: 'x', b: '2', c: '2x', d: 'x/2', correct: 'C' },
      { q: 'What is 100 divided by 4?', a: '20', b: '25', c: '30', d: '35', correct: 'B' },
      { q: 'Find the area of a rectangle with length 10 and width 5.', a: '40', b: '45', c: '50', d: '55', correct: 'C' },
      { q: 'If a fair coin is flipped, what is the probability of heads?', a: '0.25', b: '0.5', c: '0.75', d: '1.0', correct: 'B' }
    ]
  },
  {
    title: 'Science Quiz',
    subjectName: 'Science',
    duration: 30,
    totalMarks: 20,
    questionMarks: 2,
    questions: [
      { q: 'What is the chemical symbol for water?', a: 'H2O', b: 'CO2', c: 'O2', d: 'NaCl', correct: 'A' },
      { q: 'Which planet is known as the Red Planet?', a: 'Venus', b: 'Mars', c: 'Jupiter', d: 'Saturn', correct: 'B' },
      { q: 'What is the powerhouse of the cell?', a: 'Nucleus', b: 'Mitochondria', c: 'Ribosome', d: 'Vacuole', correct: 'B' },
      { q: 'What gas do plants absorb from the atmosphere?', a: 'Oxygen', b: 'Nitrogen', c: 'Carbon Dioxide', d: 'Hydrogen', correct: 'C' },
      { q: 'What is the speed of light approximately?', a: '300,000 km/s', b: '150,000 km/s', c: '500,000 km/s', d: '1,000,000 km/s', correct: 'A' },
      { q: 'Which force keeps us on the ground?', a: 'Friction', b: 'Magnetism', c: 'Gravity', d: 'Tension', correct: 'C' },
      { q: 'What temperature does water boil at in Celsius?', a: '90C', b: '95C', c: '100C', d: '105C', correct: 'C' },
      { q: 'Which vitamin do we get from sunlight?', a: 'Vitamin A', b: 'Vitamin B', c: 'Vitamin C', d: 'Vitamin D', correct: 'D' },
      { q: 'What is the hardest natural substance on Earth?', a: 'Gold', b: 'Iron', c: 'Diamond', d: 'Quartz', correct: 'C' },
      { q: 'What organ pumps blood through the human body?', a: 'Brain', b: 'Lungs', c: 'Heart', d: 'Liver', correct: 'C' }
    ]
  },
  {
    title: 'English Grammar Test',
    subjectName: 'English',
    duration: 45,
    totalMarks: 30,
    questionMarks: 3,
    questions: [
      { q: "Identify the verb: 'She ran quickly to the store.'", a: 'She', b: 'ran', c: 'quickly', d: 'store', correct: 'B' },
      { q: "Which word is a synonym of 'Happy'?", a: 'Sad', b: 'Joyful', c: 'Angry', d: 'Tired', correct: 'B' },
      { q: 'Choose the correct spelling:', a: 'Necessary', b: 'Necesary', c: 'Neccessary', d: 'Neccesary', correct: 'A' },
      { q: "What is the plural of 'child'?", a: 'Childs', b: 'Children', c: 'Childrens', d: 'Childes', correct: 'B' },
      { q: "Complete: 'Neither of the students ___ finished.'", a: 'has', b: 'have', c: 'are', d: 'were', correct: 'A' },
      { q: 'What is an adjective?', a: 'Action word', b: 'Describing word', c: 'Naming word', d: 'Connecting word', correct: 'B' },
      { q: 'Which is an example of an alliteration?', a: 'Big blue balloon', b: 'Red truck', c: 'Hot day', d: 'Running fast', correct: 'A' },
      { q: "What is the antonym of 'Generous'?", a: 'Kind', b: 'Selfish', c: 'Giving', d: 'Helpful', correct: 'B' },
      { q: "Identify the conjunction: 'I like tea and coffee.'", a: 'like', b: 'and', c: 'tea', d: 'coffee', correct: 'B' },
      { q: 'Choose the correct sentence:', a: "They're going there too.", b: 'Their going there to.', c: 'There going their too.', d: "They're going their to.", correct: 'A' }
    ]
  },
  {
    title: 'History Final',
    subjectName: 'History',
    duration: 90,
    totalMarks: 80,
    questionMarks: 8,
    questions: [
      { q: 'Who was the first President of the United States?', a: 'Thomas Jefferson', b: 'George Washington', c: 'John Adams', d: 'Abraham Lincoln', correct: 'B' },
      { q: 'In which year did World War II end?', a: '1918', b: '1941', c: '1945', d: '1950', correct: 'C' },
      { q: 'Which empire built the Colosseum?', a: 'Greek', b: 'Roman', c: 'Persian', d: 'Egyptian', correct: 'B' },
      { q: 'Who painted the Mona Lisa?', a: 'Michelangelo', b: 'Leonardo da Vinci', c: 'Raphael', d: 'Vincent van Gogh', correct: 'B' },
      { q: 'What event triggered World War I?', a: 'Invasion of Poland', b: 'Assassination of Archduke Franz Ferdinand', c: 'Bombing of Pearl Harbor', d: 'Fall of the Berlin Wall', correct: 'B' },
      { q: 'Which document declared US independence?', a: 'Constitution', b: 'Bill of Rights', c: 'Declaration of Independence', d: 'Gettysburg Address', correct: 'C' },
      { q: 'Who was the queen of ancient Egypt allied with Julius Caesar?', a: 'Nefertiti', b: 'Cleopatra', c: 'Hatshepsut', d: 'Sobekneferu', correct: 'B' },
      { q: 'In which country did the Industrial Revolution begin?', a: 'France', b: 'Germany', c: 'United Kingdom', d: 'United States', correct: 'C' },
      { q: 'Who wrote the Communist Manifesto?', a: 'Karl Marx', b: 'Vladimir Lenin', c: 'Joseph Stalin', d: 'Leon Trotsky', correct: 'A' },
      { q: 'What was the name of the ship that brought Pilgrims to America in 1620?', a: 'Santa Maria', b: 'Mayflower', c: 'Titanic', d: 'Beagle', correct: 'B' }
    ]
  },
  {
    title: 'Programming Basics',
    subjectName: 'Computer Science',
    duration: 60,
    totalMarks: 40,
    questionMarks: 4,
    questions: [
      { q: 'What does HTML stand for?', a: 'HyperText Markup Language', b: 'HighText Machine Language', c: 'HyperText Machine Language', d: 'HighText Markup Language', correct: 'A' },
      { q: 'Which data structure operates on LIFO (Last In First Out)?', a: 'Queue', b: 'Stack', c: 'Tree', d: 'Heap', correct: 'B' },
      { q: 'What is the binary representation of decimal 5?', a: '100', b: '101', c: '110', d: '111', correct: 'B' },
      { q: 'Which language is primarily used for styling web pages?', a: 'JavaScript', b: 'HTML', c: 'CSS', d: 'PHP', correct: 'C' },
      { q: 'What is an algorithm?', a: 'A programming language', b: 'A step-by-step procedure to solve a problem', c: 'A database type', d: 'A web browser', correct: 'B' },
      { q: 'What does CPU stand for?', a: 'Central Processing Unit', b: 'Computer Personal Unit', c: 'Central Program Utility', d: 'Control Processing Unit', correct: 'A' },
      { q: 'What is the SQL command to fetch data from a table?', a: 'GET', b: 'FETCH', c: 'SELECT', d: 'QUERY', correct: 'C' },
      { q: 'Which company created JavaScript?', a: 'Netscape', b: 'Microsoft', c: 'Google', d: 'Oracle', correct: 'A' },
      { q: 'Which symbol is used for comments in Python?', a: '//', b: '/*', c: '#', d: '<!--', correct: 'C' },
      { q: 'What type of database is PostgreSQL?', a: 'NoSQL', b: 'Relational', c: 'Graph', d: 'Key-Value', correct: 'B' }
    ]
  }
];

async function main() {
  console.log('Starting DB seeding process...');

  // 1. SEED SUBJECTS
  let subjectsCount = 0;
  const subjectsMap = new Map();
  for (const subName of SUBJECTS_DATA) {
    const subject = await prisma.subject.upsert({
      where: { name: subName },
      update: {},
      create: { name: subName }
    });
    subjectsMap.set(subName, subject.id);
    subjectsCount++;
  }
  console.log(`Seeded ${subjectsCount} subjects.`);

  // 2. SEED USERS
  let usersCount = 0;
  const usersMap = new Map();

  // Passwords
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const teacherHash = await bcrypt.hash('Teacher123!', 12);
  const studentHash = await bcrypt.hash('Student123!', 12);

  const usersToSeed = [
    { fullName: 'System Admin', email: 'admin@exam.dev', passwordHash: adminHash, role: 'ADMIN' },
    { fullName: 'Teacher One', email: 'teacher1@exam.dev', passwordHash: teacherHash, role: 'TEACHER' },
    { fullName: 'Teacher Two', email: 'teacher2@exam.dev', passwordHash: teacherHash, role: 'TEACHER' },
    { fullName: 'Teacher Three', email: 'teacher3@exam.dev', passwordHash: teacherHash, role: 'TEACHER' },
    { fullName: 'Student One', email: 'student1@exam.dev', passwordHash: studentHash, role: 'STUDENT' },
    { fullName: 'Student Two', email: 'student2@exam.dev', passwordHash: studentHash, role: 'STUDENT' },
    { fullName: 'Student Three', email: 'student3@exam.dev', passwordHash: studentHash, role: 'STUDENT' },
    { fullName: 'Student Four', email: 'student4@exam.dev', passwordHash: studentHash, role: 'STUDENT' },
    { fullName: 'Student Five', email: 'student5@exam.dev', passwordHash: studentHash, role: 'STUDENT' },
    { fullName: 'Student Six', email: 'student6@exam.dev', passwordHash: studentHash, role: 'STUDENT' }
  ];

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        fullName: u.fullName,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        provider: 'LOCAL',
        emailVerified: true,
        isActive: true
      }
    });
    usersMap.set(u.email, user.id);
    usersCount++;
  }
  console.log(`Seeded ${usersCount} users.`);

  // Get Teacher 1 ID
  const teacher1Id = usersMap.get('teacher1@exam.dev');
  const student1Id = usersMap.get('student1@exam.dev');
  const student2Id = usersMap.get('student2@exam.dev');

  // Time metrics
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 3. & 4. SEED EXAMS & QUESTIONS
  let examsCount = 0;
  let questionsCount = 0;
  const examIds = [];

  for (const ex of EXAMS_DATA) {
    const subjectId = subjectsMap.get(ex.subjectName);

    // Check-before-insert for exam
    let exam = await prisma.exam.findFirst({
      where: { title: ex.title, createdBy: teacher1Id }
    });

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          title: ex.title,
          subjectId,
          duration: ex.duration,
          totalMarks: ex.totalMarks,
          createdBy: teacher1Id,
          startTime: oneDayAgo,
          endTime: thirtyDaysLater,
          status: 'PUBLISHED'
        }
      });
    }
    examIds.push({ id: exam.id, details: ex });
    examsCount++;

    // Seed questions for this exam
    for (let i = 0; i < ex.questions.length; i++) {
      const q = ex.questions[i];
      // Check if question already exists
      const existingQuestion = await prisma.question.findFirst({
        where: { examId: exam.id, question: q.q }
      });

      if (!existingQuestion) {
        await prisma.question.create({
          data: {
            examId: exam.id,
            question: q.q,
            optionA: q.a,
            optionB: q.b,
            optionC: q.c,
            optionD: q.d,
            correctOption: q.correct,
            marks: ex.questionMarks
          }
        });
      }
      questionsCount++;
    }
  }
  console.log(`Seeded ${examsCount} exams.`);
  console.log(`Seeded ${questionsCount} questions.`);

  // 5. & 6. SEED ATTEMPTS & ANSWERS
  let attemptsCount = 0;
  let answersCount = 0;

  for (const examInfo of examIds) {
    const examId = examInfo.id;
    const qMarks = examInfo.details.questionMarks;

    // Load exam questions from DB to align IDs
    const dbQuestions = await prisma.question.findMany({
      where: { examId }
    });

    const students = [
      { id: student1Id, email: 'student1@exam.dev', targetRate: 0.7 },
      { id: student2Id, email: 'student2@exam.dev', targetRate: 0.5 }
    ];

    for (const stud of students) {
      // Check if attempt already exists
      let attempt = await prisma.attempt.findUnique({
        where: {
          uq_student_exam: {
            studentId: stud.id,
            examId
          }
        }
      });

      if (!attempt) {
        // Tally score & prepare answers insertion
        let calculatedScore = 0;
        const answersToInsert = [];

        // Apply correct answer rate (deterministic placement)
        // student1 gets 7/10 correct, student2 gets 5/10 correct
        const correctCount = stud.targetRate === 0.7 ? 7 : 5;

        for (let i = 0; i < dbQuestions.length; i++) {
          const question = dbQuestions[i];
          const shouldBeCorrect = i < correctCount;
          let selectedOption = question.correctOption;

          if (!shouldBeCorrect) {
            // Find a wrong option
            const options = ['A', 'B', 'C', 'D'];
            selectedOption = options.find(o => o !== question.correctOption);
          } else {
            calculatedScore += question.marks;
          }

          answersToInsert.push({
            questionId: question.id,
            selectedOption
          });
        }

        // Create the attempt record (SUBMITTED status)
        attempt = await prisma.attempt.create({
          data: {
            studentId: stud.id,
            examId,
            status: 'SUBMITTED',
            startTime: new Date(oneDayAgo.getTime() + 10 * 60 * 1000), // 10 mins after start time
            submitTime: new Date(oneDayAgo.getTime() + 35 * 60 * 1000), // 35 mins after start time
            score: calculatedScore
          }
        });

        // Insert student answers linked to this attempt
        for (const ans of answersToInsert) {
          await prisma.answer.create({
            data: {
              attemptId: attempt.id,
              questionId: ans.questionId,
              selectedOption: ans.selectedOption
            }
          });
          answersCount++;
        }
      }
      attemptsCount++;
    }
  }
  console.log(`Seeded ${attemptsCount} exam attempts.`);
  console.log(`Seeded ${answersCount} answer selections.`);

  // 7. SEED AUDIT LOGS
  const adminId = usersMap.get('admin@exam.dev');
  const mockAuditLogs = [
    { userId: adminId, action: 'LOGIN', ipAddress: '127.0.0.1', device: 'Chrome / macOS' },
    { userId: teacher1Id, action: 'EXAM_CREATED', ipAddress: '192.168.1.5', device: 'Safari / iPadOS' },
    { userId: teacher1Id, action: 'EXAM_PUBLISHED', ipAddress: '192.168.1.5', device: 'Safari / iPadOS' },
    { userId: student1Id, action: 'LOGIN', ipAddress: '10.0.0.12', device: 'Firefox / Linux' },
    { userId: student1Id, action: 'EXAM_STARTED', ipAddress: '10.0.0.12', device: 'Firefox / Linux' },
    { userId: student1Id, action: 'EXAM_SUBMITTED', ipAddress: '10.0.0.12', device: 'Firefox / Linux' }
  ];

  let logsCount = 0;
  for (const log of mockAuditLogs) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        ipAddress: log.ipAddress,
        device: log.device
      }
    });
    logsCount++;
  }
  console.log(`Seeded ${logsCount} audit logs.`);

  console.log('\n==========================================');
  console.log('Seeding summary complete!');
  console.log(`Seeded: ${subjectsCount} subjects, ${usersCount} users, ${examsCount} exams, ${questionsCount} questions, ${attemptsCount} attempts, ${answersCount} answers`);
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('Error during seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
