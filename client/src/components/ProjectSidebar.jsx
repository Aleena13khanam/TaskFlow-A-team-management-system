import { useState } from "react";
import { motion } from "framer-motion";

function parseEmails(rawEmails) {
  return rawEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const getProjectMemberCount = (project) => {
  if (Array.isArray(project?.memberProfiles) && project.memberProfiles.length > 0) {
    const uniqueFromProfiles = new Set(
      project.memberProfiles
        .map((member) => member?.username?.trim()?.toLowerCase() || member?.email?.trim()?.toLowerCase())
        .filter(Boolean)
    );
    return uniqueFromProfiles.size;
  }

  if (Array.isArray(project?.members)) {
    return new Set(project.members.map((member) => member?.trim()?.toLowerCase()).filter(Boolean)).size;
  }

  return 0;
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "my-tasks", label: "My Tasks", icon: "☑" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "◫" },
];

function ProjectSidebar({
  activeView,
  onViewChange,
  currentUser,
  projects,
  activeProjectId,
  onCreateProject,
  onSelectProject,
  isProjectAdmin,
  onOpenSettings,
  onLogout,
}) {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim(),
        memberEmails: parseEmails(memberEmails),
        adminEmail: adminEmail.trim().toLowerCase(),
      });
      setName("");
      setDescription("");
      setMemberEmails("");
      setAdminEmail("");
      setShowProjectForm(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <aside className="project-sidebar">
      <div className="sidebar-branding">
        <img className="brand-logo" src="/taskflow-logo.png" alt="TaskFlow logo" />
        <h1 className="brand-title">
          <span className="brand-title-task">Task</span>
          <span className="brand-title-flow">Flow</span>
        </h1>
      </div>

      <div className="sidebar-nav-list">
        {navItems
          .filter((item) => item.id !== "analytics" || isProjectAdmin)
          .map((item) => (
          <motion.button
            key={item.id}
            type="button"
            className={`sidebar-nav-item ${item.id === activeView ? "sidebar-nav-item-active" : ""}`}
            onClick={() => onViewChange(item.id)}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.3 }}
          >
            {item.icon ? <span>{item.icon}</span> : null}
            {item.label}
          </motion.button>
        ))}
      </div>

      <section className="sidebar-section">
        <h3>Projects</h3>
        <button type="button" onClick={() => setShowProjectForm((prev) => !prev)}>
          {showProjectForm ? "Close Project Form" : "+ New Project"}
        </button>
        {showProjectForm ? (
          <form className="project-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <textarea
              placeholder="Project description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <textarea
              placeholder="Invite members by email (comma separated)"
              value={memberEmails}
              onChange={(event) => setMemberEmails(event.target.value)}
            />
            <input
              type="email"
              placeholder="Admin email (optional)"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
            <button type="submit">{isSubmitting ? "Creating..." : "Create Project"}</button>
          </form>
        ) : null}

        <div className="project-list">
          {projects.map((project) => (
            <motion.button
              key={project._id}
              type="button"
              onClick={() => onSelectProject(project)}
              className={`project-item ${activeProjectId === project._id ? "project-item-active" : ""}`}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.3 }}
            >
              <span className="project-name">
                <span className="project-dot" aria-hidden="true" />
                {project.name}
              </span>
              <small>{getProjectMemberCount(project)} members</small>
            </motion.button>
          ))}
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="sidebar-profile-row">
        <div className="sidebar-profile-card">
          {currentUser?.avatar ? (
            <img className="profile-avatar-image" src={currentUser.avatar} alt="Profile" />
          ) : (
            <div className="profile-avatar">{(currentUser?.name || "U").slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <strong>{currentUser?.name || "User"}</strong>
          </div>
          <div className="profile-actions">
            <button
              type="button"
              className="profile-account-btn"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              title="Profile menu"
            >
              ▴
            </button>
            {showProfileMenu ? (
              <div className="profile-dropup">
                <button type="button" className="secondary-btn" onClick={onOpenSettings}>
                  ⚙ Settings
                </button>
                <button type="button" className="danger-btn" onClick={onLogout}>
                  ⇦ Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </aside>
    </>
  );
}

export default ProjectSidebar;
