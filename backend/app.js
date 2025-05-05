const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const saleRoutes = require("./routes/saleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const usersRoutes = require("./routes/usersRoutes");
const configRoutes = require("./routes/projectConfigRoutes");
const customerRoutes = require("./routes/customerRoutes");
const branchRouter = require("./routes/branchRoutes");
const StockEntry = require("./routes/entryStockRouter");
const models = require("./models");
// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "https://pkstraders.in", // Frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow these HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Allow cookies or credentials to be sent
  })
);
app.use(morgan("dev")); // Logging
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/config", configRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/branches", branchRouter);
app.use("/api/entryStock", StockEntry);

sequelize.sync().then(() => {
  cron.schedule("0 0 1 * *", async () => {
    try {
      const users = await User.findAll({
        where: { role: "staff", isBlocked: false },
      });
      const month = moment().format("MMMM YYYY");

      for (const user of users) {
        await SalaryPayment.create({
          userId: user.id,
          amount: user.salary,
          month,
        });

        await user.update({ salaryCredited: false });
      }

      console.log(`✅ Salary records created and flags reset for ${month}`);
    } catch (err) {
      console.error("❌ Cron job error:", err);
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Sync database

// Sync database
models.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✅ Database synced");
  })
  .catch((err) => {
    console.error("❌ Error syncing database:", err);
  });

module.exports = app; // Export the app for use in server.js
