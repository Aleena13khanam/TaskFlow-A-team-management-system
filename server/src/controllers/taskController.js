const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

const allowedStatus = ["To Do", "In Progress", "Done"];
const allowedPriority = ["Low", "Medium", "High"];

const normalizeUsername = (value) => value?.trim().toLowerCase();
const normalizeEmail = (value) => value?.trim().toLowerCase();

const resolveRequestUsername = async (userId) => {
  const user = await User.findById(userId).select("username email");
  if (!user) {
    return null;
  }
  return {
    username: normalizeUsername(user.username || user.email),
    email: normalizeEmail(user.email),
  };
};

const getMemberProject = async (projectId, requestUser) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return null;
  }
  return Project.findOne({
    _id: projectId,
    $or: [{ memberEmails: requestUser.email }, { members: requestUser.username }],
  });
};

const buildTaskQuery = (query) => {
  const filter = {};

  if (query.status && allowedStatus.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.priority && allowedPriority.includes(query.priority)) {
    filter.priority = query.priority;
  }

  return filter;
};

const createTask = async (req, res, next) => {
  try {
    const requestUser = await resolveRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { projectId, assignedTo = "" } = req.body;
    const project = await getMemberProject(projectId, requestUser);
    if (!project) {
      return res.status(403).json({ message: "You do not have access to this project." });
    }

    const normalizedAssignedTo = normalizeUsername(assignedTo);
    if (normalizedAssignedTo && !project.members.includes(normalizedAssignedTo)) {
      return res.status(400).json({ message: "Assigned user must be a member of this project." });
    }

    const task = await Task.create({
      ...req.body,
      assignedTo: normalizedAssignedTo || "",
      userId: req.user.id,
      projectId: project._id,
    });
    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const requestUser = await resolveRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const project = await getMemberProject(req.query.projectId, requestUser);
    if (!project) {
      return res.status(403).json({ message: "You do not have access to this project." });
    }

    const filter = { ...buildTaskQuery(req.query), projectId: project._id };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const requestUser = await resolveRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await getMemberProject(task.projectId, requestUser);
    if (!project) {
      return res.status(403).json({ message: "You do not have access to this task." });
    }

    return res.json(task);
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const requestUser = await resolveRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await getMemberProject(existingTask.projectId, requestUser);
    if (!project) {
      return res.status(403).json({ message: "You do not have access to this task." });
    }

    const updatePayload = { ...req.body };
    delete updatePayload.userId;
    delete updatePayload.projectId;

    if (typeof updatePayload.assignedTo === "string") {
      const normalizedAssignedTo = normalizeUsername(updatePayload.assignedTo);
      if (normalizedAssignedTo && !project.members.includes(normalizedAssignedTo)) {
        return res.status(400).json({ message: "Assigned user must be a member of this project." });
      }
      updatePayload.assignedTo = normalizedAssignedTo || "";
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const requestUser = await resolveRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await getMemberProject(task.projectId, requestUser);
    if (!project) {
      return res.status(403).json({ message: "You do not have access to this task." });
    }

    await Task.findByIdAndDelete(id);

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
