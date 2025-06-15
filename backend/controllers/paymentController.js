const { Payment, Sale } = require("../models/index");

exports.confirmPaymentById = async (req, res) => {
  const paymentId = req.params.id;
  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending")
      return res.status(400).json({ error: "Payment is not pending" });
    payment.status = "completed";
    await payment.save();
    res.json({ message: "Payment confirmed" });
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { saleId, paymentMethod, upiTransactionId, cardApprovalCode } =
      req.body;

    const payment = await Payment.findOne({
      where: { saleId },
      include: [
        {
          model: Sale,
          as: "sale",
          required: false,
        },
      ],
    });
    if (!payment) throw new Error("Payment not found");

    payment.status = "completed";
    if (paymentMethod === "upi" && upiTransactionId)
      payment.upiTransactionId = upiTransactionId;
    if (paymentMethod === "card" && cardApprovalCode)
      payment.cardApprovalCode = cardApprovalCode;

    await payment.save();
    res.json({ message: "Payment confirmed", payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// fetch payment status by saleId
exports.getPaymentBySaleId = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { saleId: req.params.saleId },
      include: [
        {
          model: Sale,
          as: "sale",
          required: false,
        },
      ],
    });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
