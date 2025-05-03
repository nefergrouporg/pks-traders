const { Product } = require('../models/index');
const { SupplierHistory } = require('../models/index');
const fs = require('fs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');


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


exports.uploadBulkProducts = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File is required' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let data = [];

  try {
    if (ext === 'csv') {
      data = await parseCSV(req.file.path);
    } else if (['xlsx', 'xls'].includes(ext)) {
      data = parseExcel(req.file.path);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    const products = [];
    const errors = [];

    for (const row of data) {
      const {
        name,
        description,
        retailPrice,
        wholeSalePrice,
        barcode,
        stock,
        unitType,
        category,
        lowStockThreshold,
      } = row;

      if (!name || !category || !unitType || !retailPrice || !wholeSalePrice) {
        errors.push({ row, reason: 'Missing required fields' });
        continue;
      }

      if (!['pcs', 'kg'].includes(unitType)) {
        errors.push({ row, reason: 'Invalid unitType' });
        continue;
      }

      products.push({
        name,
        description: description || null,
        retailPrice: parseFloat(retailPrice),
        wholeSalePrice: parseFloat(wholeSalePrice),
        barcode: barcode?.toString().trim() || null,
        stock: parseFloat(stock || 0),
        unitType,
        category,
        lowStockThreshold: parseInt(lowStockThreshold || 10),
      });
    }

    await Product.bulkCreate(products);
    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      message: 'Bulk upload successful',
      added: products.length,
      errors
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process file', error: err.message });
  }
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};


exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from the URL
    const {
      name,
      description,
      retailPrice,
      wholeSalePrice,
      barcode,
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
      barcode: barcode || product.barcode,
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
