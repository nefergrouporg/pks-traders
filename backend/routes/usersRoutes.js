const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', userController.getAllUsers);
router.post('/', auth, userController.createUser);

module.exports = router;
