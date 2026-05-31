import React from "react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
};

export default function LoadingSpinner({
  size = "md",
  className = "",
  color = "currentColor",
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-3 w-3 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeMap[size]} ${className}`}
      style={{ borderColor: `${color} transparent ${color} ${color}` }}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}
