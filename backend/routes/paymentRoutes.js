const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/initiatePayment', paymentController.initiatePayment);
router.post("/handlePaymentWebhook", paymentController.handlePaymentWebhook);

module.exports = router;