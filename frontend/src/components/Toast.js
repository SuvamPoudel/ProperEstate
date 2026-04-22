import React, { useEffect } from "react";

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={"toast-notif toast-" + (type || "info")}>
      <span>{msg}</span>
      <button onClick={onClose} className="toast-close">✕</button>
    </div>
  );
};

export default Toast;
