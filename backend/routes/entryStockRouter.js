const express = require('express');
const router = express.Router();
const stockEntryController = require('../controllers/stockEntryController');
const { auth, role } = require('../middleware/authMiddleware');

router.post('/', auth, stockEntryController.createStockEntry);
router.get('/', stockEntryController.getAllStockEntry);

module.exports = router;
