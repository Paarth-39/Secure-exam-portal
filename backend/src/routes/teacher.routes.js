const express = require('express');
const router = express.Router();
const teacher = require('../controllers/teacher.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const {
  createExamSchema,
  updateExamSchema,
  createQuestionSchema
} = require('../validators/exam.schema');

// Guard all teacher routes
router.use(authenticate, authorize('TEACHER'));

// Exam routes
router.post('/exams', teacher.createExam);
router.get('/exams', teacher.getMyExams);
router.get('/exams/:id', teacher.getExamById);
router.put('/exams/:id', validate(updateExamSchema), teacher.updateExam);
router.delete('/exams/:id', teacher.deleteExam);
router.put('/exams/:id/publish', teacher.publishExam);
router.get('/exams/:id/results', teacher.getExamResults);
router.get('/subjects', teacher.getSubjects);

// Question routes
router.post('/questions', validate(createQuestionSchema), teacher.addQuestion);
router.put('/questions/:id', teacher.updateQuestion);
router.delete('/questions/:id', teacher.deleteQuestion);

module.exports = router;
