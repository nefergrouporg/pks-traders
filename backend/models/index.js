

const sequelize = require('../config/database'); // Properly import the Sequelize instance

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


// Initialize models
const models = {
  User: UserModel(sequelize),
  Product:ProductModel(sequelize),
  Inventory:InventoryModel(sequelize),
  Order:OrderModel(sequelize),
  Payment:PaymentModel(sequelize),
  Sale:SaleModel(sequelize),
  SaleItem: SaleItemModel(sequelize),
  Supplier:SupplierModel(sequelize),
  Customer:CustomerModel(sequelize),
  ProjectConfig: ProjectConfigModel(sequelize),
  Branch:BranchModel(sequelize),
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
