const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', userController.getAllUsers);
router.post('/', auth, userController.createUser);
router.put('/toggle-block/:id', auth, userController.toggleUser)
router.post('/salaryCredit', auth, userController.salaryCredit)
router.get('/salary-history/:id', auth, userController.salaryHistory);


module.exports = router;
