const { Product } = require('../models/index');
const { SupplierHistory } = require('../models/index');


exports.createProduct = async (req, res) => {
  try {
    const { name, retailPrice, wholeSalePrice, category, lowStockThreshold, unitType, description } = req.body;
    let {barcode} = req.body
    if (!barcode || barcode.trim() === '') {
      barcode = null;
    }

    if (!['pcs', 'kg'].includes(unitType)) {
      return res.status(400).json({ message: "Invalid unit type. Use 'pcs' or 'kg'." });
    }
    if(!name || !category || !lowStockThreshold || !unitType || (!wholeSalePrice || !retailPrice)){
      return  res.status(400).json({ message: 'All fiels are required'});
    }

    // Create the product
    const product = await Product.create({
      name,
      description,
      retailPrice,
      wholeSalePrice,
      unitType,
      barcode,
      category,
      lowStockThreshold,
    });

    if (product.stock > 0) {
      await SupplierHistory.create({
        supplierId: product.supplierId,
        productId: product.id,
        quantity: product.stock,
        amount: product.wholeSalePrice * product.stock,
        date: new Date(),
        paymentStatus: 'Unpaid'
      });
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from the URL
    const {
      name,
      description,
      retailPrice,
      wholeSalePrice,
      category,
      lowStockThreshold,
      unitType
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
      retailPrice: retailPrice || product.retailPrice,
      wholeSalePrice: wholeSalePrice || product.wholeSalePrice,
      category: category || product.category,
      lowStockThreshold: lowStockThreshold || product.lowStockThreshold,
      unitType: unitType !== undefined ? unitType : product.unitType,
    });

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    product.isDeleted = !product.isDeleted
    product.save()
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

// get product details from productIds
exports.getProductsDetails = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !productIds.length) {
      return res.status(400).json({ error: "Product IDs are required" });
    }
    const products = await Product.findAll({
      where: { id: productIds },
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Toggle the active status
    product.active = !product.active;
    await product.save();

    res.status(200).json({
      message: `Product ${product.active ? "activated" : "deactivated"} successfully`,
      product,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
