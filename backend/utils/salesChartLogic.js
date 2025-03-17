const { Op } = require("sequelize");
const { sequelize, Sale } = require("../models/index");
const { toZonedTime, format } = require("date-fns-tz");

exports.getSalesChartDataLogic = async (period, paymentMethod) => {
    const endDate = new Date();
    let startDate = new Date();
    let groupByFormat,
      dateFormat,
      dateArray = [];
    let dateInterval;
    // Set date range based on period
    switch (period) {
      case "daily":
        startDate.setDate(endDate.getDate() - 6);
        dateInterval = "day";
        groupByFormat = "YYYY-MM-DD";
        dateFormat = "iso";
        break;
      case "weekly":
        startDate.setDate(endDate.getDate() - 28); // 4 weeks
        dateInterval = "week";
        groupByFormat = "IYYY-IW";
        dateFormat = "isoWeek";
        break;
      case "monthly":
        startDate.setMonth(endDate.getMonth() - 11); // 12 months
        dateInterval = "month";
        groupByFormat = "YYYY-MM";
        dateFormat = "yearMonth";
        break;
      case "yearly":
        startDate.setFullYear(endDate.getFullYear() - 4); // 5 years
        dateInterval = "year";
        groupByFormat = "YYYY";
        dateFormat = "year";
        break;
      default:
        startDate.setDate(endDate.getDate() - 6);
        dateInterval = "day";
        groupByFormat = "YYYY-MM-DD";
    }
  
    // Set time boundaries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  
    // Generate date array for complete period
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      switch (dateInterval) {
        case "day":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "week":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "month":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "year":
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
  
    // Build query conditions
    const whereConditions = {
      createdAt: { [Op.between]: [startDate, endDate] },
    };
    if (paymentMethod && paymentMethod !== "all") {
      whereConditions.paymentMethod = paymentMethod;
    }
  
    const salesData = await Sale.findAll({
      attributes: [
        [
          sequelize.fn(
            "TO_CHAR",
            sequelize.literal(`"createdAt" AT TIME ZONE 'UTC'`),
            groupByFormat
          ),
          "period",
        ],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "total"],
      ],
      where: whereConditions,
      group: ["period"],
      order: [[sequelize.literal("period"), "ASC"]],
    });
  
    // Create sales map
    const salesMap = new Map();
    salesData.forEach((item) => {
      salesMap.set(item.get("period"), parseFloat(item.get("total")));
    });
  
    const timeZone = "Asia/Kolkata";
    // Format final data with labels
    const formattedData = dateArray.map((date) => {
      const zonedDate = toZonedTime(date, timeZone);
      let periodKey;
      switch (dateFormat) {
        case "iso":
          periodKey = format(zonedDate, "yyyy-MM-dd", { timeZone });
          break;
        case "isoWeek":
          periodKey = `${zonedDate.getFullYear()}-${String(
            getISOWeek(zonedDate)
          ).padStart(2, "0")}`;
          break;
        case "yearMonth":
          periodKey = `${zonedDate.getFullYear()}-${String(
            zonedDate.getMonth() + 1
          ).padStart(2, "0")}`;
          break;
        case "year":
          periodKey = `${zonedDate.getFullYear()}`;
          break;
      }
  
      let label;
      switch (period) {
        case "daily":
          label = format(zonedDate, "EEE", { timeZone });
          break;
        case "weekly":
          label = `W${getISOWeek(zonedDate)} ${zonedDate.getFullYear()}`;
          break;
        case "monthly":
          label = format(zonedDate, "MMM", { timeZone });
          break;
        case "yearly":
          label = zonedDate.getFullYear().toString();
          break;
      }
      return {
        label,
        sales: salesMap.get(periodKey) || 0,
      };
    });
    return formattedData; // return the formatted data array
  }
  