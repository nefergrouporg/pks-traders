const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Branch } = require('../models/index');
const { JWT_SECRET } = require('../config/env')

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, email, role, phone } = req.body;
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      role,
      phone,
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login a user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find the user
    const user = await User.findOne({ where: { username }, include: [{model: Branch, attributes: ["id", "name", "address", "phone"]}] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        branch_name: user.Branch.name, 
        branch_id: user.Branch.id,
        branch_address: user.Branch.address,
        branch_phone: user.Branch.phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message });
  }
};

exports.validateToken = async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
