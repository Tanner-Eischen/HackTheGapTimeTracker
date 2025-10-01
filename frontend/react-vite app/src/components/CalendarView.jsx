/**
 * CalendarView component
 * Displays time entries in a calendar format with status colors
 * Supports week and month views
 */
import React, { useState, useMemo } from 'react';
import './CalendarView.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Status color mapping
const STATUS_COLORS = {
  pending: '#F59E0B',   // Amber
  approved: '#10B981',  // Green
  rejected: '#EF4444',  // Red
};

/**
 * Get days in month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days in month
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Day of week (0-6)
 */
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

/**
 * Get week number
 * @param {Date} date - Date
 * @returns {number} Week number (1-53)
 */
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Format minutes as hours and minutes
 * @param {number} minutes - Minutes
 * @returns {string} Formatted time
 */
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
};

/**
 * Group entries by date
 * @param {Array} entries - Time entries
 * @returns {Object} Entries grouped by date
 */
const groupEntriesByDate = (entries) => {
  return entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});
};

/**
 * Calculate total minutes for a day
 * @param {Array} entries - Time entries for a day
 * @returns {Object} Total minutes by status
 */
const calculateDayTotals = (entries) => {
  return entries.reduce((acc, entry) => {
    const status = entry.status || 'pending';
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += entry.minutes || 0;
    return acc;
  }, {});
};

/**
 * CalendarView component
 * @param {Object} props - Component props
 * @param {Array} props.entries - Time entries
 * @param {string} props.view - Calendar view (week or month)
 * @param {function} props.onViewChange - View change handler
 * @param {Date} props.currentDate - Current date
 * @param {function} props.onDateChange - Date change handler
 * @param {function} props.onDayClick - Day click handler
 * @returns {JSX.Element} CalendarView component
 */
function CalendarView({ 
  entries = [], 
  view = 'month', 
  onViewChange,
  currentDate = new Date(),
  onDateChange,
  onDayClick
}) {
  // Group entries by date
  const entriesByDate = useMemo(() => groupEntriesByDate(entries), [entries]);

  // Calculate current month and year
  const [displayDate, setDisplayDate] = useState(currentDate);
  const currentMonth = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();
  
  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(displayDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setDisplayDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(displayDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setDisplayDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setDisplayDate(today);
    if (onDateChange) onDateChange(today);
  };

  // Toggle view between week and month
  const toggleView = () => {
    const newView = view === 'month' ? 'week' : 'month';
    if (onViewChange) onViewChange(newView);
  };

  // Handle day click
  const handleDayClick = (date) => {
    if (onDayClick) onDayClick(date);
  };

  // Render month view
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const dayEntries = entriesByDate[dateString] || [];
      const dayTotals = calculateDayTotals(dayEntries);
      const hasEntries = dayEntries.length > 0;
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${hasEntries ? 'has-entries' : ''}`}
          onClick={() => handleDayClick(dateString)}
        >
          <div className="day-header">
            <span className="day-number">{day}</span>
          </div>
          {hasEntries && (
            <div className="day-entries">
              {Object.entries(dayTotals).map(([status, minutes]) => (
                <div 
                  key={status} 
                  className="entry-status"
                  style={{ backgroundColor: STATUS_COLORS[status] || '#CBD5E1' }}
                >
                  {formatTime(minutes)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-grid month-view">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="calendar-header">{day}</div>
        ))}
        {days}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const currentDay = displayDate.getDay();
    const weekStart = new Date(displayDate);
    weekStart.setDate(displayDate.getDate() - currentDay);
    
    const days = [];
    const weekNumber = getWeekNumber(displayDate);

    // Add days of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayEntries = entriesByDate[dateString] || [];
      const dayTotals = calculateDayTotals(dayEntries);
      const hasEntries = dayEntries.length > 0;
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div key={i} className="week-day">
          <div className={`day-header ${isToday ? 'today' : ''}`}>
            <div className="day-name">{DAYS_OF_WEEK[i]}</div>
            <div className="day-number">{date.getDate()}</div>
          </div>
          <div className="day-content" onClick={() => handleDayClick(dateString)}>
            {hasEntries ? (
              <div className="day-entries">
                {Object.entries(dayTotals).map(([status, minutes]) => (
                  <div 
                    key={status} 
                    className="entry-status"
                    style={{ backgroundColor: STATUS_COLORS[status] || '#CBD5E1' }}
                  >
                    {formatTime(minutes)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-entries">No entries</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-grid week-view">
        <div className="week-header">Week {weekNumber}</div>
        <div className="week-days">{days}</div>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <div className="calendar-controls">
        <div className="calendar-title">
          {view === 'month' ? 
            `${MONTHS[currentMonth]} ${currentYear}` : 
            `Week of ${displayDate.getDate()} ${MONTHS[currentMonth]} ${currentYear}`}
        </div>
        <div className="calendar-actions">
          <button onClick={goToPrevious} className="calendar-nav-btn">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button onClick={goToToday} className="calendar-today-btn">
            Today
          </button>
          <button onClick={goToNext} className="calendar-nav-btn">
            <i className="bi bi-chevron-right"></i>
          </button>
          <button onClick={toggleView} className="calendar-view-btn">
            {view === 'month' ? 'Week View' : 'Month View'}
          </button>
        </div>
      </div>
      {view === 'month' ? renderMonthView() : renderWeekView()}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: STATUS_COLORS.pending }}></span>
          <span className="legend-label">Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: STATUS_COLORS.approved }}></span>
          <span className="legend-label">Approved</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: STATUS_COLORS.rejected }}></span>
          <span className="legend-label">Rejected</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;