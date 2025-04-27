
const express = require('express');
const router = express.Router();
const supplierController  = require('../controllers/supplierController');
const { auth, role } = require('../middleware/authMiddleware');

router.post('/', auth, role('admin'),supplierController.createSupplier)
router.put('/:id/toggle-block', auth, role('admin'),supplierController.toggleBlockSupplier)
router.get('/', supplierController.getAllSuppliers)
router.put('/update', auth, supplierController.editSupplier)
router.delete('/:id', auth, supplierController.deleteSupplier)
router.get('/:id/history', auth, supplierController.getSupplierHistory);



module.exports = router;