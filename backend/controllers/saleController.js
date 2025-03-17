const {
  Sale,
  Product,
  User,
  sequelize,
  SaleItem,
  Payment,
} = require("../models/index");
const { generatePaymentQR } = require("../utils/qrGenerator");

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, paymentMethod, customerId } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });
    if (!items || !items.length)
      return res.status(400).json({ error: "At least one item is required" });

    // Validate items array
    for (const item of items) {
      if (!item.productId)
        return res
          .status(400)
          .json({ error: "Product ID is required for each item" });
      if (!item.quantity)
        return res
          .status(400)
          .json({ error: "Quantity is required for each item" });
    }
    const transaction = await sequelize.transaction();
    try {
      const saleItems = [];
      let totalAmount = 0;

      // Process each item
      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity)
          throw new Error(`Insufficient stock for ${product.name}`);

        product.stock -= item.quantity;
        await product.save({ transaction });

        totalAmount += product.price * item.quantity;
        saleItems.push({
          productId: product.id, // Ensure productId is included
          quantity: item.quantity,
          price: product.price,
        });
      }

      // Create Sale
      const sale = await Sale.create(
        {
          totalAmount: totalAmount.toFixed(2),
          paymentMethod,
          userId,
          customerId,
        },
        { transaction }
      );

      // Create SaleItems
      await Promise.all(
        saleItems.map((item) =>
          SaleItem.create(
            {
              ...item,
              saleId: sale.id, // Ensure saleId is included
            },
            { transaction }
          )
        )
      );
      await transaction.commit();

      // Create PENDING payment record
      const payment = await Payment.create({
        amount: totalAmount.toFixed(2),
        status: "pending",
        paymentMethod,
        saleId: sale.id,
        userId: req.user.id,
      });

      // Generate QR only for UPI
      const paymentQR =
        paymentMethod === "upi"
          ? await generatePaymentQR(sale.id, totalAmount)
          : null;

      res.status(201).json({
        message: "Sale created successfully",
        sale,
        paymentQR,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    console.log('Fetching all sales...');

    const sales = await Sale.findAll({
      include: [
        {
          model: SaleItem,
          include: [Product],
        },
        User,
        Payment
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(400).json({ error: error.message });
  }
};
