const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/sales-data", dashboardController.getSalesChartData);
router.get('/export-sales-data', dashboardController.exportSalesData);
router.get("/stats", dashboardController.getStats);
router.get("/sales-data", dashboardController.getSalesData);
router.get("/recent-transactions", dashboardController.getRecentTransactions);

module.exports = router;
