import React, { useState, useRef, useEffect, ReactElement } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: ReactElement;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/**
 * Tooltip component that displays a tooltip when hovering over children
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = "",
  position = "top",
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // Calculate tooltip position based on the target element
  const calculatePosition = () => {
    if (!targetRef.current) return;
    // Position calculation is handled by CSS classes
  };

  // Show tooltip after delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    calculatePosition();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip immediately
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get positioning classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
    }
  };

  // Get the arrow classes based on position prop
  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "bottom-[-5px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
      case "bottom":
        return "top-[-5px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent";
      case "left":
        return "right-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent";
      case "right":
        return "left-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent";
      default:
        return "bottom-[-5px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
    }
  };

  return (
    <div className="relative inline-flex" ref={targetRef}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium rounded shadow-sm bg-opacity-90 ${getPositionClasses()} ${className}`}
          onMouseEnter={handleMouseLeave} // Hide tooltip when mouse enters it
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 border-gray-900 ${getArrowClasses()}`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
