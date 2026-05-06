import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskForm from "./TaskForm";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "No deadline";
  }
  return new Date(dateValue).toLocaleDateString();
};

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67z"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"
      />
    </svg>
  );
}

function TaskDetailsPanel({ task, onClose, onDelete, onUpdate, projectMembers = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [quickStatus, setQuickStatus] = useState("To Do");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (task) {
      setQuickStatus(task.status);
    }
  }, [task]);

  return (
    <AnimatePresence>
      {task ? (
        <motion.div
          className="task-details-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.aside
            className="task-details-panel"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button type="button" className="panel-close" onClick={onClose}>
              x
            </button>

        {isEditing ? (
          <div>
            <h3>Edit Task</h3>
            <TaskForm
              mode="edit"
              projectMembers={projectMembers}
              initialValues={{
                title: task.title,
                description: task.description || "",
                status: task.status,
                priority: task.priority,
                deadline: task.deadline || "",
                assignedTo: task.assignedTo || "",
              }}
              onSubmit={async (payload) => {
                await onUpdate(task._id, payload);
                setIsEditing(false);
              }}
            />
            <button className="secondary-btn" type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <div className="panel-title-row">
              <h2>{task.title}</h2>
              <div className="task-actions panel-title-actions">
                <button
                  type="button"
                  className="secondary-btn icon-btn"
                  title="Edit task"
                  onClick={() => setIsEditing(true)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="danger-btn icon-btn"
                  title="Delete task"
                  onClick={() => onDelete(task._id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
            <div className="task-badges">
              <span className={`badge status-${task.status.replaceAll(" ", "-")}`}>{task.status}</span>
              <span className={`badge priority-${task.priority}`}>{task.priority}</span>
            </div>
            <p>{task.description || "No description provided."}</p>
            <p>
              <strong>Assigned To:</strong> {task.assignedTo || "Unassigned"}
            </p>
            <p>
              <strong>Deadline:</strong> {formatDate(task.deadline)}
            </p>

            <div className="status-update-block">
              <label htmlFor="quick-status-select">
                <strong>Update Status</strong>
              </label>
            <div className="status-update-row">
                <select
                  id="quick-status-select"
                  value={quickStatus}
                  onChange={(event) => setQuickStatus(event.target.value)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (quickStatus === task.status) {
                      return;
                    }
                    setIsUpdatingStatus(true);
                    await onUpdate(task._id, { status: quickStatus });
                    setIsUpdatingStatus(false);
                  }}
                >
                  {isUpdatingStatus ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

          </div>
        )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default TaskDetailsPanel;
