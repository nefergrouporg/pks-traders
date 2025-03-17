const { User } = require("../models/index");
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await User.findAll({ where: { role } });
    res.json({ users });
  } catch (error) {
    console.log(error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, email, phone, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      phone,
      role
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

