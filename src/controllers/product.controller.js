const productService = require('../services/product.service.js')

async function getProductController(req, res, next) {
    console.log("Controller called");

    try {
        const { page = 1, limit = 10 } = req.query;
        const data = await productService.getProducts(page, limit);

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("❌ getProductController failed:", {
            message: error.message,
            stack: error.stack
        });

        next(error); // let global error handler manage response
    }
}

async function getTodosController(req, res, next) {
    console.log("Controller called")
    try {
        const data = await productService.getTodos()
        if (data === undefined || data === null) {
            console.error("No todos data returned from service")
            return res.status(502).json({ message: "Unable to fetch todos" });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Failed to fetch todos => getTodosController", error)
        next(error);
    }
}

module.exports = {
    getProductController,
    getTodosController
};