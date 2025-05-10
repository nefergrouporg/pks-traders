const express = require('express');
const router = express.Router();
const stockEntryController = require('../controllers/stockEntryController');
const { auth, role } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');


router.post('/', auth, stockEntryController.createStockEntry);
router.get('/', stockEntryController.getAllStockEntry);
router.post('/bulk-upload', upload.single('file'), stockEntryController.bulkImportStockEntries);
router.put('/:id', auth, stockEntryController.editStockEntry);


module.exports = router;
