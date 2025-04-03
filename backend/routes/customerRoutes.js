const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, customerController.createCustomer)
router.get('/', auth, customerController.getCustomers)
router.put('/debt/:id', auth, customerController.updateCustomerDebt)


module.exports = router;