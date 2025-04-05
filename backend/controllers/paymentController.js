const { Payment, Sale } = require('../models/index');

exports.confirmPayment = async (req, res) => {
  try {
    const { saleId, paymentMethod, upiTransactionId, cardApprovalCode } = req.body;
    
    const payment = await Payment.findOne({ where: { saleId } });
    if (!payment) throw new Error('Payment not found');

    payment.status = 'completed';
    if (paymentMethod === 'upi' && upiTransactionId) payment.upiTransactionId = upiTransactionId;
    if (paymentMethod === 'card' && cardApprovalCode) payment.cardApprovalCode = cardApprovalCode;
    
    await payment.save();
    res.json({ message: 'Payment confirmed', payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// fetch payment status by saleId
exports.getPaymentBySaleId = async (req, res) => {
  try {
    const payment = await Payment.findOne({ where: { saleId: req.params.saleId } });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}