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

    console.log('Creating sale with:', { items, paymentMethod, customerId });

    if (!userId) return res.status(400).json({ error: "User ID is required" });
    if (!items || !items.length)
      return res.status(400).json({ error: "At least one item is required" });

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'upi'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Validate items array
    for (const item of items) {
      if (!item.productId)
        return res.status(400).json({ error: "Product ID is required for each item" });
      if (!item.quantity)
        return res.status(400).json({ error: "Quantity is required for each item" });
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
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // Create Sale
      const sale = await Sale.create(
        {
          totalAmount: totalAmount.toFixed(2),
          paymentMethod: paymentMethod.toLowerCase(), // Ensure consistent case
          userId,
          customerId: customerId || null,
        },
        { transaction }
      );

      // Create SaleItems
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

      // Create Payment record
      const payment = await Payment.create({
        amount: totalAmount.toFixed(2),
        status: "pending",
        paymentMethod: paymentMethod.toLowerCase(),
        saleId: sale.id,
        userId,
      }, { transaction });
      console.log(paymentMethod)

      let paymentQR = null;
      if (paymentMethod.toLowerCase() === "upi") {
        try {
          console.log(`Generating QR for sale ${sale.id}, amount ${totalAmount}`);
          paymentQR = await generatePaymentQR(sale.id, totalAmount);
          console.log('QR generation successful');
        } catch (qrError) {
          console.error("QR Generation failed:", qrError);
          // Continue with sale even if QR generation fails
        }
      }
      console.log('koooooi')

      await transaction.commit();

      res.status(201).json({
        message: "Sale created successfully",
        sale,
        paymentQR,
        paymentId: payment.id // Include payment ID for reference
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Sale creation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createSale:', error);
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
