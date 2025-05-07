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
    const { items, paymentMethod, customerId, saleType, finalAmount } =
      req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });
    if (!items || !items.length)
      return res.status(400).json({ error: "At least one item is required" });

    const validPaymentMethods = ["cash", "card", "upi", "debt"];
    if (!validPaymentMethods.includes(paymentMethod?.toLowerCase())) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const validSaleTypes = ["wholeSale", "retail"];
    if (saleType && !validSaleTypes.includes(saleType)) {
      return res.status(400).json({ error: "Invalid sale type" });
    }

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

    try {
      const transaction = await sequelize.transaction();
      const saleItems = [];
      let totalAmount = 0;
      if (paymentMethod === "debt" && customerId === null) {
        return res.status(400).json({
          error: "Please select customer for Debt",
        });
      }

      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction,
          attributes: ["id", "name", "wholeSalePrice", "retailPrice", "stock"], // ensure price is fetched
        });

        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity)
          throw new Error(`Insufficient stock for ${product.name}`);

        if (product.wholeSalePrice == null || product.retailPrice == null)
          throw new Error(`Price is missing for product ${product.name}`);

        product.stock -= item.quantity;
        await product.save({ transaction });

        let itemTotal;
        if (saleType === "wholeSale") {
          itemTotal = product.wholeSalePrice * item.quantity;
        } else {
          itemTotal = product.retailPrice * item.quantity;
        }
        totalAmount += itemTotal;

        saleItems.push({
          productId: product.id,
          quantity: item.quantity,
          price:
            saleType === "wholeSale"
              ? product.wholeSalePrice
              : product.retailPrice,
        });
      }

      if (saleType === "wholeSale") {
        totalAmount = finalAmount;
      }

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
      console.log(paymentMethod, customerId);
      
      if (paymentMethod === "debt") {
        const customer = await Customer.findByPk(customerId, { transaction });
        customer.debtAmount += totalAmount;
        await customer.save({ transaction });
      }

      const sale = await Sale.create(
        {
          totalAmount: totalAmount?.toFixed(2),
          paymentMethod: paymentMethod.toLowerCase(),
          userId,
          saleType: saleType || "retail",
          customerId: customerId || null,
          branchId: user.branchId,
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

      const payment = await Payment.create(
        {
          amount: totalAmount.toFixed(2),
          status: "pending",
          paymentMethod: paymentMethod.toLowerCase(),
          saleId: sale.id,
          userId,
        },
        { transaction }
      );

      let paymentQR = null;
      if (paymentMethod.toLowerCase() === "upi") {
        try {
          paymentQR = await generatePaymentQR(sale.id, totalAmount);
        } catch (qrError) {
          console.error("QR Generation failed:", qrError);
          // Continue without blocking sale creation
        }
      }

      await transaction.commit();

      res.status(201).json({
        message: "Sale created successfully",
        sale,
        paymentQR,
        paymentId: payment.id,
      });
      console.log("Sale created successfully:", sale.id);
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
    const sales = await Sale.findAll({
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
          attributes: ["name"],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });
    // Send the response with the relevant fields
    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(400).json({ error: error.message });
  }
};
