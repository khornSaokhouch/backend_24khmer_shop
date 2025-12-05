const Event = require("../models/Event");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ----------------- Create Event -----------------
exports.createEvent = async (req, res) => {
  try {
    const user_id = req.user._id; // from auth middleware
    const { name, description, start_date, end_date } = req.body;

    // Handle uploaded image
    let eventImage = null;
    if (req.file) {
      eventImage = `${process.env.BASE_URL}/events/${req.file.filename}`;
    }

    const newEvent = await Event.create({
      user_id,
      name,
      description,
      start_date,
      end_date,
      event_image: eventImage,
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("createEvent error:", err);

    // Delete uploaded image if creation fails
    if (req.file) {
      const filePath = path.join(process.cwd(), "public", "events", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted uploaded event image due to error:", filePath);
      }
    }

    res.status(400).json({ message: err.message });
  }
};

// ----------------- Get All Events -----------------
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("user_id", "telegram_id first_name last_name username");
    res.json(events);
  } catch (err) {
    console.error("getAllEvents error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Get Event by ID -----------------
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id).populate("user_id", "telegram_id first_name last_name username");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (err) {
    console.error("getEventById error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Update Event -----------------
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { name, description, start_date, end_date } = req.body;

    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (event.event_image) {
        const oldImagePath = path.join(process.cwd(), "public", "events", path.basename(event.event_image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Deleted old event image:", oldImagePath);
        }
      }
      event.event_image = `${process.env.BASE_URL}/events/${req.file.filename}`;
    }

    event.name = name || event.name;
    event.description = description || event.description;
    event.start_date = start_date || event.start_date;
    event.end_date = end_date || event.end_date;

    await event.save();
    res.json(event);
  } catch (err) {
    console.error("updateEvent error:", err);

    // Delete uploaded image if update fails
    if (req.file) {
      const filePath = path.join(process.cwd(), "public", "events", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted uploaded event image due to update error:", filePath);
      }
    }

    res.status(500).json({ message: err.message });
  }
};

// ----------------- Delete Event -----------------
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Remove image from public folder
    if (event.event_image) {
      const imagePath = path.join(process.cwd(), "public", "events", path.basename(event.event_image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted event image:", imagePath);
      }
    }

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: err.message });
  }
};
