const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  id: String,
  name: String,
  hour: String,
  color: String,
});

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  tasks: [TaskSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // match model name exactly
    required: true,
  },
});

module.exports = mongoose.model("Project", ProjectSchema);
