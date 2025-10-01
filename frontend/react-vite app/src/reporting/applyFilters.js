/**
 * Time Entry Filtering Utility
 * 
 * Pure function used by ReportPage (and exports) to derive the visible entries
 * based on filter criteria. Handles filtering by date range, status, project, and user.
 */

/**
 * Filters time entries based on provided filter criteria
 * @param {Array} entries - Array of time entry objects to filter
 * @param {Object} filters - Filter criteria object
 * @param {string} [filters.startDate] - Start date in ISO format
 * @param {string} [filters.endDate] - End date in ISO format
 * @param {string} [filters.status] - Entry status (pending, approved, rejected)
 * @param {string} [filters.projectId] - Project ID to filter by
 * @param {string} [filters.userId] - User ID to filter by
 * @returns {Array} Filtered entries that match all criteria
 */
export function applyFilters(entries = [], filters = {}) {
  const { startDate, endDate, status, projectId, userId } = filters;

  return entries.filter((entry) => {
    // Date range filter
    const okDate =
      (!startDate || entry.date >= startDate) &&
      (!endDate || entry.date <= endDate);

    // Status filter
    const okStatus = !status || entry.status === status;
    
    // Project filter - handles both direct ID and nested object reference
    const okProject =
      !projectId ||
      entry.projectId === projectId ||
      entry.project?._id === projectId;
    
    // User filter - handles both direct ID and nested object reference
    const okUser =
      !userId ||
      entry.userId === userId ||
      entry.user?._id === userId;
    
    // Entry must pass all active filters
    return okDate && okStatus && okProject && okUser;
  });
}