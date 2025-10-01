/**
 * Filter Bar Component
 * 
 * Presentational component for report filtering UI.
 * Provides date range, status, project, and user filters.
 */
import React from "react";
import { DEFAULT_STATUS_OPTIONS } from "./useReportFilters";

/**
 * Filter bar component for reports
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onChange - Callback when a filter changes (key, value)
 * @param {Function} props.onReset - Callback to reset all filters
 * @param {Array} [props.statusOptions=[]] - Status filter options
 * @param {Array} [props.projectOptions=[]] - Project filter options
 * @param {Array} [props.userOptions=[]] - User filter options
 * @returns {JSX.Element} Filter bar component
 */
export default function FilterBar({
  filters,
  onChange,
  onReset,
  statusOptions = [],
  projectOptions = [],
  userOptions = [],
}) {
  // Create handler for input changes
  const handle = (key) => (e) => onChange(key, e.target.value);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        alignItems: "end",
        marginBottom: 16,
      }}
    >
      {/* Start Date Filter */}
      <div>
        <label className="form-label">Start date</label>
        <input
          type="date"
          className="form-control"
          value={filters.startDate || ""}
          onChange={handle("startDate")}
        />
      </div>

      {/* End Date Filter */}
      <div>
        <label className="form-label">End date</label>
        <input
          type="date"
          className="form-control"
          value={filters.endDate || ""}
          onChange={handle("endDate")}
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="form-label">Status</label>
        <select
          className="form-select"
          value={filters.status || ""}
          onChange={handle("status")}
        >
          {(statusOptions.length ? statusOptions : DEFAULT_STATUS_OPTIONS).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Project Filter */}
      <div>
        <label className="form-label">Project</label>
        <select
          className="form-select"
          value={filters.projectId || ""}
          onChange={handle("projectId")}
        >
          <option value="">All projects</option>
          {projectOptions.map((project) => (
            <option key={project.value} value={project.value}>
              {project.label}
            </option>
          ))}
        </select>
      </div>

      {/* User Filter */}
      <div>
        <label className="form-label">User</label>
        <select
          className="form-select"
          value={filters.userId || ""}
          onChange={handle("userId")}
        >
          <option value="">All users</option>
          {userOptions.map((user) => (
            <option key={user.value} value={user.value}>
              {user.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}