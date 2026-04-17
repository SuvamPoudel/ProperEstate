import React, { useState, useEffect } from "react";

export default function NotificationsPanel({ user }) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const res = await fetch(`http://localhost:5000/property/notifications/${user._id}`);
    const data = await res.json();
    if (data.success) setNotifications(data.notifications);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleApprove = async (id, approve) => {
    await fetch("http://localhost:5000/property/approve-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, approve })
    });
    fetchNotifications();
  };

  return (
    <div className="notifications-panel">
      <h3>Notifications</h3>
      {notifications.length === 0 && <p>No notifications yet.</p>}
      {notifications.map(n => (
        <div key={n._id} className={`notif-item ${n.read ? "read" : "unread"}`}>
          <p>{n.message}</p>
          {n.type === "request" && (
            <div className="notif-actions">
              <button className="btn-primary" onClick={() => handleApprove(n._id, true)}>Approve</button>
              <button className="btn-danger" onClick={() => handleApprove(n._id, false)}>Reject</button>
            </div>
          )}
          {n.type === "payment" && <span>💰 Dummy Payment Required</span>}
        </div>
      ))}
    </div>
  );
}