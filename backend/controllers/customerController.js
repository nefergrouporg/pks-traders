const { Customer, Sale, SaleItem, Product, Payment } = require("../models");

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

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [["name", "ASC"]],
      include: [
        {
          model: Sale,
          as: "Sales", // Alias for Sale
          include: [
            {
              model: SaleItem,
              as: "items", // Alias for SaleItem
              include: [
                {
                  model: Product,
                  as: "product", // Alias for Product
                  attributes: ["id", "name", "retailPrice", "wholeSalePrice"],
                },
              ],
            },
            {
              model: Payment,
              as: "payment", // Alias for Payment
              attributes: ["paymentMethod"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    const transformed = customers.map((customer) => ({
      ...customer.toJSON(),
      Sales: customer.Sales.map((sale) => ({
        // Notice: sales, not Sale
        id: sale.id,
        date: sale.createdAt,
        totalAmount: parseFloat(sale.totalAmount),
        paymentMethod: sale.payment?.paymentMethod || sale.paymentMethod,
        products: sale.items.map((item) => ({
          id: item.productId,
          name: item.product.name, // Access via alias 'product'
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: item.quantity * item.price,
        })),
      })),
    }));

    return res.status(200).json({ customers: transformed });
  } catch (error) {
    console.error("Error fetching customers:", error);
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
