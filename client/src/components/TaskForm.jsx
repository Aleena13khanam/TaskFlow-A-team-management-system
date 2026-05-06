import { useMemo, useState } from "react";

const emptyTask = {
  title: "",
  description: "",
  status: "To Do",
  priority: "Low",
  deadline: "",
  assignedTo: "",
};

function TaskForm({ onSubmit, mode = "create", initialValues, projectMembers = [] }) {
  const [task, setTask] = useState(initialValues || emptyTask);
  const [error, setError] = useState("");

  const buttonLabel = useMemo(
    () => (mode === "edit" ? "Update Task" : "Add Task"),
    [mode]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!task.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setError("");
    await onSubmit({
      ...task,
      title: task.title.trim(),
      description: task.description.trim(),
      assignedTo: task.assignedTo.trim(),
      deadline: task.deadline || null,
    });

    if (mode === "create") {
      setTask(emptyTask);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{mode === "edit" ? "Edit Task" : "Create Task"}</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <label>
        Title
        <input
          type="text"
          name="title"
          placeholder="Task title"
          value={task.title}
          onChange={handleChange}
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          placeholder="Task description"
          value={task.description}
          onChange={handleChange}
        />
      </label>

      <div className="task-form-grid">
        <label>
          Status
          <select name="status" value={task.status} onChange={handleChange}>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </label>

        <label>
          Priority
          <select name="priority" value={task.priority} onChange={handleChange}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>

      <div className="task-form-grid">
        <label>
          Deadline
          <input
            type="date"
            name="deadline"
            value={task.deadline ? task.deadline.slice(0, 10) : ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Assign To
          <div className="input-with-icon">
            <select
              name="assignedTo"
              value={task.assignedTo}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
            <span className="input-icon" aria-hidden="true">
              👤
            </span>
          </div>
        </label>
      </div>

      <button type="submit">{buttonLabel}</button>
    </form>
  );
}

export default TaskForm;
