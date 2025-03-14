const { Inventory, Product, Order } = require('../models/index');
const { Op } = require('sequelize');

// Add inventory
exports.addInventory = async (req, res) => {
  try {
    const { productId, quantity, orderId } = req.body;

    // Create inventory record
    const inventory = await Inventory.create({
      productId,
      quantity,
      orderId,
    });

    // Update product stock
    const product = await Product.findByPk(productId);
    product.stock += quantity;
    await product.save();

    res.status(201).json({ message: 'Inventory added successfully', inventory });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get low-stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        stock: {
          [Op.lte]: Sequelize.col('lowStockThreshold')
        }
      }
    });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
