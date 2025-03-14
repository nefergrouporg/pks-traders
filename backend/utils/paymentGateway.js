const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');

const instance = new Razorpay({
  key_id: "process.env.RAZORPAY_KEY",
  key_secret: process.env.RAZORPAY_SECRET
});

exports.createPaymentOrder = async (amount) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: uuidv4(),
    payment_capture: 1
  };
  
  try {
    const response = await instance.orders.create(options);
    return response;
  } catch (error) {
    throw new Error(error);
  }
};
