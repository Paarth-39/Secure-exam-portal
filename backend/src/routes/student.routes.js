const express = require('express');
const router = express.Router();
const student = require('../controllers/student.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { examSubmitLimiter } = require('../middlewares/rateLimit');

// Guard all student routes
router.use(authenticate, authorize('STUDENT'));

// Profile routes
router.get('/profile', student.getProfile);
router.put('/profile', student.updateProfile);

// Exam browsing & attempt sitting routes
router.get('/exams', student.getAvailableExams);
router.post('/exam/start', student.startExam);
router.post('/exam/submit', examSubmitLimiter, student.submitExam);

// Results routes
router.get('/results', student.getMyResults);
router.get('/results/:attemptId', student.getResultDetail);

module.exports = router;
