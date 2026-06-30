const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Guard all admin routes
router.use(authenticate, authorize('ADMIN'));

// User management endpoints
router.get('/users', admin.getUsers);
router.put('/users/block', admin.blockUser);
router.put('/users/role', admin.changeRole);
router.delete('/users/:userId', admin.deleteUser);

// Audit logging
router.get('/logs', admin.getLogs);

// Subject endpoints
router.post('/subjects', admin.createSubject);
router.get('/subjects', admin.getSubjects); // Accessible by admin to list all subjects

module.exports = router;
