const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const auth = require("../middleware/auth");

// All routes below require login
router.get("/", UserController.index);
router.get("/:id", auth, UserController.show);
router.put("/:id", auth, UserController.update);
router.delete("/:id", auth, UserController.destroy);

module.exports = router;
