const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  id: String, 
  name: { type: String, required: true },
  description: { type: String, required: true },
  read: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
