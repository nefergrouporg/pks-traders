const { User } = require("../models/index");
const { SalaryPayment } = require("../models/index");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op } = require('sequelize');

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
    const {
      username,
      password,
      email,
      phone,
      role,
      branchId,
      salary,
      aadharNumber,
      address,
      age,
      gender,
    } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { aadharNumber }],
      },
    });

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
      salary,
      aadharNumber,
      address,
      age,
      gender
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params;
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
    console.log("error from toggling staff", error);
    res.status(500).json({ error: "Server eroor" });
  }
};

exports.salaryCredit = async (req, res) => {
  const { userId, amount, paymentDate, status } = req.body;
  const currentMonth = moment(paymentDate).format("MMMM YYYY"); // format from frontend date

  try {
    // 1. Upsert salary payment for this user and month
    let payment = await SalaryPayment.findOne({
      where: { userId, month: currentMonth },
    });

    if (!payment) {
      payment = await SalaryPayment.create({
        userId,
        amount,
        month: currentMonth,
        status,
        paidAt: new Date(paymentDate),
      });
    } else {
      await payment.update({
        amount,
        status,
        paidAt: new Date(paymentDate),
      });
    }

    // 2. Update the user's salaryCredited flag
    const [updatedCount] = await User.update(
      { salaryCredited: true },
      { where: { id: userId } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(201).json({
      message: "✅ Salary payment recorded and user marked as paid",
      payment,
    });
  } catch (error) {
    console.error("❌ Error processing salary credit:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};


exports.salaryHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const history = await SalaryPayment.findAll({
      where: { userId: id },
      order: [["month", "DESC"]],
    });
    res.json(history);
  } catch (err) {
    console.error("Salary history fetch error", err);
    res.status(500).json({ error: "Server error" });
  }
};
