/**
 * Report Filters Hook
 * 
 * Reusable hook for managing filter state with optional URL synchronization.
 * Provides a clean API for setting, resetting, and accessing filter values.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Default status options for filter dropdowns
 */
export const DEFAULT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
];

/**
 * Custom hook for managing report filters with URL synchronization
 * @param {Object} options - Hook configuration options
 * @param {Object} [options.initial] - Initial filter values
 * @param {boolean} [options.syncToURL=true] - Whether to sync filters with URL parameters
 * @returns {Object} Filter state and methods
 */
export function useReportFilters({ initial, syncToURL = true } = {}) {
  const [params, setParams] = useSearchParams();
  
  // Initialize filter state
  const [filters, setFilters] = useState(() => ({
    startDate: initial?.startDate || "",
    endDate: initial?.endDate || "",
    status: initial?.status || "",
    projectId: initial?.projectId || "",
    userId: initial?.userId || "",
  }));

  // Hydrate from URL parameters (once on mount)
  useEffect(() => {
    if (!syncToURL) return;
    
    setFilters((prev) => ({
      startDate: params.get("startDate") || prev.startDate,
      endDate: params.get("endDate") || prev.endDate,
      status: params.get("status") || prev.status,
      projectId: params.get("projectId") || prev.projectId,
      userId: params.get("userId") || prev.userId,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push filter updates to URL
  useEffect(() => {
    if (!syncToURL) return;
    
    const next = new URLSearchParams(params);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    
    setParams(next, { replace: true });
  }, [filters, params, setParams, syncToURL]);

  /**
   * Update a single filter value
   * @param {string} key - Filter key to update
   * @param {string} value - New filter value
   */
  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Reset all filters to empty values
   */
  const resetFilters = () =>
    setFilters({ 
      startDate: "", 
      endDate: "", 
      status: "", 
      projectId: "", 
      userId: "" 
    });

  // Provide stable object reference for consumers
  const current = useMemo(() => filters, [filters]);

  return { 
    filters: current, 
    setFilter, 
    resetFilters 
  };
}