import React, { useState, useEffect } from 'react';
import { subscribeToInAppNotifications } from '../utils/notifications';

export default function NotificationToast({ onSelectFlight }) {
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToInAppNotifications((alert) => {
      setActiveAlerts((prev) => [alert, ...prev].slice(0, 3));

      // Auto dismiss after 6.5s
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 6500);
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClick = (alert) => {
    if (alert.flightId && onSelectFlight) {
      onSelectFlight(alert.flightId);
    }
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="wp-toast-container">
      {activeAlerts.map((alert) => {
        const isEmergency = alert.type === 'emergency';
        return (
          <div
            key={alert.id}
            className={`wp-toast-card wp-glass ${isEmergency ? 'emergency' : ''}`}
            onClick={() => handleClick(alert)}
          >
            <div className={`wp-toast-icon ${alert.type || 'info'}`}>
              {isEmergency ? (
                <i className="fa-solid fa-triangle-exclamation"></i>
              ) : alert.type === 'descent' || alert.type === 'approach' ? (
                <i className="fa-solid fa-plane-arrival"></i>
              ) : alert.type === 'touchdown' ? (
                <i className="fa-solid fa-circle-check"></i>
              ) : (
                <i className="fa-solid fa-bell"></i>
              )}
            </div>

            <div className="wp-toast-content">
              <div className="wp-toast-title">{alert.title}</div>
              <div className="wp-toast-body">{alert.body}</div>
              {alert.flightId && (
                <span className="wp-toast-cta">Tap to track flight →</span>
              )}
            </div>

            <button
              className="wp-toast-close"
              onClick={(e) => handleDismiss(e, alert.id)}
              title="Dismiss"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
}
