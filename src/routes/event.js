const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// ---------------- Routes ----------------

// Create Event (upload image to /public/events)
router.post(
  "/",
  auth,
  upload("events", "images").single("event_image"), // restrict to images
  eventController.createEvent
);

// Get all events
router.get("/", eventController.getAllEvents);

// Get event by ID
router.get("/:id", auth, eventController.getEventById);

// Update event (optional new image)
router.put(
  "/:id",
  auth,
  upload("events", "images").single("event_image"),
  eventController.updateEvent
);

// Delete event
router.delete("/:id", auth, eventController.deleteEvent);

module.exports = router;
