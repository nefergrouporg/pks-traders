const { Customer } = require("../models");

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
                exists: true
            });
        }

        const newCustomer = await Customer.create({
            name,
            phone,
            address,
            debtAmount: debtAmount || 0.0
        });

        return res.status(201).json({
            message: "Customer created successfully",
            customer: newCustomer,
            exists: false
        });
    } catch (error) {
        console.error("Error creating customer:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.updateCustomerDebt = async (req, res) => {
    try {
        const { id } = req.params;
        const { debtAmount } = req.body;

        const customer = await Customer.findByPk(id);  // Corrected from customerId to id
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        customer.debtAmount = debtAmount;
        await customer.save();

        return res.status(200).json({
            message: "Customer debt updated successfully",
            customer
        });
    } catch (error) {
        console.error("Error updating customer debt:", error);
        return res.status(500).json({ error: "Server error" });
    }
};


exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            order: [['name', 'ASC']]
        }); 
        return res.status(200).json({ customers });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return res.status(500).json({ error: "Server error" });
    }
};