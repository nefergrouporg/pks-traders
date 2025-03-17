const QRCode = require("qrcode");
const { ProjectConfig } = require("../models");

exports.generatePaymentQR = async (saleId, amount) => {
  try {
    const config = await ProjectConfig.findOne();
    if (!config || !config.upiId) {
      throw new Error("UPI ID not found in the database");
    }

    const upiLink = `upi://pay?pa=${config.upiId}&pn=PKStraders&am=${amount}&cu=INR`;

    // Generate QR code
    return await QRCode.toDataURL(upiLink);
  } catch (err) {
    throw new Error("QR generation failed: " + err.message);
  }
};
