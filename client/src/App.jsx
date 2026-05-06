import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthForm from "./components/AuthForm";
import TaskForm from "./components/TaskForm";
import TaskFilters from "./components/TaskFilters";
import KanbanBoard from "./components/KanbanBoard";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import ProjectSidebar from "./components/ProjectSidebar";
import { getCurrentUser, updateCurrentUser } from "./services/authApi";
import {
  addProjectMembers,
  createProject,
  clearStoredUser,
  clearStoredToken,
  createTask,
  deleteTask,
  getProjects,
  getStoredToken,
  getStoredUser,
  getTasks,
  removeProjectMember,
  setStoredToken,
  setStoredUser,
  updateTask,
} from "./services/taskApi";

const initialFilters = {
  status: "",
  priority: "",
};

const parseUsernames = (rawUsernames) =>
  rawUsernames
    .split(",")
    .map((username) => username.trim().toLowerCase())
    .filter(Boolean);

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("taskflow_theme") || "light");
  const [now, setNow] = useState(() => new Date());
  const [activeView, setActiveView] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [teamMemberUsername, setTeamMemberUsername] = useState("");
  const [teamMemberRole, setTeamMemberRole] = useState("worker");
  const [teamMemberError, setTeamMemberError] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  const fetchTasks = async (projectId, activeFilters = filters) => {
    if (!getStoredToken()) {
      return;
    }
    if (!projectId) {
      setTasks([]);
      setSelectedTask(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getTasks({ ...activeFilters, projectId });
      setTasks(data);
      if (selectedTask) {
        const refreshedSelectedTask = data.find((task) => task._id === selectedTask._id) || null;
        setSelectedTask(refreshedSelectedTask);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const data = await getProjects();
    setProjects(data);
    return data;
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("taskflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    const bootstrapSession = async () => {
      const cachedUser = getStoredUser();
      if (cachedUser) {
        setAuthUser(cachedUser);
      }

      try {
        const { user } = await getCurrentUser(token);
        setStoredUser(user);
        setAuthUser(user);
      } catch (error) {
        clearStoredToken();
        clearStoredUser();
        setAuthUser(null);
      }

      try {
        const projectList = await fetchProjects();
        const initialProject = projectList[0] || null;
        setCurrentProject(initialProject);
        if (initialProject) {
          await fetchTasks(initialProject._id, initialFilters);
        }
      } catch (projectError) {
        setError(projectError.response?.data?.message || "Unable to load projects.");
      }
    };

    bootstrapSession();
  }, []);

  const handleCreate = async (payload) => {
    if (!currentProject?._id) {
      setError("Create a project first before adding tasks.");
      return;
    }
    try {
      await createTask({ ...payload, projectId: currentProject._id });
      await fetchTasks(currentProject._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create task.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      if (selectedTask?._id === id) {
        setSelectedTask(null);
      }
      await fetchTasks(currentProject?._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete task.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await updateTask(id, payload);
      await fetchTasks(currentProject?._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update task.");
    }
  };

  const handleFilterChange = async (name, value) => {
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
  };

  const handleApplyFilters = async () => {
    await fetchTasks(currentProject?._id, filters);
  };

  const handleResetFilters = async () => {
    setFilters(initialFilters);
    await fetchTasks(currentProject?._id, initialFilters);
  };

  const handleAuthenticated = ({ token, user }) => {
    setStoredToken(token);
    setStoredUser(user);
    setAuthUser(user);
    fetchProjects()
      .then((projectList) => {
        const initialProject = projectList[0] || null;
        setCurrentProject(initialProject);
        if (initialProject) {
          fetchTasks(initialProject._id, initialFilters);
        }
      })
      .catch(() => setError("Unable to load projects."));
  };

  const handleLogout = () => {
    clearStoredToken();
    clearStoredUser();
    setAuthUser(null);
    setTasks([]);
    setProjects([]);
    setCurrentProject(null);
    setSelectedTask(null);
    setFilters(initialFilters);
    setActiveView("dashboard");
  };

  const handleCreateProject = async (payload) => {
    const project = await createProject(payload);
    const nextProjects = await fetchProjects();
    const createdProject =
      nextProjects.find((item) => item._id === project._id) || project;
    setCurrentProject(createdProject);
    setActiveView("dashboard");
    await fetchTasks(createdProject._id, filters);
  };

  const handleSelectProject = async (project) => {
    setCurrentProject(project);
    setSelectedTask(null);
    setSearchQuery("");
    setActiveView("dashboard");
    await fetchTasks(project._id, filters);
  };

  const handleAddMembers = async (projectId, members, memberEntries = []) => {
    await addProjectMembers(projectId, members, memberEntries);
    const updatedProjects = await fetchProjects();
    const updatedCurrentProject = updatedProjects.find((project) => project._id === projectId) || null;
    setCurrentProject(updatedCurrentProject);
  };

  const handleRemoveMember = async (projectId, username) => {
    await removeProjectMember(projectId, username);
    const updatedProjects = await fetchProjects();
    const updatedCurrentProject = updatedProjects.find((project) => project._id === projectId) || null;
    setCurrentProject(updatedCurrentProject);
  };

  const handleMoveTask = async (taskId, nextStatus) => {
    const task = tasks.find((item) => item._id === taskId);
    if (!task || task.status === nextStatus) {
      return;
    }
    await handleUpdate(taskId, { status: nextStatus });
  };

  const handleUpdateProfile = async (payload) => {
    const token = getStoredToken();
    if (!token) {
      return;
    }
    const { user } = await updateCurrentUser(token, payload);
    setAuthUser(user);
    setStoredUser(user);
  };

  const openSettings = () => {
    setSettingsName(authUser?.name || "");
    setSettingsAvatar(authUser?.avatar || "");
    setShowSettings(true);
  };

  const handleSettingsAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSettingsAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    await handleUpdateProfile({
      name: settingsName.trim() || authUser?.name,
      avatar: settingsAvatar,
    });
    setShowSettings(false);
  };

  if (!getStoredToken()) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const visibleTasks = tasks.filter((task) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return [task.title, task.description, task.assignedTo, task.priority, task.status]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
  const hasActiveFilters = Boolean(filters.status || filters.priority);
  const currentUsername = authUser?.username?.toLowerCase?.() || "";
  const myTasks = visibleTasks.filter(
    (task) => task.assignedTo && task.assignedTo.toLowerCase() === currentUsername
  );
  const dueTasks = visibleTasks
    .filter((task) => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const leadingDays = monthStart.getDay();
  const dueTaskMapByDate = dueTasks.reduce((acc, task) => {
    const date = new Date(task.deadline);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {});
  const calendarCells = [];
  for (let i = 0; i < leadingDays; i += 1) {
    calendarCells.push({ isPadding: true, key: `pad-start-${i}` });
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}`;
    calendarCells.push({
      isPadding: false,
      day,
      key: `day-${day}`,
      dateKey: key,
      isToday: key === todayKey,
      tasks: dueTaskMapByDate[key] || [],
    });
  }
  const selectedDayTasks = selectedCalendarDay ? dueTaskMapByDate[selectedCalendarDay] || [] : [];
  const isProjectAdmin = Boolean(
    (currentProject?.ownerId &&
      authUser?.id &&
      String(currentProject.ownerId) === String(authUser.id)) ||
      (currentProject?.adminEmail &&
        authUser?.email &&
        currentProject.adminEmail.toLowerCase() === authUser.email.toLowerCase()) ||
      (currentProject?.owner &&
        authUser?.username &&
        currentProject.owner.toLowerCase() === authUser.username.toLowerCase())
  );
  const teamProfiles = (currentProject?.memberProfiles?.length
    ? currentProject.memberProfiles
    : (currentProject?.members || []).map((username) => ({
        username,
        email: "",
        name: username,
      }))) || [];
  const teamProfilesSorted = [...teamProfiles].sort((a, b) => {
    const aRole = a.role || "worker";
    const bRole = b.role || "worker";
    const aIsAdmin = aRole === "admin";
    const bIsAdmin = bRole === "admin";

    if (aIsAdmin === bIsAdmin && aRole === bRole) {
      return (a.name || a.username || "").localeCompare(b.name || b.username || "");
    }
    if (aIsAdmin !== bIsAdmin) {
      return aIsAdmin ? -1 : 1;
    }
    return aRole === "admin" ? -1 : 1;
  });
  const analyticsByMember = teamProfiles.map((member) => {
    const memberTasks = tasks.filter(
      (task) => task.assignedTo && task.assignedTo.toLowerCase() === member.username
    );
    const done = memberTasks.filter((task) => task.status === "Done").length;
    const remaining = Math.max(memberTasks.length - done, 0);
    const completion = memberTasks.length ? Math.round((done / memberTasks.length) * 100) : 0;
    return { member, done, remaining, total: memberTasks.length, completion };
  });

  return (
    <main className="dashboard-layout">
      <ProjectSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        currentUser={authUser}
        projects={projects}
        activeProjectId={currentProject?._id}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        isProjectAdmin={isProjectAdmin}
        onOpenSettings={openSettings}
        onLogout={handleLogout}
      />

      <section className="app-shell">
        <header className="hero-header">
          <div className="brand-block">
            <img className="brand-logo" src="/taskflow-logo.png" alt="TaskFlow logo" />
            <div>
              <h1 className="brand-title">
                <span className="brand-title-task">Task</span>
                <span className="brand-title-flow">Flow</span>
              </h1>
              {authUser?.name ? <small className="user-label">{authUser.name}</small> : null}
            </div>
          </div>
          <div className="hero-stats">
            <label className="search-chip">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <div className="stat-chip datetime-chip">
              <span>{formattedTime}</span>
              <small>{formattedDate}</small>
            </div>
            <div className="stat-chip">
              <span>{tasks.length}</span>
              <small>Total Tasks</small>
            </div>
            <div className="stat-chip">
              <span>{tasks.filter((task) => task.status === "Done").length}</span>
              <small>Completed</small>
            </div>
            <button
              className="secondary-btn theme-toggle-btn"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              type="button"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
            </button>
          </div>
        </header>

        {error ? <p className="error-text">{error}</p> : null}

        {activeView === "dashboard" ? (
          <section className="layout-grid">
            <div className="control-panel">
              <TaskForm onSubmit={handleCreate} projectMembers={currentProject?.members || []} />
              <TaskFilters
                filters={filters}
                onChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            <section>
              <h2 className="board-title">
                {currentProject ? `${currentProject.name} Workflow Board` : "Create a project to start"}
              </h2>
              {currentProject ? (
                <KanbanBoard
                  tasks={visibleTasks}
                  loading={loading}
                  selectedTaskId={selectedTask?._id}
                  onSelectTask={setSelectedTask}
                  onMoveTask={handleMoveTask}
                />
              ) : (
                <p className="empty-state">
                  Create your first project with the New Project button before creating tasks.
                </p>
              )}
            </section>
          </section>
        ) : null}

        {activeView === "my-tasks" ? (
          <section>
            <h2 className="board-title">My Tasks</h2>
            <KanbanBoard
              tasks={myTasks}
              loading={loading}
              selectedTaskId={selectedTask?._id}
              onSelectTask={setSelectedTask}
              onMoveTask={handleMoveTask}
            />
          </section>
        ) : null}

        {activeView === "calendar" ? (
          <section>
            <h2 className="board-title">Calendar</h2>
            <div className="task-form calendar-shell">
              <div className="calendar-header">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setSelectedCalendarDay(null);
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    );
                  }}
                >
                  ← Prev
                </button>
                <strong>
                  {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </strong>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setSelectedCalendarDay(null);
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                    );
                  }}
                >
                  Next →
                </button>
              </div>
              <div className="calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarCells.map((cell) =>
                  cell.isPadding ? (
                    <div key={cell.key} className="calendar-cell calendar-cell-muted" />
                  ) : (
                    <button
                      key={cell.key}
                      type="button"
                      className={`calendar-cell ${cell.isToday ? "calendar-cell-today" : ""} ${
                        selectedCalendarDay === cell.dateKey ? "calendar-cell-selected" : ""
                      }`}
                      onClick={() => setSelectedCalendarDay(cell.dateKey)}
                    >
                      <div className="calendar-day">{cell.day}</div>
                      {cell.tasks.slice(0, 2).map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          className={`calendar-task-pill priority-${task.priority}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTask(task);
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      ))}
                      {cell.tasks.length > 2 ? (
                        <small className="calendar-more">+{cell.tasks.length - 2} more</small>
                      ) : null}
                    </button>
                  )
                )}
              </div>
              <AnimatePresence mode="wait">
                {selectedCalendarDay ? (
                  <motion.div
                    key={selectedCalendarDay}
                    className="calendar-day-panel"
                    initial={{ opacity: 0, x: 36 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.45 }}
                  >
                  <h4>
                    Tasks for{" "}
                    {new Date(
                      Number(selectedCalendarDay.split("-")[0]),
                      Number(selectedCalendarDay.split("-")[1]),
                      Number(selectedCalendarDay.split("-")[2])
                    ).toLocaleDateString()}
                  </h4>
                  {selectedDayTasks.length === 0 ? (
                    <p>No tasks due on this day.</p>
                  ) : (
                    selectedDayTasks.map((task) => (
                      <button
                        key={`panel-${task._id}`}
                        type="button"
                        className={`calendar-day-task priority-${task.priority}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.title} - {task.status}
                      </button>
                    ))
                  )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        ) : null}

        {activeView === "team" ? (
          <section>
            <div className="team-header-row">
              <h2 className="board-title">Team</h2>
              {isProjectAdmin ? (
                <button
                  type="button"
                  className="secondary-btn team-add-member-btn"
                  onClick={() => {
                    setShowAddMemberForm((prev) => !prev);
                    setTeamMemberError("");
                  }}
                >
                  Add Member
                </button>
              ) : null}
            </div>
            <div className="task-form">
              {teamProfilesSorted.map((member) => {
                const isAdminMember =
                  (member.role || "worker") === "admin" ||
                  (member.email &&
                    currentProject?.adminEmail &&
                    member.email.toLowerCase() === currentProject.adminEmail.toLowerCase()) ||
                  (member.username &&
                    currentProject?.owner &&
                    member.username.toLowerCase() === currentProject.owner.toLowerCase());
                const isCurrentUserMember =
                  (member.username &&
                    authUser?.username &&
                    member.username.toLowerCase() === authUser.username.toLowerCase()) ||
                  (member.email &&
                    authUser?.email &&
                    member.email.toLowerCase() === authUser.email.toLowerCase()) ||
                  (member.name &&
                    authUser?.name &&
                    member.name.toLowerCase() === authUser.name.toLowerCase());
                return (
                <div key={member.email || member.username || member.name} className="member-list-item">
                  {member.avatar ||
                  (authUser?.avatar && isCurrentUserMember) ? (
                    <img
                      className="member-avatar-image"
                      src={member.avatar || authUser.avatar}
                      alt={`${member.username || "member"} avatar`}
                    />
                  ) : (
                    <span className="member-avatar">{(member.username || "u").slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="member-name">
                    <strong>{member.name || member.username || "Unknown user"}</strong>
                    <br />
                    <small>
                      {member.username ? `@${member.username}` : "No username"}{" "}
                      {member.email ? `• ${member.email}` : ""}
                    </small>
                  </span>
                  <div className="member-actions">
                    {isAdminMember ? <span className="admin-badge">Admin</span> : null}
                    {isProjectAdmin && !isAdminMember && !isCurrentUserMember ? (
                        <button
                          type="button"
                          className="danger-btn"
                          disabled={!member.username || isUpdatingTeam}
                          onClick={async () => {
                            if (!currentProject?._id || !member.username) {
                              return;
                            }
                            const shouldRemove = window.confirm(
                              `Remove @${member.username} from "${currentProject.name}"?`
                            );
                            if (!shouldRemove) {
                              return;
                            }
                            setTeamMemberError("");
                            setIsUpdatingTeam(true);
                            try {
                              await handleRemoveMember(currentProject._id, member.username);
                            } catch (removeError) {
                              setTeamMemberError(
                                removeError.response?.data?.message || "Unable to remove member."
                              );
                            } finally {
                              setIsUpdatingTeam(false);
                            }
                          }}
                        >
                          Remove
                        </button>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeView === "analytics" && isProjectAdmin ? (
          <section>
            <h2 className="board-title">Team Analytics</h2>
            <div className="analytics-grid">
              {analyticsByMember.map(({ member, done, remaining, total, completion }) => (
                <div key={member.email || member.username} className="analytics-card">
                  <div className="analytics-card-head">
                    <span className="member-avatar">◫</span>
                    <div>
                      <strong>{member.username}</strong>
                      <small>{member.email || "No email available"}</small>
                    </div>
                  </div>
                  <div className="analytics-metrics">
                    <span>Done: {done}</span>
                    <span>Remaining: {remaining}</span>
                    <span>Total: {total}</span>
                  </div>
                  <div className="analytics-progress-track">
                    <div className="analytics-progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                  <small>{completion}% completed</small>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
      {showAddMemberForm && isProjectAdmin ? (
        <div
          className="task-details-overlay"
          onClick={() => {
            setShowAddMemberForm(false);
            setTeamMemberError("");
          }}
        >
          <aside className="task-details-panel" onClick={(event) => event.stopPropagation()}>
            <h2>Add Member</h2>
            <form
              className="project-form"
              onSubmit={async (event) => {
                event.preventDefault();
                const username = parseUsernames(teamMemberUsername)[0];
                if (!username || !currentProject?._id) {
                  setTeamMemberError("Please enter a username.");
                  return;
                }
                setTeamMemberError("");
                setIsUpdatingTeam(true);
                try {
                  await handleAddMembers(
                    currentProject._id,
                    [username],
                    [{ username, role: teamMemberRole }]
                  );
                  setTeamMemberUsername("");
                  setTeamMemberRole("worker");
                  setShowAddMemberForm(false);
                } catch (teamError) {
                  setTeamMemberError(
                    teamError.response?.data?.message || "Unable to add members."
                  );
                } finally {
                  setIsUpdatingTeam(false);
                }
              }}
            >
              <input
                type="text"
                placeholder="Username"
                value={teamMemberUsername}
                onChange={(event) => setTeamMemberUsername(event.target.value)}
              />
              <select
                value={teamMemberRole}
                onChange={(event) => setTeamMemberRole(event.target.value)}
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
              {teamMemberError ? <p className="error-text">{teamMemberError}</p> : null}
              <button type="submit">
                {isUpdatingTeam ? "Saving..." : "Add Members"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowAddMemberForm(false);
                  setTeamMemberError("");
                }}
              >
                Cancel
              </button>
            </form>
          </aside>
        </div>
      ) : null}
      {showSettings ? (
        <div className="task-details-overlay" onClick={() => setShowSettings(false)}>
          <aside className="task-details-panel" onClick={(event) => event.stopPropagation()}>
            <h2>Settings</h2>
            <form className="project-form" onSubmit={handleSaveSettings}>
              <input
                type="text"
                value={settingsName}
                placeholder="Display name"
                onChange={(event) => setSettingsName(event.target.value)}
              />
              <label className="profile-upload-btn">
                Upload Profile Picture
                <input type="file" accept="image/*" onChange={handleSettingsAvatarSelect} />
              </label>
              {settingsAvatar ? <img className="profile-avatar-image" src={settingsAvatar} alt="Preview" /> : null}
              <button type="submit">Save Settings</button>
            </form>
          </aside>
        </div>
      ) : null}
      <TaskDetailsPanel
        task={selectedTask}
        projectMembers={currentProject?.members || []}
        onClose={() => setSelectedTask(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </main>
  );
}

export default App;
