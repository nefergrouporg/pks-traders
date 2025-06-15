const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post("/confirm", paymentController.confirmPayment);
router.get("/sale/:saleId", paymentController.getPaymentBySaleId);
router.put('/:id/confirm', paymentController.confirmPaymentById);

module.exports = router;