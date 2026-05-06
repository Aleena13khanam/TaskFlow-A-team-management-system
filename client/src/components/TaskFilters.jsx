function TaskFilters({ filters, onChange, onApply, onReset, hasActiveFilters }) {
  return (
    <details className={`filters filter-compact ${hasActiveFilters ? "filters-active" : ""}`} open>
      <summary>
        <h3>
          Filters {hasActiveFilters ? <span className="active-dot" aria-label="active filters" /> : null}
        </h3>
      </summary>
      <div className="filters-body">
        <div className="filters-row">
          <label>
            Status
            <select
              value={filters.status}
              onChange={(e) => onChange("status", e.target.value)}
            >
              <option value="">All</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={filters.priority}
              onChange={(e) => onChange("priority", e.target.value)}
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
        <div className="filter-actions">
          <button onClick={onApply} type="button">
            Apply Filters
          </button>
          <button className="secondary-btn" onClick={onReset} type="button">
            Reset
          </button>
        </div>
      </div>
    </details>
  );
}

export default TaskFilters;
