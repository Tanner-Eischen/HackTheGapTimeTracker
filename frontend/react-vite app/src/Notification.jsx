import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Notification({ notifications, setNotifications, addNotification }) {
  const [showList, setShowList] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const bellRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = () => {
    const newShow = !showList;
    setShowList(newShow);

    if (!showList) {
      // mark all as read
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);

      const token = localStorage.getItem("token");
      axios.put("/api/notifications/markAllRead", {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (showList && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      let style = { width: `${dropdownWidth}px`, maxHeight: "300px", overflowY: "auto" };

      if (rect.right + dropdownWidth > window.innerWidth) {
        // flip to left if overflowing
        style.right = 0;
        style.left = "auto";
      } else {
        style.left = 0;
        style.right = "auto";
      }

      setDropdownStyle(style);
    }
  }, [showList, notifications]);

  return (
    <div className="position-relative d-inline-block" ref={bellRef}>
      <button
        className="btn btn-light rounded-circle shadow-sm position-relative"
        onClick={toggleDropdown}
        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <i className="bi bi-bell-fill" style={{ fontSize: '16px' }}></i>
        {unreadCount > 0 && (
          <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
            {unreadCount}
          </span>
        )}
      </button>

      {showList && (
        <div
          className="dropdown-menu show shadow mt-2 rounded border"
          style={{...dropdownStyle, padding: '0'}}
        >
          <div className="dropdown-header bg-light d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
            <span>Notifications</span>
            <span className="badge bg-primary rounded-pill">{notifications.length}</span>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-bell-slash mb-2" style={{ fontSize: '24px', display: 'block' }}></i>
              <span>No new notifications</span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="dropdown-item d-flex flex-column py-2 px-3"
                style={{ whiteSpace: "normal", borderBottom: '1px solid rgba(0,0,0,0.05)' }}
              >
                <strong>{notif.name}</strong>
                <small className="text-muted">{notif.description}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Notification;
