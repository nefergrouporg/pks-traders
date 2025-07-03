const { Op } = require("sequelize");
const {
    Product,
    Sale,
    Payment,
    SaleItem,
    sequelize,
} = require("../models/index");
const { getSalesChartDataLogic } = require("../utils/salesChartLogic");

const XLSX = require("xlsx");
const { getReportDataLogic } = require("../utils/ReportLogic");

exports.getSalesChartData = async (req, res) => {
    try {
        const { period = "daily", paymentMethod, branchId } = req.query;
        const formattedData = await getSalesChartDataLogic(period, paymentMethod, branchId);
        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getStats = async (req, res) => {
    try {
        const { branchId } = req.query;

        // Build where clause for branch filtering
        const whereClause = {};
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const now = new Date();
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0);

        whereClause.createdAt = { [Op.between]: [startOfWeek, now] };

        const [totalSales, lowStockCount, lowStockProducts, pendingPayments] = await Promise.all([
            Sale.sum("totalAmount", { where: whereClause }),
            Product.count({
                where: {
                    stock: { [Op.lt]: sequelize.col("lowStockThreshold") }
                },
            }),
            Product.findAll({
                where: {
                    stock: { [Op.lt]: sequelize.col("lowStockThreshold") }
                },
                attributes: ["name", "stock"],
            }),
            Payment.count({
                where: {
                    status: "pending"
                },
                include: branchId ? [{
                    model: Sale,
                    as: 'sale',
                    where: { branchId },
                    attributes: []
                }] : undefined
            }),
        ]);

        res.json({ totalSales, lowStockCount, lowStockProducts, pendingPayments });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getSalesData = async (req, res) => {
    try {
        const { branchId } = req.query;

        const whereClause = {};
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const salesData = await Sale.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
                [sequelize.fn("SUM", sequelize.col("totalAmount")), "total"],
            ],
            group: ["date"],
            order: [["date", "ASC"]],
            limit: 7,
        });

        res.json(salesData);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getRecentTransactions = async (req, res) => {
    try {
        const { branchId } = req.query;

        const whereClause = {};
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const transactions = await Sale.findAll({
            where: whereClause,
            include: [{ model: Payment, as: 'payments' }],
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching recent transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.exportSalesData = async (req, res) => {
    try {
        const { startDate, endDate, format, branchId } = req.query;
        const formattedData = await getReportDataLogic(startDate, endDate, branchId);

        // Common headers structure
        const originalHeaders = [
            "Date",
            "Label",
            "Total Sales",
            "Transaction Count",
            "Cash Sales",
            "Card Sales",
            "UPI Sales",
            "Cash Transactions",
            "Card Transactions",
            "UPI Transactions",
            "Completed Payments",
            "Pending Payments",
            "Failed Payments",
        ];

        if (format === "xlsx") {
            // XLSX-specific formatting with merged cells
            const worksheetData = [
                [
                    // Main headers
                    "Date",
                    "Label",
                    "Total Sales",
                    "Transaction Count",
                    "Sales",
                    "",
                    "",
                    "Transactions",
                    "",
                    "",
                    "Payments",
                    "",
                    "",
                ],
                [
                    // Sub headers
                    "",
                    "",
                    "",
                    "",
                    "Cash Sales",
                    "Card Sales",
                    "UPI Sales",
                    "Cash Transactions",
                    "Card Transactions",
                    "UPI Transactions",
                    "Completed Payments",
                    "Pending Payments",
                    "Failed Payments",
                ],
                ...formattedData.map((item) => [
                    item.period,
                    item.label,
                    item.totalSales,
                    item.transactionCount,
                    item.cashSales,
                    item.cardSales,
                    item.upiSales,
                    item.cashTransactions,
                    item.cardTransactions,
                    item.upiTransactions,
                    item.completedPayments,
                    item.pendingPayments,
                    item.failedPayments,
                ]),
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            worksheet["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Date
                { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Label
                { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Total Sales
                { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Transaction Count
                { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // Sales
                { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } }, // Transactions
                { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } }, // Payments
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Data");
            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=sales-export.xlsx"
            );
            return res.send(buffer);
        } else {
            // CSV format
            const csvContent = [
                '"Date","Label","Total Sales","Transaction Count","Sales","","","Transactions","","","Payments","",""',
                '"","","","","Cash Sales","Card Sales","UPI Sales","Cash Transactions","Card Transactions","UPI Transactions","Completed Payments","Pending Payments","Failed Payments"',
                ...formattedData.map(
                    (item) =>
                        `"${item.period}","${item.label}",${item.totalSales},${item.transactionCount},` +
                        `${item.cashSales},${item.cardSales},${item.upiSales},` +
                        `${item.cashTransactions},${item.cardTransactions},${item.upiTransactions},` +
                        `${item.completedPayments},${item.pendingPayments},${item.failedPayments}`
                ),
            ].join("\n");

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=sales-export.csv"
            );
            return res.send(csvContent);
        }
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

