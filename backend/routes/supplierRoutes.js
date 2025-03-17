
const express = require('express');
const router = express.Router();
const supplierController  = require('../controllers/supplierController');
const { auth, role } = require('../middleware/authMiddleware');

router.post('/', auth, role('admin'),supplierController.createSupplier)
router.put('/:id/toggle-block', auth, role('admin'),supplierController.toggleBlockSupplier)
router.get('/', supplierController.getAllSuppliers)

module.exports = router;