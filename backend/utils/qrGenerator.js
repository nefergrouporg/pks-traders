const QRCode = require("qrcode");
const { ProjectConfig } = require("../models");

exports.generatePaymentQR = async (saleId, amount) => {
  try {
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    // Get configuration
    const config = await ProjectConfig.findOne();
    
    if (!config) {
      throw new Error("Payment configuration not found in database");
    }
    if (!config.upiId) {
      throw new Error("UPI ID is not configured in system settings");
    }

    // Construct UPI link
    const upiLink = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=PKStraders&am=${amount.toFixed(2)}&cu=INR&tn=Sale${saleId}`;

    // Generate QR code
    const qrData = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8
    });
    
    return qrData;
  } catch (err) {
    console.error('QR generation error details:', {
      error: err.message,
      stack: err.stack,
      saleId,
      amount
    });
    throw new Error("QR generation failed: " + err.message);
  }
};
