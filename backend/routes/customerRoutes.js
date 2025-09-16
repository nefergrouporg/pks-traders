const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, customerController.createCustomer)
router.get('/', auth, customerController.getCustomers)
// Customer details with full sales history
router.get('/:id/details', auth, customerController.getCustomerDetails);

// Customer sales history only (paginated)
router.get('/:id/sales', auth, customerController.getCustomerSales);
router.put('/debt/:id', auth, customerController.updateCustomer)
router.put('/update', auth, customerController.editCustomer)
// router.put('/details', auth, customerController.getCustomerById)


module.exports = router;