const Event = require("../models/Event");
const mongoose = require("mongoose");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// ----------------- Create Event -----------------
exports.createEvent = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { name, description, start_date, end_date } = req.body;

    let eventImage = null;
    let imageId = null;

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "events");
      eventImage = result.secure_url;
      imageId = result.public_id;
    }

    const newEvent = await Event.create({
      user_id,
      name,
      description,
      start_date,
      end_date,
      event_image: eventImage,
      image_id: imageId,
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("createEvent error:", err);
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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { name, description, start_date, end_date } = req.body;

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (event.image_id) {
        await deleteImage(event.image_id);
      }

      const result = await uploadImage(req.file.buffer, "events");
      event.event_image = result.secure_url;
      event.image_id = result.public_id;
    }

    event.name = name || event.name;
    event.description = description || event.description;
    event.start_date = start_date || event.start_date;
    event.end_date = end_date || event.end_date;

    await event.save();

    res.json(event);
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Delete Event -----------------
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Delete image from Cloudinary if exists
    if (event.image_id) {
      await deleteImage(event.image_id);
    }

    await Event.findByIdAndDelete(id);

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: err.message });
  }
};
