const { StockEntry, Product, Supplier } = require('../models/index');

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

    if(!productId || !supplierId || !quantity || !purchasePrice || !batchNumber){
        return res.status(400).json({error: "All fields are required"})
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

    // 4. Return success response
    res.status(201).json({
      message: 'Stock entry added successfully',
      stockEntry,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding stock entry' });
  }
};

module.exports = {
  createStockEntry,
};
