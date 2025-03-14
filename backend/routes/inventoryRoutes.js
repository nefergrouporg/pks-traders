const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.post('/addInventory', inventoryController.addInventory);
router.get("/getLowStockProducts", inventoryController.getLowStockProducts);

module.exports = router;