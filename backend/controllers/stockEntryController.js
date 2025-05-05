

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { StockEntry, Product, Supplier, SupplierHistory } = require('../models/index');

const createStockEntry = async (req, res) => {
  const {
    productId,
    supplierId,
    quantity,
    purchasePrice,
    receivedDate,
    expiryDate,
    batchNumber,
    note
  } = req.body;

  try {
    if (!productId || !supplierId || !quantity || !purchasePrice || !batchNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. Validate product and supplier
    const product = await Product.findByPk(productId);
    const supplier = await Supplier.findByPk(supplierId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // 2. Create the stock entry
    const stockEntry = await StockEntry.create({
      productId,
      supplierId,
      quantity,
      purchasePrice,
      receivedDate,
      expiryDate,
      batchNumber,
      note
    });

    // 3. Update the product's stock level
    product.stock += quantity;
    await product.save();

    // 4. (New!) Create supplier history record
    await SupplierHistory.create({
      supplierId: supplierId,
      productId: productId,
      quantity: quantity,
      amount: purchasePrice, 
      date: receivedDate || new Date(), 
      paymentStatus: 'Unpaid', 
    });

    // 5. Return success response
    res.status(201).json({
      message: 'Stock entry and supplier history added successfully',
      stockEntry,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding stock entry' });
  }
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};



const bulkImportStockEntries = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, '..', req.file.path);
  const ext = path.extname(filePath).toLowerCase();
  let entries = [];

  try {
    if (ext === '.csv') {
      entries = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      entries = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to parse file' });
  }

  const results = { success: [], failed: [] };

  for (const [index, entry] of entries.entries()) {
    const {
      productId,
      supplierId,
      quantity,
      purchasePrice,
      receivedDate,
      expiryDate,
      batchNumber,
      note
    } = entry;

    if (!productId || !supplierId || !quantity || !purchasePrice || !batchNumber) {
      results.failed.push({ row: index + 2, error: 'Missing required fields' });
      continue;
    }

    try {
      const product = await Product.findByPk(productId);
      const supplier = await Supplier.findByPk(supplierId);

      if (!product || !supplier) {
        results.failed.push({
          row: index + 2,
          error: `${!product ? 'Product' : ''}${!product && !supplier ? ' & ' : ''}${!supplier ? 'Supplier' : ''} not found`
        });
        continue;
      }

      const stockEntry = await StockEntry.create({
        productId,
        supplierId,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber,
        note,
      });

      product.stock += parseFloat(quantity);
      await product.save();

      await SupplierHistory.create({
        supplierId,
        productId,
        quantity: parseFloat(quantity),
        amount: parseFloat(purchasePrice),
        date: receivedDate || new Date(),
        paymentStatus: 'Unpaid',
      });

      results.success.push({ row: index + 2, stockEntryId: stockEntry.id });
    } catch (err) {
      results.failed.push({ row: index + 2, error: err.message });
    }
  }

  fs.unlinkSync(filePath); // Clean up uploaded file

  res.status(200).json({
    message: 'Bulk import completed',
    summary: {
      total: entries.length,
      success: results.success.length,
      failed: results.failed.length
    },
    details: results
  });
};




const getAllStockEntry = async (req, res) => {
  try {
    const stockEntries = await StockEntry.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: Supplier, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']] // optional: newest first
    });
    res.status(200).json(stockEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stock entries' });
  }
};

module.exports = {
  createStockEntry,
  getAllStockEntry,
  bulkImportStockEntries
};
