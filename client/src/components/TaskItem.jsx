import { motion } from "framer-motion";

function TaskItem({ task, isActive, onSelect, onDragStart, onDragEnd }) {
  return (
    <motion.button
      type="button"
      className={`task-strip priority-${task.priority} ${isActive ? "task-strip-active" : ""}`}
      onClick={() => onSelect(task)}
      draggable
      onDragStart={() => onDragStart(task._id)}
      onDragEnd={onDragEnd}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.3 }}
      layout
    >
      <div className={`task-strip-bar priority-${task.priority}`} />
      <div className="task-strip-content">
        <h4>{task.title}</h4>
        <p>{task.assignedTo || "Unassigned"}</p>
      </div>
    </motion.button>
  );
}

export default TaskItem;
