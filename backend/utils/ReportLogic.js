const { Op } = require("sequelize");
const { sequelize, SaleItem, Payment, Sale } = require("../models/index");
const { formatISO } = require("date-fns");
const { toZonedTime, format } = require("date-fns-tz");

exports.getReportDataLogic = async (startDate, endDate, branchId) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const groupByFormat = "YYYY-MM-DD";
  const dateInterval = "day";

  const dateArray = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateArray.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const whereConditions = {
    createdAt: { [Op.between]: [start, end] },
  };

  // Add branch filtering if branchId is provided
  if (branchId) {
    whereConditions.branchId = branchId;
  }

  // 1. Get Sales Aggregated Data
  const salesData = await Sale.findAll({
    attributes: [
      [
        sequelize.fn(
          "TO_CHAR",
          sequelize.literal(`"Sale"."createdAt" AT TIME ZONE 'UTC'`),
          groupByFormat
        ),
        "period",
      ],
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalSales"],
      [sequelize.fn("COUNT", sequelize.col("Sale.id")), "transactionCount"],
      // Payment method breakdowns
      [
        sequelize.literal(
          `SUM(CASE WHEN "paymentMethod" = 'cash' THEN "totalAmount" ELSE 0 END)`
        ),
        "cashSales",
      ],
      [
        sequelize.literal(
          `SUM(CASE WHEN "paymentMethod" = 'card' THEN "totalAmount" ELSE 0 END)`
        ),
        "cardSales",
      ],
      [
        sequelize.literal(
          `SUM(CASE WHEN "paymentMethod" = 'upi' THEN "totalAmount" ELSE 0 END)`
        ),
        "upiSales",
      ],
      [
        sequelize.literal(
          `COUNT(CASE WHEN "paymentMethod" = 'cash' THEN 1 END)`
        ),
        "cashTransactions",
      ],
      [
        sequelize.literal(
          `COUNT(CASE WHEN "paymentMethod" = 'card' THEN 1 END)`
        ),
        "cardTransactions",
      ],
      [
        sequelize.literal(
          `COUNT(CASE WHEN "paymentMethod" = 'upi' THEN 1 END)`
        ),
        "upiTransactions",
      ],
    ],
    include: [
      {
        model: Payment,
        as: "payments",
        attributes: [],
      },
    ],
    where: whereConditions,
    group: [sequelize.literal("1")],
    order: [[sequelize.literal("period"), "ASC"]],
    raw: true,
  });

  // 2. Get Sale Items Aggregated Data
  const saleItemsData = await SaleItem.findAll({
    attributes: [
      [
        sequelize.fn(
          "TO_CHAR",
          sequelize.literal(`"sale"."createdAt" AT TIME ZONE 'UTC'`),
          groupByFormat
        ),
        "period",
      ],
    ],
    include: [
      {
        model: Sale,
        as: "sale",
        attributes: [],
        where: whereConditions,
      },
    ],
    group: ["period"],
    raw: true,
  });

  // 3. Get Payment Status Aggregated Data
  const paymentStatusData = await Payment.findAll({
    attributes: [
      [
        sequelize.fn(
          "TO_CHAR",
          sequelize.literal(`"Payment"."createdAt" AT TIME ZONE 'UTC'`),
          groupByFormat
        ),
        "period",
      ],
      [
        sequelize.literal(`COUNT(CASE WHEN status = 'completed' THEN 1 END)`),
        "completedPayments",
      ],
      [
        sequelize.literal(`COUNT(CASE WHEN status = 'pending' THEN 1 END)`),
        "pendingPayments",
      ],
      [
        sequelize.literal(`COUNT(CASE WHEN status = 'failed' THEN 1 END)`),
        "failedPayments",
      ],
    ],
    group: ["period"],
    include: [
      {
        model: Sale,
        as: "sale", // Correct alias usage here
        attributes: [],
        required: true,
        where: whereConditions,
      },
    ],
    raw: true,
  });

  // Merge all data into a single object
  const mergedData = {};
  salesData.forEach((item) => (mergedData[item.period] = { ...item }));
  //   saleItemsData.forEach((item) => {
  //     if (mergedData[item.period]) {
  //       mergedData[item.period].totalQuantity = item.totalQuantity;
  //     }
  //   });
  paymentStatusData.forEach((item) => {
    if (mergedData[item.period]) {
      mergedData[item.period].completedPayments = item.completedPayments;
      mergedData[item.period].pendingPayments = item.pendingPayments;
      mergedData[item.period].failedPayments = item.failedPayments;
    }
  });

  // Format final data with all periods
  const timeZone = "Asia/Kolkata";
  return dateArray.map((date) => {
    const zonedDate = toZonedTime(date, timeZone);
    const periodKey = formatISO(zonedDate, { representation: "date" });
    const label = format(zonedDate, "MMM dd, yyyy");

    const data = mergedData[periodKey] || {};
    return {
      period: periodKey,
      label,
      totalSales: data.totalSales || 0,
      transactionCount: data.transactionCount || 0,
      cashSales: data.cashSales || 0,
      cardSales: data.cardSales || 0,
      upiSales: data.upiSales || 0,
      cashTransactions: data.cashTransactions || 0,
      cardTransactions: data.cardTransactions || 0,
      upiTransactions: data.upiTransactions || 0,
      completedPayments: data.completedPayments || 0,
      pendingPayments: data.pendingPayments || 0,
      failedPayments: data.failedPayments || 0,
    };
  });
};
