const { Op } = require('sequelize');

exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: customers } = await Customer.findAndCountAll({
      order: [["name", "ASC"]],
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
      limit,
      offset,
    });

    const transformed = customers.map((customer) => ({
      ...customer.toJSON(),
      Sales: customer.Sales.map((sale) => ({
        id: sale.id,
        date: sale.createdAt,
        totalAmount: parseFloat(sale.totalAmount),
        paymentMethod: sale.payment?.paymentMethod || sale.paymentMethod,
        products: sale.items.map((item) => ({
          id: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: item.quantity * item.price,
        })),
      })),
    }));

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
