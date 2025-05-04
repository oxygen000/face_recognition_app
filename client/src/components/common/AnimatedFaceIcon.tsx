import React from "react";

interface AnimatedFaceIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  text?: string;
}

/**
 * Animated face icon component with scanning effect
 * Used as a placeholder before image upload/capture
 */
const AnimatedFaceIcon: React.FC<AnimatedFaceIconProps> = ({
  className = "",
  size = "md",
  color = "#1f2937", // default gray-800
  text = "Ready for scan",
}) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  const sizeClass = sizeClasses[size];
  const accentColor = "#3b82f6"; // blue-500

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg
        className={sizeClass}
        style={{ color }}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Face outline */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
        >
          <animate attributeName="r" values="39;41;39" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Scanning lines */}
        <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <animateTransform attributeName="transform" type="translate" from="-30 0" to="30 0" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <animateTransform attributeName="transform" type="translate" from="0 -20" to="0 20" dur="2s" repeatCount="indefinite" />
        </line>

        {/* Eyes */}
        <g>
          <circle cx="35" cy="40" r="5" fill={color} opacity="0.6">
            <animate attributeName="ry" values="5;1;5" dur="5s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="40" r="5" fill={color} opacity="0.6">
            <animate attributeName="ry" values="5;1;5" dur="5s" begin="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Mouth */}
        <path d="M 30 65 Q 50 75, 70 65" fill="none" stroke={color} strokeWidth="2" opacity="0.6">
          <animate attributeName="d" values="M 30 65 Q 50 75, 70 65; M 30 67 Q 50 73, 70 67; M 30 65 Q 50 75, 70 65" dur="7s" repeatCount="indefinite" />
        </path>

        {/* Scanner frame corners */}
        {[
          "M 15 25 L 15 15 L 25 15",
          "M 85 25 L 85 15 L 75 15",
          "M 15 75 L 15 85 L 25 85",
          "M 85 75 L 85 85 L 75 85",
        ].map((d, i) => (
          <path key={i} d={d} stroke={accentColor} strokeWidth="3" fill="none" />
        ))}

        {/* Circular scan */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeDasharray="10 5"
          opacity="0.4"
        >
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Scan highlight */}
        <rect x="15" y="0" width="70" height="100" fill="url(#scanGradient)" opacity="0.2">
          <animate attributeName="x" values="15;85;15" dur="4s" repeatCount="indefinite" />
        </rect>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Text below icon */}
      <p className="mt-4 text-blue-500 text-sm font-medium animate-pulse">
        {text}
      </p>
    </div>
  );
};

export default AnimatedFaceIcon;
