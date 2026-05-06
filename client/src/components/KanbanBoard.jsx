import { useState } from "react";
import TaskItem from "./TaskItem";

const statuses = ["To Do", "In Progress", "Done"];

function KanbanBoard({ tasks, loading, selectedTaskId, onSelectTask, onMoveTask }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const groupedTasks = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  if (loading) {
    return <p className="empty-state">Loading tasks...</p>;
  }

  const isEmpty = statuses.every((status) => groupedTasks[status].length === 0);

  if (isEmpty) {
    return <p className="empty-state">No tasks found for this filter.</p>;
  }

  return (
    <section className="kanban-board">
      {statuses.map((status) => (
        <div
          className={`kanban-column ${dragOverStatus === status ? "kanban-column-drag-over" : ""}`}
          key={status}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverStatus(status);
          }}
          onDragLeave={() => {
            if (dragOverStatus === status) {
              setDragOverStatus(null);
            }
          }}
          onDrop={async () => {
            if (draggedTaskId) {
              await onMoveTask(draggedTaskId, status);
            }
            setDraggedTaskId(null);
            setDragOverStatus(null);
          }}
        >
          <div className="kanban-column-header">
            <h3>{status}</h3>
            <span className="column-count">{groupedTasks[status].length}</span>
          </div>
          <div className="kanban-column-list">
            {groupedTasks[status].length ? (
              groupedTasks[status].map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  isActive={selectedTaskId === task._id}
                  onSelect={onSelectTask}
                  onDragStart={setDraggedTaskId}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))
            ) : (
              <div className="column-empty-state">
                <div className="empty-illustration" aria-hidden="true">
                  {status === "Done" ? "✓" : status === "In Progress" ? "⋯" : "☐"}
                </div>
                <p>No tasks yet - start by adding one!</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default KanbanBoard;
