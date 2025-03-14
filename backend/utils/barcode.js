const { Product } = require('../models/');
const { randomInt } = require('crypto');

// EAN-13 Checksum Calculator
const calculateChecksum = (digits) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
};

// Generate unique EAN-13 barcode
exports.generateBarcode = async () => {
  let barcode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 12 random digits
    const randomPart = randomInt(0, 999999999999).toString().padStart(12, '0');
    const checksum = calculateChecksum(randomPart);
    barcode = randomPart + checksum;

    // Check if barcode exists in database
    const existingProduct = await Product.findOne({ where: { barcode } });
    if (!existingProduct) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique barcode after multiple attempts');
  }

  return barcode;
};