const { Supplier } = require("../models/index");

exports.createSupplier = async (req, res) => {
  console.log("hi");
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    if (!name || !contactPerson || !email || !phone) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    // Create the supplier in the database
    const newSupplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      address,
    });

    return res
      .status(201)
      .json({ message: "Supplier created successfully", newSupplier });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const rawSuppliers = await Supplier.findAll();
    const suppliers = rawSuppliers.map((s) => s.dataValues);
    res
      .status(200)
      .json({ message: "Suppliers retrieved successfully", suppliers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// Toggle block status for a supplier
exports.toggleBlockSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    supplier.active = !supplier.active; // Toggle the `active` field
    await supplier.save();
    if (supplier.active) {
      return res
        .status(200)
        .json({ message: "Supplier UnBlocked successfully", supplier });
    } else {
      return res
        .status(200)
        .json({ message: "Supplier blocked successfully", supplier });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};