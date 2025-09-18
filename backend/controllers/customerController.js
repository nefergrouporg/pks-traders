const { Customer, Sale, SaleItem, Product, Payment } = require("../models");
// const { Op } = require('sequelize');
const { Sequelize, Op } = require('sequelize');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, debtAmount } = req.body;

    // Validate required fields
    if (!phone || phone.trim() === "") {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(200).json({
        message: "Customer already exists",
        customer: existingCustomer,
        exists: true,
      });
    }

    const newCustomer = await Customer.create({
      name,
      phone,
      address,
      debtAmount: debtAmount || 0.0,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
      exists: false,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { debtAmount, from } = req.body;

    const customer = await Customer.findByPk(id); // Corrected from customerId to id
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    let newAmount = 0;
    if (from === "customer") {
      newAmount = customer.debtAmount - debtAmount;
    } else {
      newAmount = customer.debtAmount + debtAmount;
    }
    await Customer.update({ debtAmount: newAmount }, { where: { id } });
    return res.status(200).json({
      message: "Customer debt updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer debt:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



// const { Customer, Sale, SaleItem, Product, Payment } = require("../models");
// const { Op } = require('sequelize');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, debtAmount } = req.body;

    // Validate required fields
    if (!phone || phone.trim() === "") {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(200).json({
        message: "Customer already exists",
        customer: existingCustomer,
        exists: true,
      });
    }

    const newCustomer = await Customer.create({
      name,
      phone,
      address,
      debtAmount: debtAmount || 0.0,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
      exists: false,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { debtAmount, from } = req.body;

    const customer = await Customer.findByPk(id); // Corrected from customerId to id
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    let newAmount = 0;
    if (from === "customer") {
      newAmount = customer.debtAmount - debtAmount;
    } else {
      newAmount = customer.debtAmount + debtAmount;
    }
    await Customer.update({ debtAmount: newAmount }, { where: { id } });
    return res.status(200).json({
      message: "Customer debt updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer debt:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



// controllers/customerController.js

// Simplified main customers list
exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      order: [["name", "ASC"]],
      attributes: [
        'id',
        'name',
        'phone',
        'address',
        'debtAmount',
        'isBlocked',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Sale,
          as: "Sales",
          attributes: ['id', 'totalAmount', 'createdAt'],
          required: false,
          order: [["createdAt", "DESC"]],
          limit: 1 // Only get the most recent sale for last purchase info
        }
      ],
      limit,
      offset,
    });

    const transformed = customers.map((customer) => {
      const lastSale = customer.Sales && customer.Sales.length > 0 
        ? customer.Sales[0] 
        : null;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        debtAmount: parseFloat(customer.debtAmount),
        isBlocked: customer.isBlocked,
        lastPurchaseDate: lastSale ? lastSale.createdAt : null,
        lastPurchaseAmount: lastSale ? parseFloat(lastSale.totalAmount) : null
      };
    });

    return res.status(200).json({
      customers: transformed,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCustomers: count
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get customer details with full sales history
exports.getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      attributes: [
        'id',
        'name',
        'phone',
        'address',
        'debtAmount',
        'isBlocked',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Sale,
          as: "Sales",
          include: [
            {
              model: SaleItem,
              as: "items",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["id", "name", "retailPrice", "wholeSalePrice"],
                },
              ],
            },
            {
              model: Payment,
              as: "payments",
              attributes: ["paymentMethod"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Calculate totals
    const totalPurchases = customer.Sales.length;
    const totalSpent = customer.Sales.reduce((total, sale) => 
      total + parseFloat(sale.totalAmount), 0
    );

    const transformedSales = customer.Sales.map((sale) => ({
      id: sale.id,
      date: sale.createdAt,
      totalAmount: parseFloat(sale.totalAmount),
      paymentMethod: sale.payments?.[0]?.paymentMethod || sale.paymentMethod,
      products: sale.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: item.quantity * parseFloat(item.price),
      })),
    }));

    const response = {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        debtAmount: parseFloat(customer.debtAmount),
        isBlocked: customer.isBlocked,
        totalPurchases,
        totalSpent,
        lastPurchaseDate: totalPurchases > 0 ? customer.Sales[0].createdAt : null,
        lastPurchaseAmount: totalPurchases > 0 ? parseFloat(customer.Sales[0].totalAmount) : null,
        Sales: transformedSales
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get only sales history for a customer
exports.getCustomerSales = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: sales } = await Sale.findAndCountAll({
      where: { customerId: id },
      include: [
        {
          model: SaleItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Payment,
          as: "payments",
          attributes: ["paymentMethod"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const transformedSales = sales.map((sale) => ({
      id: sale.id,
      date: sale.createdAt,
      totalAmount: parseFloat(sale.totalAmount),
      paymentMethod: sale.payments?.[0]?.paymentMethod || sale.paymentMethod,
      products: sale.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: item.quantity * parseFloat(item.price),
      })),
    }));

    return res.status(200).json({
      sales: transformedSales,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalSales: count
    });
  } catch (error) {
    console.error("Error fetching customer sales:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
exports.editCustomer = async (req, res) => {
  try {
    const { id, name, phone, address, debtAmount } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Id required",
      });
    }

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    await Customer.update(
      {
        name: name,
        phone: phone,
        address: address,
        debtAmount: debtAmount,
      },
      { where: { id } }
    );

    return res.status(200).json({ error: "Customer updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.editCustomer = async (req, res) => {
  try {
    const { id, name, phone, address, debtAmount } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Id required",
      });
    }

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    await Customer.update(
      {
        name: name,
        phone: phone,
        address: address,
        debtAmount: debtAmount,
      },
      { where: { id } }
    );

    return res.status(200).json({ error: "Customer updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};





exports.getCustomerssearch = async (req, res) => {
  try {
    // Validate authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // Validate query parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: 'Invalid page or limit parameters' });
    }

    // Normalize search term
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const numberMatch = normalizedTerm.match(/\d+/);
    const searchValues = [normalizedTerm];
    if (numberMatch) {
      searchValues.push(numberMatch[0]); // Add extracted number
    }

    // Build where clause
    let whereClause = {};
    if (searchValues.length > 0) {
      whereClause = {
        [Op.or]: searchValues.map(value => ({
          [Op.or]: [
            { name: { [Op.iLike]: `%${value}%` } },
            { phone: { [Op.iLike]: `%${value}%` } },
          ],
        })),
      };
    }

    // Fetch only necessary fields
    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'phone', 'address', 'debtAmount'],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    // Transform response
    const transformed = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      debtAmount: parseFloat(customer.debtAmount || 0),
    }));

    // 👇 Print to console
    console.log("Fetched customers:", JSON.stringify(transformed, null, 2));

    return res.status(200).json({
      customers: transformed,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCustomers: count,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ error: 'Database error occurred' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
