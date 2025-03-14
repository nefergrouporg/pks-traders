const { Product } = require('../models/index');
const { generateBarcode } = require('../utils/barcode');

// Add a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, batchNumber, lowStockThreshold, supplierId } = req.body;

    // Generate a unique barcode
    const barcode = await generateBarcode();

    // Create the product
    const product = await Product.create({
      name,
      description,
      price,
      barcode,
      category,
      batchNumber,
      lowStockThreshold,
      supplierId,
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from the URL
    const {
      name,
      description,
      price,
      category,
      batchNumber,
      lowStockThreshold,
      supplierId,
      stock,
    } = req.body;

    // Find the product by ID
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product details
    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      category: category || product.category,
      batchNumber: batchNumber || product.batchNumber,
      lowStockThreshold: lowStockThreshold || product.lowStockThreshold,
      supplierId: supplierId || product.supplierId,
      stock: stock !== undefined ? stock : product.stock,
    });

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update stock
    product.stock += quantity;

    if(product.stock < 0){
      return res.status(404).json({ message: 'Quantity cant be zero' });
    }
    await product.save();

    res.json({ message: 'Stock updated successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the product
    await Product.destroy({ where: { id } });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    res.status(200).json({ message: 'Products retrieved successfully', products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get Product By Barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ where: { barcode } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};