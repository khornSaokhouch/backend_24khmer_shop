const express = require("express");
const router = express.Router();
const multer = require("multer");
const productController = require("../controllers/productController");
const auth = require("../middleware/auth");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post("/", auth, upload.single("image_product"), productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/user/:user_id", auth, productController.getProductsByUser);
router.get("/:id", productController.getProductById);
router.put("/:id", auth, upload.single("image_product"), productController.updateProduct);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
