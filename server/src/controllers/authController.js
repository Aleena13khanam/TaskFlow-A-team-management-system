const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const toSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

const ensureUsername = async (user) => {
  if (user.username?.trim()) {
    return user.username;
  }

  const base =
    toSlug(user.name) ||
    toSlug(user.email?.split("@")[0]) ||
    `user${String(user._id).slice(-6)}`;

  let candidate = base;
  let suffix = 1;
  while (await User.findOne({ username: candidate, _id: { $ne: user._id } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  user.username = candidate;
  await user.save();
  return candidate;
};

const normalizeAvatar = (avatar) => {
  if (!avatar || typeof avatar !== "string") {
    return "";
  }
  const trimmed = avatar.trim();
  if (!trimmed) {
    return "";
  }
  const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed);
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  if (!isDataImage && !isHttpUrl) {
    return "";
  }
  return trimmed;
};

const buildToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const SIGNUP_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

const validateSignupPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return SIGNUP_PASSWORD_MESSAGE;
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return SIGNUP_PASSWORD_MESSAGE;
  }
  return null;
};

const register = async (req, res, next) => {
  try {
    const { name, username, email, password, avatar } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Name, username, email and password are required." });
    }

    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: normalizeAvatar(avatar),
    });

    return res.status(201).json({
      token: buildToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedUsername }, { name: username.trim() }],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const resolvedUsername = await ensureUsername(user);

    return res.json({
      token: buildToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        username: resolvedUsername,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id name username email avatar");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const resolvedUsername = await ensureUsername(user);
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: resolvedUsername,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Backfill username for legacy accounts before save validations run.
    const resolvedUsername = await ensureUsername(user);

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    if (typeof req.body.avatar === "string") {
      user.avatar = normalizeAvatar(req.body.avatar);
    }

    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: resolvedUsername,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  updateMe,
};
