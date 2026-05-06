const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    members: {
      type: [String],
      default: [],
    },
    memberEmails: {
      type: [String],
      default: [],
    },
    memberProfiles: {
      type: [
        {
          email: { type: String, trim: true, lowercase: true },
          username: { type: String, trim: true, lowercase: true },
          name: { type: String, trim: true },
          avatar: { type: String, trim: true, default: "" },
          role: {
            type: String,
            enum: ["admin", "worker"],
            default: "worker",
          },
        },
      ],
      default: [],
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
