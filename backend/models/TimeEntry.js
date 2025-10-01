// backend/models/TimeEntry.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: String,
  name: String,
  hour: String,
  color: String,
});

const TimeEntrySchema = new mongoose.Schema({
  date:    { type: String, required: true }, // 'YYYY-MM-DD'
  minutes: { type: Number, required: true }, // total minutes
  tasks:   { type: [TaskSchema], default: [] },
  project: { type: String, default: '' },    // aka projectId
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // match model name exactly
      required: true,
    },
  status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
  supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
  approvedAt: {
      type: Date,
      default: null
    },
  approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
  rejectionReason: {
      type: String,
      default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('TimeEntry', TimeEntrySchema);

