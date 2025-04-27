

const sequelize = require('../config/database'); // Properly import the Sequelize instance
const { DataTypes } = require('sequelize');


const UserModel = require('./User');
const ProductModel = require('./Product');
const InventoryModel = require('./Inventory');
const OrderModel = require('./Order');
const PaymentModel = require('./Payment');
const SaleModel = require('./Sale');
const SaleItemModel = require('./SaleItem');
const SupplierModel = require('./Supplier');
const CustomerModel = require('./customer');
const ProjectConfigModel = require('./ProjectConfig');
const BranchModel = require('./branch')
const SupplierHistoryModel = require('./supplierHistory')
const SalaryPaymentModel = require('./salaryPayment')
const StockEntry = require('./StockEntry')


// Initialize models
const models = {
  User: UserModel(sequelize, DataTypes),
  Product: ProductModel(sequelize, DataTypes),
  Inventory: InventoryModel(sequelize, DataTypes),
  Order: OrderModel(sequelize, DataTypes),
  Payment: PaymentModel(sequelize, DataTypes),
  Sale: SaleModel(sequelize, DataTypes),
  SaleItem: SaleItemModel(sequelize, DataTypes),
  Supplier: SupplierModel(sequelize, DataTypes),
  Customer: CustomerModel(sequelize, DataTypes),
  ProjectConfig: ProjectConfigModel(sequelize, DataTypes),
  Branch: BranchModel(sequelize, DataTypes),
  SupplierHistory: SupplierHistoryModel(sequelize, DataTypes),
  SalaryPayment: SalaryPaymentModel(sequelize, DataTypes),
  StockEntry: StockEntry(sequelize, DataTypes),
};

// Setup associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// sequelize.sync({ force: true }).then(() => {
//   console.log('✅ Database tables recreated!');
// });


models.sequelize = sequelize; // Attach sequelize instance
models.Sequelize = sequelize.Sequelize; // Attach Sequelize constructor

module.exports = models;
