const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); // reusable upload.js

// ---------------- Routes ----------------

// Create Event (upload image to /public/events)
router.post("/", auth, upload("events").single("event_image"), eventController.createEvent);

// Get all events
router.get("/", auth, eventController.getAllEvents);

// Get event by ID
router.get("/:id", auth, eventController.getEventById);

// Update event
router.put("/:id", auth, upload("events").single("event_image"), eventController.updateEvent);

// Delete event
router.delete("/:id", auth, eventController.deleteEvent);

module.exports = router;
