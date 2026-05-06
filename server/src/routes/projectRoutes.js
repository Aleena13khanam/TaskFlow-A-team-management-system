const express = require("express");
const auth = require("../middleware/auth");
const {
  createProject,
  getProjectsForUser,
  addProjectMembers,
  removeProjectMember,
} = require("../controllers/projectController");

const router = express.Router();

router.use(auth);
router.post("/", createProject);
router.get("/", getProjectsForUser);
router.patch("/:id/members", addProjectMembers);
router.delete("/:id/members/:username", removeProjectMember);

module.exports = router;
