import React from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
  alt?: string;
  size?: AvatarSize;
  rounded?: boolean;
  className?: string;
  initials?: string;
  onClick?: () => void;
  src?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  alt = "User",
  size = "md",
  rounded = true,
  className = "",
  initials,
  onClick,
  src,
}) => {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
    "2xl": "h-20 w-20 text-2xl",
  };

  const backgroundClasses = {
    xs: "bg-blue-100 text-blue-800",
    sm: "bg-green-100 text-green-800",
    md: "bg-purple-100 text-purple-800",
    lg: "bg-pink-100 text-pink-800",
    xl: "bg-indigo-100 text-indigo-800",
    "2xl": "bg-cyan-100 text-cyan-800",
  };

  const getInitials = () => {
    if (initials) return initials;
    return alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const avatarClasses = [
    "inline-flex items-center justify-center font-medium select-none",
    sizeClasses[size],
    backgroundClasses[size],
    rounded ? "rounded-full" : "rounded-md",
    className,
  ].join(" ");

  if (src) {
    return (
      <img src={src} alt={alt} className={avatarClasses} onClick={onClick} />
    );
  }

  return (
    <div className={avatarClasses} onClick={onClick}>
      {getInitials()}
    </div>
  );
};

export default Avatar;
