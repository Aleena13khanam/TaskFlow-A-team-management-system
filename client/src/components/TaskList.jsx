import TaskItem from "./TaskItem";

function TaskList({ tasks, onDelete, onUpdate }) {
  if (!tasks.length) {
    return <p className="empty-state">No tasks found for this filter.</p>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

export default TaskList;
