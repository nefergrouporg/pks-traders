const express = require('express');
const router = express.Router();
const projectConfigController = require('../controllers/projectConfigController');
const { auth, role } = require('../middleware/authMiddleware');

// UPI ID routes
router.get('/upi-id', auth, role('admin'), projectConfigController.getUpiId);
router.post('/upi-id', auth, role('admin'), projectConfigController.setUpiId);

module.exports = router;