const Event = require("../models/Event");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ----------------- Create Event -----------------
exports.createEvent = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { name, description, start_date, end_date } = req.body;

    let eventImage = null;

    if (req.file) {
      eventImage = `events/${req.file.filename}`; // <== Relative path only
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

    if (req.file) {
      const filePath = path.join(process.cwd(), "public", "events", req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Get Event by ID -----------------
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id).populate("user_id", "telegram_id first_name last_name username");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Update Event -----------------
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { name, description, start_date, end_date } = req.body;

    if (req.file) {
      if (event.event_image) {
        const oldPath = path.join(process.cwd(), "public", event.event_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      event.event_image = `events/${req.file.filename}`;
    }

    event.name = name || event.name;
    event.description = description || event.description;
    event.start_date = start_date || event.start_date;
    event.end_date = end_date || event.end_date;

    await event.save();

    res.json(event);
  } catch (err) {
    if (req.file) {
      const filePath = path.join(process.cwd(), "public", "events", req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(500).json({ message: err.message });
  }
};

// ----------------- Delete Event -----------------
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.event_image) {
      const imagePath = path.join(process.cwd(), "public", event.event_image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
