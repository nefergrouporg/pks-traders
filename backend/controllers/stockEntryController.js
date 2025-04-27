
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
  getAllStockEntry
};
