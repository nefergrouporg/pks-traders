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
    const { username, password, email, phone, role, branchId, salary } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      phone,
      role,
      branchId,
      salary, // Make sure your model includes this field
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: `User ${user.active ? "activated" : "blocked"} successfully`,
      active: user.isBlocked,
    });
  } catch (error) {
    console.log("error from toggling staff", error)
    res.status(500).json({error: "Server eroor"})
  }
}

  exports.salaryCredit = async (req, res) => {
    const { id } = req.body
    try {
      const [updatedRowCount, updatedUsers] = await User.update(
        { salaryCredited: true }, 
        { 
          where: { id }, 
          returning: true // This ensures PostgreSQL returns the updated user
        }
      );
  
      if (updatedRowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ 
        message: "✅ Salary marked as paid", 
        user: updatedUsers[0] // Sending back updated user data
      });
    } catch (error) {
      console.log('error from salary credit controller', error)
      res.status(500).json({error:"Server Error"})
    }
  }

