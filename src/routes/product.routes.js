const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller.js");

router.get("/products", productController.getProductController);
router.get("/todos", productController.getTodosController);

module.exports = router;