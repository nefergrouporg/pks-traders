const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', userController.getAllUsers);
router.post('/', auth, userController.createUser);
router.put('/toggle-block/:id', auth, userController.toggleUser)
router.put('/salaryCredit', auth, userController.salaryCredit)

module.exports = router;
