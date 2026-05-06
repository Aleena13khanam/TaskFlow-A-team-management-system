const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");

const normalizeUsername = (value) => value?.trim().toLowerCase();
const normalizeEmail = (value) => value?.trim().toLowerCase();
const normalizeRole = (value) => (value === "admin" ? "admin" : "worker");

const normalizeMembers = (members = []) => {
  const uniqueMembers = new Set(
    members.map(normalizeUsername).filter(Boolean)
  );
  return [...uniqueMembers];
};

const normalizeEmails = (emails = []) => {
  const uniqueEmails = new Set(emails.map(normalizeEmail).filter(Boolean));
  return [...uniqueEmails];
};

const getRequestUsername = async (userId) => {
  const user = await User.findById(userId).select("name username email");
  if (!user) {
    return null;
  }
  return {
    name: user.name,
    username: normalizeUsername(user.username || user.email),
    email: normalizeEmail(user.email),
  };
};

const mergeMemberProfiles = (profiles = []) => {
  const map = new Map();
  for (const profile of profiles) {
    const email = normalizeEmail(profile?.email);
    const username = normalizeUsername(profile?.username);
    const key = email || username;
    if (!key) {
      continue;
    }
    map.set(key, {
      email: email || "",
      username: username || "",
      name: profile?.name?.trim() || "",
      avatar: profile?.avatar?.trim() || "",
      role: normalizeRole(profile?.role),
    });
  }
  return [...map.values()];
};

const syncProjectWithRealUsers = async (project) => {
  const requestedEmails = normalizeEmails(project.memberEmails || []);
  const requestedUsernames = normalizeMembers(project.members || []);

  const usersByEmail = requestedEmails.length
    ? await User.find({ email: { $in: requestedEmails } }).select("name username email avatar")
    : [];
  const usersByUsername = requestedUsernames.length
    ? await User.find({ username: { $in: requestedUsernames } }).select("name username email avatar")
    : [];

  const normalizedProfiles = mergeMemberProfiles([
    ...usersByEmail.map((user) => ({
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar || "",
      role: "worker",
    })),
    ...usersByUsername.map((user) => ({
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar || "",
      role: "worker",
    })),
    ...(project.memberProfiles || []),
  ]).map((profile) => ({
    ...profile,
    role:
      profile.email === normalizeEmail(project.adminEmail) ||
      profile.username === normalizeUsername(project.owner)
        ? "admin"
        : normalizeRole(profile.role),
  }));

  const normalizedEmails = normalizeEmails(normalizedProfiles.map((profile) => profile.email));
  const normalizedMembers = normalizeMembers(normalizedProfiles.map((profile) => profile.username));

  const hasChanged =
    JSON.stringify(project.memberProfiles || []) !== JSON.stringify(normalizedProfiles) ||
    JSON.stringify(project.memberEmails || []) !== JSON.stringify(normalizedEmails) ||
    JSON.stringify(project.members || []) !== JSON.stringify(normalizedMembers);

  if (hasChanged) {
    project.memberProfiles = normalizedProfiles;
    project.memberEmails = normalizedEmails;
    project.members = normalizedMembers;
    await project.save();
  }

  return project;
};

const createProject = async (req, res, next) => {
  try {
    const { name, description = "", memberEmails = [], adminEmail = "" } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Project name is required." });
    }

    const owner = await getRequestUsername(req.user.id);
    if (!owner) {
      return res.status(404).json({ message: "User not found." });
    }

    const requestedEmails = normalizeEmails([...(memberEmails || []), owner.email, adminEmail]);
    const existingUsers = await User.find({ email: { $in: requestedEmails } }).select(
      "name username email avatar"
    );
    const existingUserByEmail = new Map(
      existingUsers.map((user) => [normalizeEmail(user.email), user])
    );

    const missingEmails = requestedEmails.filter((email) => !existingUserByEmail.has(email));
    if (missingEmails.length > 0) {
      return res.status(400).json({
        message: `These users do not exist: ${missingEmails.join(", ")}`,
      });
    }

    let memberProfiles = mergeMemberProfiles(
      existingUsers.map((user) => ({
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "",
        role: "worker",
      }))
    );
    const memberList = normalizeMembers(memberProfiles.map((member) => member.username));
    const memberEmailList = normalizeEmails(memberProfiles.map((member) => member.email));
    const normalizedAdminEmail = normalizeEmail(adminEmail);
    const resolvedAdminEmail = normalizedAdminEmail || owner.email;
    memberProfiles = memberProfiles.map((member) => ({
      ...member,
      role:
        member.email === resolvedAdminEmail || member.username === owner.username
          ? "admin"
          : member.role,
    }));

    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      ownerId: req.user.id,
      owner: owner.username,
      members: memberList,
      memberEmails: memberEmailList,
      memberProfiles,
      adminEmail: resolvedAdminEmail,
    });

    return res.status(201).json(project);
  } catch (error) {
    return next(error);
  }
};

const getProjectsForUser = async (req, res, next) => {
  try {
    const requestUser = await getRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const projects = await Project.find({
      $or: [{ memberEmails: requestUser.email }, { members: requestUser.username }],
    }).sort({ createdAt: -1 });
    const syncedProjects = [];
    for (const project of projects) {
      const syncedProject = await syncProjectWithRealUsers(project);
      syncedProjects.push(syncedProject);
    }
    return res.json(syncedProjects);
  } catch (error) {
    return next(error);
  }
};

const addProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const requestUser = await getRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const adminEmail = normalizeEmail(project.adminEmail) || normalizeEmail(project.owner);
    if (adminEmail !== requestUser.email) {
      return res.status(403).json({ message: "Only the project admin can add members." });
    }

    const incomingEmails = normalizeEmails(req.body.memberEmails || []);
    const incomingUsernames = normalizeMembers(req.body.memberUsernames || []);
    const memberEntries = Array.isArray(req.body.memberEntries) ? req.body.memberEntries : [];
    const existingMemberEmails = normalizeEmails(project.memberEmails || []);

    const incomingRoleByUsername = new Map();
    for (const entry of memberEntries) {
      const username = normalizeUsername(entry?.username);
      if (!username) {
        continue;
      }
      incomingRoleByUsername.set(username, normalizeRole(entry?.role));
    }

    const usersByEmail = incomingEmails.length
      ? await User.find({ email: { $in: incomingEmails } }).select("name username email avatar")
      : [];
    const usersByUsername = incomingUsernames.length
      ? await User.find({ username: { $in: incomingUsernames } }).select("name username email avatar")
      : [];

    const resolvedIncomingUsers = mergeMemberProfiles([
      ...usersByEmail.map((user) => ({
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "",
        role: incomingRoleByUsername.get(normalizeUsername(user.username)) || "worker",
      })),
      ...usersByUsername.map((user) => ({
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "",
        role: incomingRoleByUsername.get(normalizeUsername(user.username)) || "worker",
      })),
    ]);

    if (resolvedIncomingUsers.length !== incomingEmails.length + incomingUsernames.length) {
      return res.status(400).json({ message: "Some users were not found." });
    }

    const nextRequestedEmails = normalizeEmails([
      ...existingMemberEmails,
      ...resolvedIncomingUsers.map((user) => user.email),
    ]);
    const existingUsers = await User.find({ email: { $in: nextRequestedEmails } }).select("name username email avatar");

    const existingRoleByUsername = new Map(
      (project.memberProfiles || []).map((profile) => [
        normalizeUsername(profile.username),
        normalizeRole(profile.role),
      ])
    );
    const requestedRoleByUsername = new Map(
      resolvedIncomingUsers.map((profile) => [
        normalizeUsername(profile.username),
        normalizeRole(profile.role),
      ])
    );
    const nextProfiles = mergeMemberProfiles(
      existingUsers.map((user) => {
        const username = normalizeUsername(user.username);
        return {
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar || "",
          role:
            requestedRoleByUsername.get(username) ||
            existingRoleByUsername.get(username) ||
            "worker",
        };
      })
    ).map((profile) => ({
      ...profile,
      role:
        profile.email === normalizeEmail(project.adminEmail) ||
        profile.username === normalizeUsername(project.owner)
          ? "admin"
          : profile.role,
    }));
    project.memberProfiles = nextProfiles;
    project.memberEmails = normalizeEmails(nextProfiles.map((profile) => profile.email));
    project.members = normalizeMembers(nextProfiles.map((profile) => profile.username));
    if (!project.adminEmail) {
      project.adminEmail = requestUser.email;
    }
    await project.save();
    return res.json(project);
  } catch (error) {
    return next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const { id, username } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const requestUser = await getRequestUsername(req.user.id);
    if (!requestUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const adminEmail = normalizeEmail(project.adminEmail) || normalizeEmail(project.owner);
    if (adminEmail !== requestUser.email) {
      return res.status(403).json({ message: "Only the project admin can remove members." });
    }

    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username is required." });
    }
    if (normalizedUsername === normalizeUsername(project.owner)) {
      return res.status(400).json({ message: "Project owner cannot be removed." });
    }

    const nextProfiles = (project.memberProfiles || []).filter(
      (profile) => normalizeUsername(profile.username) !== normalizedUsername
    );
    project.memberProfiles = mergeMemberProfiles(nextProfiles);
    project.memberEmails = normalizeEmails(project.memberProfiles.map((profile) => profile.email));
    project.members = normalizeMembers(project.memberProfiles.map((profile) => profile.username));

    await project.save();
    return res.json(project);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProject,
  getProjectsForUser,
  addProjectMembers,
  removeProjectMember,
};
