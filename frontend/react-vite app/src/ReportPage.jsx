// ReportPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";
import Button from './components/ui/Button';
import DashboardButton from "./components/ui/DashboardButton";
import CalendarView from "./components/CalendarView";
import FilterBar from "./reporting/FilterBar";
import { useReportFilters } from "./reporting/useReportFilters";
import { applyFilters } from "./reporting/applyFilters";
import { exportToPDF } from "./reporting/exportPDF";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

// ---------- Theme ----------
ChartJS.defaults.font.family =
  `'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
ChartJS.defaults.color = "#334155";
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.position = "top";

// ---------- Palette ----------
const PALETTE = [
  "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#06B6D4",
  "#8B5CF6", "#F97316", "#22C55E", "#14B8A6", "#E11D48",
];
const withAlpha = (hex, a = 0.25) => {
  const p = hex.replace("#", "");
  const r = parseInt(p.substring(0, 2), 16);
  const g = parseInt(p.substring(2, 4), 16);
  const b = parseInt(p.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};
const colorAt = (i) => PALETTE[i % PALETTE.length];
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ---------- Date helpers (local YYYY-MM-DD) ----------
const toLocalISO = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};
const toLocalDate = (iso) => new Date(`${iso}T00:00:00`);

// ---------- Tiny utils ----------
const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const downloadBlob = (filename, text, type) => {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// task text fallback
function getTaskText(entry = {}) {
  if (entry.task) return entry.task;
  if (Array.isArray(entry.tasks)) {
    const first = entry.tasks[0];
    return typeof first === "string" ? first : (first?.name || "—");
  }
  if (entry.tasks && typeof entry.tasks === "object") return entry.tasks.name || "—";
  return entry.taskName || entry.description || "—";
}

// --- Presentational helpers ---
function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 16,
        boxShadow: "0 6px 16px rgba(2,6,23,.06)",
        border: "1px solid #e5e7eb",
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ color: "#475569", fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 16,
        boxShadow: "0 6px 16px rgba(2,6,23,.06)",
        border: "1px solid #e5e7eb",
        marginBottom: 16,
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 12, color: "#0f172a" }}>{title}</h3>
      {children}
    </div>
  );
}

function FilterButton({ active, onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        border: active ? "none" : `1px solid ${color}`,
        backgroundColor: active ? color : "transparent",
        color: active ? "white" : color,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .2s ease",
      }}
    >
      {children}
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? "#ffffff" : "#e2e8f0",
        color: active ? "#0f172a" : "#64748b",
        padding: "10px 20px",
        border: active ? "1px solid #e5e7eb" : "1px solid transparent",
        borderBottom: active ? "3px solid #4F46E5" : "none",
        borderRadius: "10px 10px 0 0",
        fontWeight: 600,
        cursor: "pointer",
        marginRight: 4,
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export default function ReportPage() {
  const { user } = useAuth();

  // User information from AuthContext

  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({ totalMinutes: 0, avgPerWeekMinutes: 0 });
  const [projectCount, setProjectCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarView, setCalendarView] = useState("month");
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMode, setViewMode] = useState("team");
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const isSuperAdmin = user?.role === "superadmin";
  
  // Initialize filter state with URL synchronization
  const { filters, setFilter, resetFilters } = useReportFilters({
    initial: {
      startDate: "",
      endDate: "",
      status: "",
      projectId: "",
      userId: ""
    }
  });
  
  // Fetch supervisor information
  const fetchSupervisorInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const response = await fetch(`${API_BASE}/api/user/supervisor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.ok) {
        const data = await response.json();
        setSupervisorInfo(data.supervisor);
      } else {
        console.error("Error fetching supervisor info:", response.status, response.statusText);
      }
    } catch (error) {
      // Handle supervisor info fetch error silently
    }
  };

  // Fetch all supervisors (for superadmin)
  const fetchAllSupervisors = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const response = await fetch(`${API_BASE}/api/superadmin/supervisors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data.supervisors || []);
        
        // If no supervisor is selected yet and we have supervisors, select the first one
        if (!selectedSupervisor && data.supervisors?.length > 0) {
          setSelectedSupervisor(data.supervisors[0]);
          
          // If we have a selected supervisor, fetch their team members
          if (data.supervisors[0]) {
            fetchTeamMembersForSupervisor(data.supervisors[0]._id);
          }
        }
      } else {
        console.error("Error fetching supervisors:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };
  
  // Fetch team members for a specific supervisor (for superadmin)
  const fetchTeamMembersForSupervisor = async (supervisorId) => {
    if (!isSuperAdmin || !supervisorId) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/supervisors/${supervisorId}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data || []);
      } else {
        console.error("Error fetching team members:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  // Call fetchAllSupervisors when user is superadmin
  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchAllSupervisors();
    }
  }, [user?.role, fetchAllSupervisors]);
  
  // Fetch team members when a supervisor is selected by superadmin
  useEffect(() => {
    if (isSuperAdmin && selectedSupervisor?._id) {
      fetchTeamMembersForSupervisor(selectedSupervisor._id);
    }
  }, [isSuperAdmin, selectedSupervisor?._id]);

  // Get profile information based on view mode and selected team member
  const profile = useMemo(() => {
    // If superadmin is viewing a supervisor's data
    if (isSuperAdmin && selectedSupervisor) {
      // If viewing an individual team member under a supervisor
      if (viewMode === "individual" && selectedTeamMember) {
        const selectedMember = teamMembers.find(m => m._id === selectedTeamMember);
        if (selectedMember) {
          return {
            name: selectedMember.name || "—",
            email: selectedMember.email || "—",
            supervisor: selectedSupervisor.name || "—"
          };
        }
      }
      
      // Otherwise show supervisor data
      return {
        name: selectedSupervisor.name || "—",
        email: selectedSupervisor.email || "—"
      };
    }
    
    // If supervisor is viewing an individual team member
    if (user?.role === "supervisor" && viewMode === "individual" && selectedTeamMember) {
      const selectedMember = teamMembers.find(m => m._id === selectedTeamMember);
      if (selectedMember) {
        return {
          name: selectedMember.name || "—",
          email: selectedMember.email || "—",
          supervisor: localStorage.getItem("name") || "—"
        };
      }
    }
    
    // For employee role, always show their own information
    if (user?.role === "employee") {
      return {
        name: localStorage.getItem("name") || "—",
        email: localStorage.getItem("email") || "—",
        supervisor: supervisorInfo?.name || "—"
      };
    }
    
    // Default to current user's profile
    return {
      name: localStorage.getItem("name") || "—",
      email: localStorage.getItem("email") || "—",
      supervisor: supervisorInfo?.name || "—"
    };
  }, [user?.role, viewMode, selectedTeamMember, teamMembers, supervisorInfo, isSuperAdmin, selectedSupervisor]);

  const API_BASE = (
    import.meta.env?.VITE_API_BASE_URL ||
    (import.meta.env?.DEV ? "http://localhost:4000" : "")
  ).replace(/\/$/, "");
  
  // API base URL configuration

  // Default range based on calendar view
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const midMonth = new Date(today.getFullYear(), today.getMonth(), 15);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Calculate start and end of current week
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - currentDay));
  
  // Determine if today is in first half or second half of month
  const isFirstHalfOfMonth = today.getDate() <= 15;
  
  // Set initial date range based on calendar view and current date
  const [fromDate, setFromDate] = useState(
    calendarView === 'month' 
      ? (isFirstHalfOfMonth ? toLocalISO(firstOfMonth) : toLocalISO(new Date(today.getFullYear(), today.getMonth(), 16)))
      : toLocalISO(startOfWeek)
  );
  const [toDate, setToDate] = useState(
    calendarView === 'month' 
      ? (isFirstHalfOfMonth ? toLocalISO(midMonth) : toLocalISO(lastOfMonth))
      : toLocalISO(endOfWeek)
  );

  // Fetch supervisor info when component mounts
  useEffect(() => {
    if (user && user.role === 'employee') {
      fetchSupervisorInfo();
    }
  }, [user]);

  // -------- Fetch --------
  const fetchReportData = async (isRetry = false) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      console.log("fetchReportData - Token exists:", !!token);
      if (!token) throw new Error("Authentication required");
      if (!user?.role) throw new Error("User role not available");

      // Fetch team members if supervisor
      if (user.role === "supervisor" && !isSuperAdmin) {
        try {
          // Fetch team members for supervisor
          
          const teamRes = await fetch(`${API_BASE}/api/supervisor/team`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setTeamMembers(teamData);
          } else {
            const errorText = await teamRes.text();
          }
        } catch (teamErr) {
          // Handle team fetch error silently
        }
      }

      // Determine endpoint and query parameters
      let endpoint = "/api/time"; // Default endpoint
      let queryParams = "";
      
      if (isSuperAdmin) {
        // Superadmin viewing a supervisor's reports
        if (selectedSupervisor) {
          endpoint = "/api/superadmin/supervisor/entries";
          queryParams = `?supervisorId=${selectedSupervisor._id}`;
          
          // If a team member is selected, add userId filter
          if (viewMode === "individual" && selectedTeamMember) {
            queryParams += `&userId=${selectedTeamMember}`;
          }
        } else {
          // If no supervisor is selected, use a safe endpoint that returns empty array
          endpoint = "/api/time";
        }
      } else if (user.role === "supervisor") {
        endpoint = "/api/supervisor/entries";
        
        // If in individual mode and a team member is selected, add userId filter
        if (viewMode === "individual" && selectedTeamMember) {
          queryParams = `?userId=${selectedTeamMember}`;
        }
      }

      // Prepare to fetch time entries
      const res = await fetch(`${API_BASE}${endpoint}${queryParams}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      
      // Process API response
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to load (${res.status}): ${errorText}`);
      }

      // Add better error handling for JSON parsing
      let entries;
      try {
        const text = await res.text();
        console.log('Raw response:', text.substring(0, 100)); // Log the first 100 chars
        entries = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      
      entries = Array.isArray(entries) ? entries : [];
      entries = entries.map((e) => ({
        ...e,
        status: e.status || "pending",
        minutes: typeof e.minutes === "number" ? e.minutes : 0,
      }));

      setReportData(entries);
    } catch (err) {
      if (!isRetry && retryCount < 2 && !/Authentication|Access denied/i.test(err.message)) {
        setRetryCount((p) => p + 1);
        setTimeout(() => fetchReportData(true), 1000 * (retryCount + 1));
        return;
      }
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      fetchReportData();
      if (user.role === 'employee') {
        fetchSupervisorInfo();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, user?.role]);
  
  // Refetch data when view mode, selected team member, selected supervisor, or date range changes
  useEffect(() => {
    if (user?.role) {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedTeamMember, selectedSupervisor, fromDate, toDate]);
  
  // Update date range when calendar view changes
  useEffect(() => {
    const today = new Date();
    if (calendarView === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const midMonth = new Date(today.getFullYear(), today.getMonth(), 15);
      const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const isFirstHalfOfMonth = today.getDate() <= 15;
      
      if (isFirstHalfOfMonth) {
        setFromDate(toLocalISO(firstOfMonth));
        setToDate(toLocalISO(midMonth));
      } else {
        setFromDate(toLocalISO(new Date(today.getFullYear(), today.getMonth(), 16)));
        setToDate(toLocalISO(lastOfMonth));
      }
    } else { // week view
      const currentDay = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - currentDay));
      setFromDate(toLocalISO(startOfWeek));
      setToDate(toLocalISO(endOfWeek));
    }
  }, [calendarView]);

  // Apply filters to report data using the applyFilters utility
  const filtered = useMemo(() => {
    // Convert statusFilter to the format expected by applyFilters
    const filterStatus = statusFilter === "all" ? "" : statusFilter;
    
    // Create filter object that combines the URL filters with local state
    const activeFilters = {
      ...filters,
      status: filterStatus,
      startDate: fromDate || filters.startDate,
      endDate: toDate || filters.endDate,
      userId: selectedTeamMember || filters.userId
    };
    
    // Apply filters to the report data
    return applyFilters(reportData, activeFilters);
  }, [reportData, filters, statusFilter, fromDate, toDate, selectedTeamMember]);

  // ---- Stats from filtered ----
  const weekKey = (iso) => {
    const d = toLocalDate(iso || toLocalISO(new Date()));
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const dayMs = 86400000;
    const wk = Math.ceil(((d - jan1) / dayMs + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(wk).padStart(2, "0")}`;
  };

  useEffect(() => {
    const totalMinutes = filtered.reduce((a, c) => a + toNum(c.minutes), 0);
    const weeks = new Set(filtered.map((e) => weekKey(e.date || "")));
    const avgPerWeekMinutes = totalMinutes / Math.max(weeks.size || 0, 4);

    const perProj = {};
    filtered.forEach((e) => {
      const key = e.project || e.projectId || "Unknown";
      perProj[key] = toNum(perProj[key]) + toNum(e.minutes);
    });

    setTotals({ totalMinutes, avgPerWeekMinutes });
    setProjectCount(perProj);
  }, [filtered]);

  // ---- Charts ----
  const barData = useMemo(() => {
    const labels = Object.keys(projectCount);
    const minutes = labels.map((k) => projectCount[k] || 0);
    
    // If no data, provide a default dataset with a message
    if (labels.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
          label: "Hours per Project",
          data: [0],
          backgroundColor: withAlpha(colorAt(0), 0.35),
          borderColor: colorAt(0),
          borderWidth: 2,
          borderRadius: 10,
          hoverBackgroundColor: colorAt(0),
        }],
      };
    }
    
    return {
      labels,
      datasets: [{
        label: "Hours per Project",
        data: minutes,
        backgroundColor: labels.map((_, i) => withAlpha(colorAt(i), 0.35)),
        borderColor: labels.map((_, i) => colorAt(i)),
        borderWidth: 2,
        borderRadius: 10,
        hoverBackgroundColor: labels.map((_, i) => colorAt(i)),
      }],
    };
  }, [projectCount]);

  const barOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { color: "rgba(226,232,240,.6)" }, ticks: { maxRotation: 0 } },
      y: { 
        beginAtZero: true, 
        ticks: { 
          precision: 1,
          callback: function(value) {
            return (value / 60).toFixed(1) + 'h';
          }
        }, 
        grid: { color: "rgba(226,232,240,.6)" },
        title: {
          display: true,
          text: 'Hours'
        }
      },
    },
    plugins: { 
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === 0 && context.label === 'No Data Available') {
              return 'No time entries found';
            }
            const hours = (value / 60).toFixed(1);
            return `${label}: ${hours} hours (${value} minutes)`;
          }
        }
      }
    },
  }), []);

  const pieData = useMemo(() => {
    const labels = Object.keys(projectCount);
    const values = labels.map((k) => toNum(projectCount[k]));
    
    // If no data, provide a default dataset with a message
    if (labels.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
          data: [1],
          backgroundColor: [withAlpha(colorAt(0), 0.9)],
          borderColor: ['#fff'],
          borderWidth: 2,
        }],
      };
    }
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => withAlpha(colorAt(i), 0.9)),
        borderColor: labels.map(() => "#fff"),
        borderWidth: 2,
      }],
    };
  }, [projectCount]);

  const pieOptions = useMemo(() => ({ 
    plugins: { 
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            if (label === 'No Data Available') {
              return 'No time entries found';
            }
            const hours = (value / 60).toFixed(1);
            return `${label}: ${hours} hours (${value} minutes)`;
          }
        }
      }
    } 
  }), []);

  // ---- Export ----
  const formatHrsMins = (mins = 0) => {
    const m = Math.max(0, Math.round(toNum(mins)));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${h}h ${r}m`;
  };
  const formatDateCell = (v) => (v ? toLocalDate(v).toLocaleDateString() : "");
  const prettyRange = () => {
    const f = toLocalDate(fromDate).toLocaleDateString();
    const t = toLocalDate(toDate).toLocaleDateString();
    return f === t ? f : `${f} - ${t}`;
  };

  const exportCSV = () => {
    const header = ["Employee","Email","Date","Project","Task","Minutes","Hours"];
    const rows = filtered.map((e) => {
      const mins = toNum(e.minutes);
      return [
        profile.name, profile.email, formatDateCell(e.date),
        e.project || e.projectId || "", getTaskText(e), mins, (mins/60).toFixed(2)
      ];
    });
    const totalsRow = ["","","","","Total", Math.round(totals.totalMinutes), (totals.totalMinutes/60).toFixed(2)];
    const csv = [header, ...rows, totalsRow].map(r => r.map(csvEscape).join(",")).join("\n");
    downloadBlob(`time_report_${fromDate}_${toDate}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportPDF = () => {
    // Create filter object that combines the URL filters with local state
    const activeFilters = {
      ...filters,
      status: statusFilter === "all" ? "" : statusFilter,
      startDate: fromDate || filters.startDate,
      endDate: toDate || filters.endDate,
      userId: selectedTeamMember || filters.userId
    };
    
    // Use the new exportToPDF utility
    exportToPDF(filtered, activeFilters, profile, totals);
  };

  // ---------- UI ----------
  return (
    <div style={{ padding: "64px 24px 24px 24px", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-2">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" className="text-decoration-none text-primary">
                      <i className="bi bi-speedometer2 me-1"></i>
                      Dashboard
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-muted" aria-current="page">
                    Reports
                  </li>
                </ol>
              </nav>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-file-earmark-bar-graph text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">
                  {isSuperAdmin
                    ? selectedSupervisor
                      ? viewMode === "team"
                        ? <>Team Time Reports</>
                        : selectedTeamMember
                          ? <>Individual Time Reports</>
                          : <>Team Time Reports</>
                      : "Supervisor Reports"
                    : user?.role === "supervisor" 
                      ? viewMode === "team" 
                        ? "Team Time Reports" 
                        : <>Individual Time Reports</>
                      : "My Time Reports"}
                </h1>
              </div>
              {/* Labels for team and individual views */}
              {viewMode === "individual" && selectedTeamMember && (isSuperAdmin || user?.role === "supervisor") ? (
                <div className="mb-2">
                  <div className="mb-1">
                    <span className="text-muted">
                      Employee: <span className="fw-semibold text-primary">{teamMembers.find(m => m._id === selectedTeamMember)?.name || 'Team Member'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">
                      Supervisor: <span className="fw-semibold text-primary">{isSuperAdmin ? selectedSupervisor?.name : user?.name}</span>
                    </span>
                  </div>
                </div>
              ) : (viewMode === "team" && (isSuperAdmin || user?.role === "supervisor")) && (
                <div className="mb-2">
                  <span className="text-muted">
                    Supervisor: <span className="fw-semibold text-primary">{isSuperAdmin ? selectedSupervisor?.name : user?.name}</span>
                  </span>
                </div>
              )}
              <p className="text-muted mb-0">View and analyze your time tracking data</p>
              {user && user.role === 'employee' && supervisorInfo && (
                <div className="mt-1">
                  <span className="text-muted">
                    My Supervisor: <span className="fw-semibold text-primary">{supervisorInfo.name}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <DashboardButton size="sm" />
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="d-flex align-items-center"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Supervisor selector for superadmin */}
      {isSuperAdmin && (
        <div className="row mb-4">
          <div className="col-12">
            <div style={{
              background: "#fff",
              padding: 16,
              borderRadius: 16,
              boxShadow: "0 6px 16px rgba(2,6,23,.06)",
              border: "1px solid #e5e7eb",
            }}>
              <h5 style={{ fontWeight: 600, color: "#334155", marginBottom: 12 }}>Select Supervisor</h5>
              <select
                value={selectedSupervisor?._id || ""}
                onChange={(e) => {
                  const selected = supervisors.find(s => s._id === e.target.value);
                  setSelectedSupervisor(selected || null);
                }}
                style={{ padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", width: "100%" }}
              >
                <option value="">Select a supervisor</option>
                {supervisors.map(supervisor => (
                  <option key={supervisor._id} value={supervisor._id}>
                    {supervisor.name} ({supervisor.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View toggles */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-center">
          {(user?.role === "supervisor" || isSuperAdmin) && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "2px" }}>
                Toggle between:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "6px 8px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                }}
              >
                <button
                  onClick={() => {
                    setViewMode("team");
                    setSelectedTeamMember(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 8,
                    backgroundColor: viewMode === "team" ? "#4F46E5" : "#f1f5f9",
                    color: viewMode === "team" ? "white" : "#64748b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Team View
                </button>
                <button
                  onClick={() => setViewMode("individual")}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 8,
                    backgroundColor: viewMode === "individual" ? "#4F46E5" : "#f1f5f9",
                    color: viewMode === "individual" ? "white" : "#64748b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Individual View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team member selector (only visible in individual mode) */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-center">
          {((user?.role === "supervisor" && !isSuperAdmin) || isSuperAdmin) && viewMode === "individual" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                padding: "6px 8px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                width: "100%",
                maxWidth: 600,
              }}
            >
              <label style={{ fontWeight: 600, color: "#334155" }}>Team Member</label>
              <select
                value={selectedTeamMember || ""}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                style={{ padding: 6, borderRadius: 8, border: "1px solid #cbd5e1", flexGrow: 1 }}
              >
                <option value="">Select a team member</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Date range and actions */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-center">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                padding: "6px 8px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                boxShadow: "0 6px 16px rgba(2,6,23,.06)",
              }}
            >
              <label style={{ fontWeight: 600, color: "#334155" }}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: 6, borderRadius: 8, border: "1px solid #cbd5e1" }}
              />
              <label style={{ fontWeight: 600, color: "#334155" }}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: 6, borderRadius: 8, border: "1px solid #cbd5e1" }}
              />
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                backgroundColor: showCalendar ? "#0F172A" : "#64748B",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                cursor: "pointer",
              }}
              title={showCalendar ? "Hide Calendar" : "Show Calendar"}
            >
              {showCalendar ? "Hide Calendar" : "Show Calendar"}
            </button>
            
            {/* Export buttons */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={exportCSV}
                style={{
                  backgroundColor: "#0EA5E9",
                  color: "white",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                  cursor: "pointer",
                }}
                title="Export CSV"
              >
                CSV
              </button>
              <button
                onClick={exportPDF}
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "white",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                  cursor: "pointer",
                }}
                title="Export PDF"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div style={{ display: "flex", marginBottom: 16, borderBottom: "1px solid #E2E8F0", justifyContent: "center" }}>
        <div className="tab-buttons">
          <TabButton
            active={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
            id="tab-time"
          >
            Summary
          </TabButton>
          <TabButton
            active={activeTab === "charts"}
            onClick={() => setActiveTab("charts")}
          >
            Charts
          </TabButton>
          <TabButton 
            active={activeTab === "entries"} 
            onClick={() => setActiveTab("entries")}
            id="tab-projects"
          >
            Time Entries
          </TabButton>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>Loading... {retryCount ? `(retry ${retryCount}/2)` : ""}</div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 12,
            margin: "20px 0",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ color: "#DC2626", marginBottom: 8 }}>Error Loading Data</h3>
          <p style={{ color: "#B91C1C", marginBottom: 20 }}>{error}</p>
          <button
            onClick={() => { setRetryCount(0); fetchReportData(); }}
            style={{
              backgroundColor: "#DC2626",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Filter & Actions - always visible */}
          <Panel title="Filter & Actions">
            <div className="mb-4">
              {/* New FilterBar component */}
              <FilterBar
                filters={filters}
                onChange={setFilter}
                onReset={resetFilters}
                statusOptions={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                projectOptions={Object.keys(projectCount).map(project => ({
                  value: project,
                  label: project
                }))}
                userOptions={teamMembers.map(member => ({
                  value: member._id,
                  label: member.name
                }))}
              />
            </div>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")} color="#4F46E5">
                  All ({reportData.length})
                </FilterButton>
                <FilterButton active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} color="#F59E0B">
                  Pending ({reportData.filter(e => (e.status || "pending").toLowerCase() === "pending").length})
                </FilterButton>
                <FilterButton active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")} color="#10B981">
                  Approved ({reportData.filter(e => (e.status || "pending").toLowerCase() === "approved").length})
                </FilterButton>
                <FilterButton active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")} color="#EF4444">
                  Rejected ({reportData.filter(e => (e.status || "pending").toLowerCase() === "rejected").length})
                </FilterButton>
              </div>
              {user?.role === "employee" && (
                <Link
                  to="/clock"
                  style={{
                    backgroundColor: "#4F46E5",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 10,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: "0 6px 16px rgba(2,6,23,.06)",
                  }}
                >
                  + Add New Entry
                </Link>
              )}
            </div>
          </Panel>

          {/* Calendar View - conditionally rendered */}
          {showCalendar && (
            <Panel title="Calendar View">
              <CalendarView 
                entries={filtered} 
                view={calendarView} 
                onViewChange={setCalendarView}
                currentDate={new Date()}
                onDateChange={(date) => {
                  if (calendarView === 'month') {
                    const isFirstHalfOfMonth = date.getDate() <= 15;
                    
                    if (isFirstHalfOfMonth) {
                      // First half of month (1st-15th)
                      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                      const midMonth = new Date(date.getFullYear(), date.getMonth(), 15);
                      setFromDate(toLocalISO(firstDay));
                      setToDate(toLocalISO(midMonth));
                    } else {
                      // Second half of month (16th-end)
                      const sixteenthDay = new Date(date.getFullYear(), date.getMonth(), 16);
                      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                      setFromDate(toLocalISO(sixteenthDay));
                      setToDate(toLocalISO(lastDay));
                    }
                  } else {
                    // Week view remains unchanged
                    const startOfWeek = new Date(date);
                    startOfWeek.setDate(date.getDate() - date.getDay());
                    const endOfWeek = new Date(date);
                    endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
                    setFromDate(toLocalISO(startOfWeek));
                    setToDate(toLocalISO(endOfWeek));
                  }
                }}
                onDayClick={(dateStr) => {
                  setFromDate(dateStr);
                  setToDate(dateStr);
                }}
              />
            </Panel>
          )}

          {/* Tab content - conditionally rendered based on activeTab */}
          <div style={{ marginTop: 16 }}>
            {/* Summary Tab */}
            {activeTab === "summary" && (
              <>
                <div style={{ marginBottom: 8, color: "#0f172a", fontWeight: 700 }}>Summary</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                    marginBottom: 22,
                  }}
                >
                  {user?.role !== "employee" && (
                    <>
                      <Card 
                        title={isSuperAdmin && selectedSupervisor && !selectedTeamMember ? "Supervisor" : "Employee"} 
                        value={profile.name} 
                      />
                      <Card title="Email" value={profile.email} />
                    </>
                  )}
                  <Card title="Total Time" value={formatHrsMins(totals.totalMinutes)} />
                  <Card title="Avg/week" value={formatHrsMins(totals.avgPerWeekMinutes)} />
                  <Card title="Projects" value={Object.keys(projectCount).length} />
                  <Card
                    title="Top Project"
                    value={
                      Object.entries(projectCount).length
                        ? (() => {
                            const [name, mins] =
                              Object.entries(projectCount).sort((a, b) => b[1] - a[1])[0];
                            return `${name} (${formatHrsMins(mins)})`;
                          })()
                        : "—"
                    }
                  />
                </div>
              </>
            )}

            {/* Charts Tab */}
            {activeTab === "charts" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <Panel title="Hours per Project">
                  {Object.keys(projectCount).length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                      No time entries found. Try adjusting the date range or filters.
                    </div>
                  )}
                  <div style={{ height: 360 }}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                </Panel>
                <Panel title="Project Breakdown">
                  {Object.keys(projectCount).length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                      No time entries found for the selected period. Try adjusting your date range or filters.
                    </div>
                  )}
                  <div style={{ height: 360 }}>
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                </Panel>
              </div>
            )}

            {/* Entries Tab */}
            {activeTab === "entries" && (
              <Panel title={`Time Entries${statusFilter !== "all" ? ` (${statusFilter[0].toUpperCase() + statusFilter.slice(1)})` : ""}`}>
                <div style={{ overflowX: "auto" }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                      <h4 style={{ marginBottom: 8, color: "#374151" }}>No time entries found</h4>
                      <p style={{ marginBottom: 20 }}>
                        {statusFilter === "all"
                          ? "You haven't submitted any time entries yet in this range."
                          : `No ${statusFilter} entries found in this range.`}
                      </p>
                      {user?.role === "employee" && (
                        <Link
                          to="/clock"
                          style={{
                            backgroundColor: "#4F46E5",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: 10,
                            textDecoration: "none",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          Submit Your First Entry
                        </Link>
                      )}
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#e2e8f0" }}>
                          <th style={{ padding: 8, textAlign: "left" }}>Date</th>
                          {user?.role === "supervisor" && (
                            <th style={{ padding: 8, textAlign: "left" }}>Employee</th>
                          )}
                          <th style={{ padding: 8, textAlign: "left" }}>Project</th>
                          <th style={{ padding: 8, textAlign: "left" }}>Duration</th>
                          <th style={{ padding: 8, textAlign: "left" }}>Description</th>
                          <th style={{ padding: 8, textAlign: "left" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((entry, idx) => (
                          <tr key={entry._id || idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                            <td style={{ padding: 8 }}>
                              <strong>{formatDateCell(entry.date)}</strong>
                            </td>
                            {user?.role === "supervisor" && (
                              <td style={{ padding: 8 }}>{entry.userId?.name || "Unknown User"}</td>
                            )}
                            <td style={{ padding: 8 }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  backgroundColor:
                                    entry.project && entry.project !== "No Project" ? "#E0F2FE" : "#F3F4F6",
                                  color:
                                    entry.project && entry.project !== "No Project" ? "#0369A1" : "#6B7280",
                                }}
                              >
                                {entry.project || entry.projectId || "No Project"}
                              </span>
                            </td>
                            <td style={{ padding: 8 }}>
                              <strong>{typeof entry.minutes === "number" ? formatHrsMins(entry.minutes) : "—"}</strong>
                            </td>
                            <td style={{ padding: 8, maxWidth: 240 }}>
                              <div
                                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                title={Array.isArray(entry.task) ? entry.task.join(", ") : (entry.task || entry.description || "")}
                              >
                                {Array.isArray(entry.task) ? entry.task.join(", ") : entry.task || entry.description || "No description"}
                              </div>
                            </td>
                            <td style={{ padding: 8 }}>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  ...(
                                    (entry.status || "pending").toLowerCase() === "approved"
                                      ? { backgroundColor: "#10B981", color: "white" }
                                      : (entry.status || "pending").toLowerCase() === "pending"
                                      ? { backgroundColor: "#F59E0B", color: "white" }
                                      : (entry.status || "pending").toLowerCase() === "rejected"
                                      ? { backgroundColor: "#EF4444", color: "white" }
                                      : { backgroundColor: "#6B7280", color: "white" }
                                  ),
                                }}
                              >
                                {entry.status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}