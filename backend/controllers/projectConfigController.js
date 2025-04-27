const { ProjectConfig } = require('../models');

// Get UPI ID
exports.getUpiId = async (req, res) => {
  try {
    const config = await ProjectConfig.findOne();
    if (config) {
      res.json({ upiId: config.upiId });
    } else {
      res.status(404).json({ message: 'UPI ID not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching UPI ID', error });
  }
};

// Set UPI ID
exports.setUpiId = async (req, res) => {
  const { upiId } = req.body;
  try {
    let config = await ProjectConfig.findOne();
    if (config) {
      config.upiId = upiId;
      await config.save();
    } else {
      config = await ProjectConfig.create({ upiId });
    }
    res.json({ message: 'UPI ID updated successfully', config });
  } catch (error) {
    console.error('Error saving UPI ID:', error);
    res.status(500).json({ message: 'Error setting UPI ID', error: error.message });
  }
};

















