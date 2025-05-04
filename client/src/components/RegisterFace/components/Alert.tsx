import React from "react";

interface AlertProps {
  type: "error" | "success";
  message: string;
}

/**
 * Alert component for displaying success and error messages
 */
const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const style = {
    color: type === "error" ? "red" : "green",
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor:
      type === "error" ? "rgba(255, 0, 0, 0.05)" : "rgba(0, 128, 0, 0.05)",
    border: `1px solid ${
      type === "error" ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 128, 0, 0.2)"
    }`,
    borderRadius: "4px",
  };

  return (
    <div className={`alert alert-${type}`} style={style}>
      {message}
    </div>
  );
};

export default Alert;
