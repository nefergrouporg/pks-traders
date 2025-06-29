const models = require("../models/index");
const { User, Branch } = models;
const sequelize = models.sequelize;
const { SalaryPayment } = require("../models/index");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
    //   where: { role: req.query.role },
      include: [
        {
          model: Branch,
          attributes: ["name"],
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(amount), 0)
              FROM "SalaryPayments"
              WHERE "SalaryPayments"."userId" = "User"."id"
                AND type = 'advance'
            )`),
            "totalAdvances",
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(amount), 0)
              FROM "SalaryPayments"
              WHERE "SalaryPayments"."userId" = "User"."id"
                AND type = 'incentive'
            )`),
            "totalIncentives",
          ],
        ],
      },
    });

    const usersWithRemaining = users.map((user) => ({
      ...user.toJSON(),
      remainingSalary: user.salary - user.dataValues.totalAdvances,
    }));

    res.json({ users: usersWithRemaining });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
      gender,
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
  const { userId, amount, paymentDate, notes } = req.body;
  const currentMonth = moment(paymentDate).format("MMMM YYYY");

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get existing advances for current month
    const existingAdvances =
      (await SalaryPayment.sum("amount", {
        where: {
          userId,
          month: currentMonth,
          type: "advance",
        },
      })) || 0;

    const baseSalary = user.salary;
    const remainingSalary = baseSalary - existingAdvances;

    // Calculate payment breakdown
    const payments = [];
    const advancePayment = Math.min(amount, remainingSalary);
    const incentivePayment = Math.max(amount - remainingSalary, 0);

    if (advancePayment > 0) {
      payments.push({
        userId: userId, // Add this line
        type: "advance",
        amount: advancePayment,
        month: currentMonth,
        paidAt: paymentDate,
        notes,
      });
    }

    if (incentivePayment > 0) {
      payments.push({
        userId: userId, // Add this line
        type: "incentive",
        amount: incentivePayment,
        month: currentMonth,
        paidAt: paymentDate,
        notes,
      });
    }

    // Create payments
    const createdPayments = await SalaryPayment.bulkCreate(payments);

    res.status(201).json({
      message: "Payment processed successfully",
      payments: createdPayments,
      summary: {
        totalAdvances: existingAdvances + advancePayment,
        totalIncentives: incentivePayment,
        remainingSalary: baseSalary - (existingAdvances + advancePayment),
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.salaryHistory = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const history = await SalaryPayment.findAll({
      where: { userId: id },
      order: [["paidAt", "DESC"]],
      attributes: ["id", "userId", "amount", "type", "paidAt", "month"],
    });

    // Format the response for better readability
    const formattedHistory = history.map((payment) => ({
      ...payment.toJSON(),
      paidAt: payment.paidAt.toISOString().split("T")[0], // Format date
      type: payment.type.toUpperCase(),
    }));

    res.json({
      count: history.length,
      totalAdvance:
        (await SalaryPayment.sum("amount", {
          where: { userId: id, type: "advance" },
        })) || 0,
      totalIncentive:
        (await SalaryPayment.sum("amount", {
          where: { userId: id, type: "incentive" },
        })) || 0,
      payments: formattedHistory,
    });
  } catch (err) {
    console.error("Salary history fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch salary history",
      details: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isDeleted = !user.isDeleted;
    await user.save();

    res.status(200).json({ message: `User Deleted successfully` });
  } catch (error) {
    console.log("error from toggling staff", error);
    res.status(500).json({ error: "Server eroor" });
  }
};
