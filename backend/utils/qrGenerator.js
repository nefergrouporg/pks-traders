const QRCode = require("qrcode");


exports.generatePaymentQR = async (saleId, amount) => {
  // Construct UPI deep link with dynamic amount
  const upiLink = `upi://pay?pa=sadhik8129@okaxis&pn=Adnan&am=${amount}&cu=INR`;

  try {
    return await QRCode.toDataURL(upiLink);
  } catch (err) {
    throw new Error("QR generation failed");
  }
};
