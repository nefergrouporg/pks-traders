const {
  Sale,
  Product,
  User,
  sequelize,
  SaleItem,
  Payment,
  Customer,
  Branch,
} = require("../models/index");
const { generatePaymentQR } = require("../utils/qrGenerator");

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, payments, customerId, saleType, ReceivedAmount, saleDate } =
      req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    if (!items || !items.length)
      return res.status(400).json({ error: "At least one item is required" });
    if (!Array.isArray(payments) || payments.length === 0)
      return res
        .status(400)
        .json({ error: "At least one payment method is required" });

    const validPaymentMethods = ["cash", "card", "upi", "debt"];
    let totalPaid = 0;
    for (const p of payments) {
      if (!validPaymentMethods.includes(p.method)) {
        return res
          .status(400)
          .json({ error: `Invalid payment method: ${p.method}` });
      }
      totalPaid += parseFloat(p.amount || 0);
    }

    // if (
    //   parseFloat(totalPaid.toFixed(2)) !== parseFloat(finalAmount.toFixed(2))
    // ) {
    //   return res
    //     .status(400)
    //     .json({ error: "Total payment amount does not match final amount" });
    // }

    const validSaleTypes = ["wholeSale", "retail", "hotel"];
    if (saleType && !validSaleTypes.includes(saleType)) {
      return res.status(400).json({ error: "Invalid sale type" });
    }

    // if (paymentMethod === "debt" && customerId === null) {
    //   return res.status(400).json({
    //     error: "Please select customer for Debt",
    //   });
    // }

    // for (const item of items) {
    //   if (!item.productId)
    //     return res
    //       .status(400)
    //       .json({ error: "Product ID is required for each item" });
    //   if (!item.quantity)
    //     return res
    //       .status(400)
    //       .json({ error: "Quantity is required for each item" });
    // }
    let transaction;
    try {
      transaction = await sequelize.transaction();
      const saleItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity)
          throw new Error(`Insufficient stock for ${product.name}`);
        product.stock -= item.quantity;
        await product.save({ transaction });

        let itemTotal =
          (saleType === "wholeSale" || saleType === "hotel"
            ? item.price
            : product.retailPrice) * item.quantity;
        totalAmount += itemTotal;
        saleItems.push({
          productId: product.id,
          quantity: item.quantity,
          price:
            saleType === "wholeSale" || saleType === "hotel"
              ? item.price
              : product.retailPrice,
          subtotal: itemTotal,
        });
      }

      // if (saleType === "wholeSale") {
      //   totalAmount = finalAmount;
      // }

      if (customerId) {
        await Customer.update(
          {
            lastPurchaseDate: new Date(),
            lastPurchaseAmount: parseFloat(totalAmount.toFixed(2)),
          },
          {
            where: { id: customerId },
            transaction,
          }
        );
      }
      const user = await User.findByPk(userId);

      const customer = await Customer.findByPk(customerId, { transaction });

      if (customerId) {
        const received = parseFloat(ReceivedAmount || 0);
        const totalDue = parseFloat(totalAmount.toFixed(2));
        const currentDebt = parseFloat(customer.debtAmount || 0);
        let newDebt = customer.debtAmount;
        newDebt = currentDebt - (received - totalDue);
        for (p of payments) {
          if (p.method === "debt") {
            newDebt = currentDebt + p.amount;
          }
        }
        customer.debtAmount = newDebt;
        await customer.save({ transaction });
      }

      const sale = await Sale.create(
        {
          totalAmount: totalAmount.toFixed(2),
          userId,
          saleType: saleType || "retail",
          customerId: customerId || null,
          branchId: user.branchId,
          purchaseDate: saleDate
            ? new Date(saleDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          recievedAmount: ReceivedAmount,
        },
        { transaction }
      );

      await Promise.all(
        saleItems.map((item) =>
          SaleItem.create(
            {
              ...item,
              saleId: sale.id,
            },
            { transaction }
          )
        )
      );

      const paymentQRs = [];
      let createdPayments = [];

      for (const p of payments) {
        const payment = await Payment.create(
          {
            amount: parseFloat(p.amount).toFixed(2),
            status: p.method === "upi" ? "pending" : "completed",
            paymentMethod: p.method,
            saleId: sale.id,
            userId,
          },
          { transaction }
        );
        createdPayments.push(payment);
        if (p.method === "upi") {
          const qr = await generatePaymentQR(sale.id, p.amount);
          paymentQRs.push({ method: "upi", qr, amount: p.amount });
        }
      }

      await transaction.commit();
      res.status(201).json({
        message: "Sale created successfully",
        sale: { ...sale.toJSON(), payments: createdPayments },
        paymentQRs,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Sale creation failed:", error);
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.error("Error in createSale:", error);
    res.status(400).json({ error: error.message });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    // Get user's branch from JWT token
    const userBranchId = req.user.branch_id;
    
    const whereClause = {};
    if (userBranchId) {
      whereClause.branchId = userBranchId;
    }

    const sales = await Sale.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: SaleItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
            },
          ],
        },
        {
          model: Branch,
          as: "branch",
          attributes: ["name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["username"],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "id"],
        },
        {
          model: Payment,
          as: "payments", // 👈 updated from singular to plural
        },
      ],
    });

    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.editSale = async (req, res) => {
  const saleId = req.params.id;
  const userId = req.user.id;
  const { items, payments, customerId, saleType, ReceivedAmount, saleDate } =
    req.body;
  console.log(req.body);

  // Basic validations
  if (!items || !items.length)
    return res.status(400).json({ error: "At least one item is required" });

  if (!Array.isArray(payments) || payments.length === 0)
    return res
      .status(400)
      .json({ error: "At least one payment method is required" });

  const validPaymentMethods = ["cash", "card", "upi", "debt"];
  let totalPaid = 0;
  for (const p of payments) {
    if (!validPaymentMethods.includes(p.method)) {
      return res
        .status(400)
        .json({ error: `Invalid payment method: ${p.method}` });
    }
    totalPaid += parseFloat(p.amount || 0);
  }

  const validSaleTypes = ["wholeSale", "retail", "hotel"];
  if (saleType && !validSaleTypes.includes(saleType)) {
    return res.status(400).json({ error: "Invalid sale type" });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // Fetch the existing sale with items and payments
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: SaleItem, as: "items" },
        { model: Payment, as: "payments" },
      ],
      transaction,
    });

    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ error: "Sale not found" });
    }

    // Calculate previous debt increase from existing payments
    const previousDebtIncrease = sale.payments
      .filter((p) => p.paymentMethod === "debt")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Restore stock from old sale items
    for (const item of sale.items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        product.stock += item.quantity;
        await product.save({ transaction });
      }
    }

    // Delete old sale items
    await SaleItem.destroy({ where: { saleId: sale.id }, transaction });

    // Validate and process new items
    let totalAmount = 0;
    let newSaleItems = [];

    for (const item of items) {
      if (!item.productId)
        return res
          .status(400)
          .json({ error: "Product ID is required for each item" });

      if (!item.quantity)
        return res
          .status(400)
          .json({ error: "Quantity is required for each item" });

      const product = await Product.findByPk(item.productId, {
        transaction,
        attributes: ["id", "name", "retailPrice", "stock"],
      });

      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity)
        throw new Error(`Insufficient stock for ${product.name}`);

      product.stock -= item.quantity;
      await product.save({ transaction });

      const price =
        saleType === "wholeSale" || saleType === "hotel"
          ? item.price
          : product.retailPrice;

      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      newSaleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
        subtotal: itemTotal,
        saleId: sale.id,
      });
    }

    // Create updated sale items
    await SaleItem.bulkCreate(newSaleItems, { transaction });

    // Delete old payments
    await Payment.destroy({ where: { saleId: sale.id }, transaction });

    // Create new payments
    const paymentQRs = [];
    let createdPayments = [];

    for (const p of payments) {
      const payment = await Payment.create(
        {
          amount: parseFloat(p.amount).toFixed(2),
          status: p.method === "upi" ? "pending" : "completed",
          paymentMethod: p.method,
          saleId: sale.id,
          userId,
        },
        { transaction }
      );
      createdPayments.push(payment);

      if (p.method === "upi") {
        const qr = await generatePaymentQR(sale.id, p.amount);
        paymentQRs.push({ method: "upi", qr, amount: p.amount });
      }
    }

    // Calculate new debt increase from updated payments
    const newDebtIncrease = payments
      .filter((p) => p.method === "debt")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Handle customer debt and metadata
    if (customerId) {
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({ error: "Customer not found" });
      }

      const currentDebt = parseFloat(customer.debtAmount || 0);
      // Adjust debt: subtract previous debt increase, add new debt increase
      const newDebt = currentDebt - previousDebtIncrease + newDebtIncrease;
      customer.debtAmount = newDebt;
      await customer.save({ transaction });

      await Customer.update(
        {
          lastPurchaseDate: new Date(),
          lastPurchaseAmount: totalAmount,
        },
        { where: { id: customerId }, transaction }
      );
    }

    // Update sale
    sale.totalAmount = totalAmount.toFixed(2);
    sale.userId = userId;
    sale.saleType = saleType || "retail";
    sale.customerId = customerId || null;
    sale.purchaseDate = saleDate
      ? new Date(saleDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    sale.recievedAmount = ReceivedAmount;
    await sale.save({ transaction });

    await transaction.commit();
    res.status(200).json({
      message: "Sale updated successfully",
      sale: { ...sale.toJSON(), payments: createdPayments },
      paymentQRs,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Sale update failed:", error);
    res.status(400).json({ error: error.message });
  }
};
