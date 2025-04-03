const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, branchController.createBranch)
router.put('/:id', auth, branchController.blockBranch)
router.get('/', branchController.getBranches)

module.exports = router;