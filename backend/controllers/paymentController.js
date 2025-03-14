const { Payment, Sale } = require('../models/index');
const { createPaymentOrder, handleWebhook } = require('../utils/paymentGateway');

// Initiate a payment
exports.initiatePayment = async (req, res) => {
  try {
    const { saleId, amount, paymentMethod } = req.body;

    // Create payment order
    const paymentOrder = await createPaymentOrder(amount);

    // Create payment record
    const payment = await Payment.create({
      amount,
      status: 'pending',
      paymentMethod,
      saleId,
      userId: req.user.id,
    });

    res.json({ message: 'Payment initiated', paymentOrder, payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Handle payment webhook
exports.handlePaymentWebhook = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    // Update payment status
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();

    res.json({ message: 'Payment status updated', payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};