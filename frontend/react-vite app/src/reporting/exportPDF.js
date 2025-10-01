/**
 * PDF Export Utility
 * 
 * Provides functions for exporting time entries to PDF format
 * using jsPDF and jsPDF-AutoTable.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Format minutes as hours and minutes
 * @param {number} mins - Minutes to format
 * @returns {string} Formatted time string (e.g., "2h 30m")
 */
function formatHrsMins(mins = 0) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}m`;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

/**
 * Get task text from entry with fallbacks
 * @param {Object} entry - Time entry object
 * @returns {string} Task description
 */
function getTaskText(entry = {}) {
  if (entry.task) return entry.task;
  if (Array.isArray(entry.tasks)) {
    const first = entry.tasks[0];
    return typeof first === "string" ? first : (first?.name || "—");
  }
  if (entry.tasks && typeof entry.tasks === "object") return entry.tasks.name || "—";
  return entry.taskName || entry.description || "—";
}

/**
 * Export time entries to PDF
 * @param {Array} entries - Filtered time entries to export
 * @param {Object} filters - Current filter values
 * @param {Object} profile - User profile information
 * @param {Object} totals - Time totals
 */
export function exportToPDF(entries, filters, profile, totals) {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Time Tracking Report', 14, 22);
  
  // Add date range
  const fromDate = filters.startDate ? formatDate(filters.startDate) : 'All time';
  const toDate = filters.endDate ? formatDate(filters.endDate) : 'Present';
  const dateRange = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  
  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125);
  doc.text(`Date Range: ${dateRange}`, 14, 30);
  
  // Add filters if applied
  const appliedFilters = [];
  if (filters.status) appliedFilters.push(`Status: ${filters.status}`);
  if (filters.projectId) appliedFilters.push(`Project ID: ${filters.projectId}`);
  if (filters.userId) appliedFilters.push(`User ID: ${filters.userId}`);
  
  if (appliedFilters.length > 0) {
    doc.text(`Filters: ${appliedFilters.join(', ')}`, 14, 36);
  }
  
  // Add user info
  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  doc.text(`Employee: ${profile.name}`, 14, 44);
  doc.text(`Email: ${profile.email}`, 14, 50);
  
  // Add summary
  doc.text(`Total Time: ${formatHrsMins(totals.totalMinutes)}`, 14, 56);
  doc.text(`Avg/Week: ${formatHrsMins(totals.avgPerWeekMinutes)}`, 14, 62);
  
  // Create table
  const tableColumn = ["Date", "Project", "Task", "Duration", "Status"];
  const tableRows = entries.map(entry => [
    formatDate(entry.date),
    entry.project || entry.projectId || "—",
    getTaskText(entry),
    formatHrsMins(entry.minutes),
    entry.status || "pending"
  ]);
  
  // Add table to document
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 30 }, // Date
      1: { cellWidth: 40 }, // Project
      2: { cellWidth: 'auto' }, // Task
      3: { cellWidth: 30 }, // Duration
      4: { cellWidth: 25 }  // Status
    }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`time-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}