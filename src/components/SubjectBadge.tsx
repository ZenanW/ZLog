"use client";

interface SubjectBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
  onClick?: () => void;
  active?: boolean;
}

export default function SubjectBadge({ name, color, size = "sm", onClick, active }: SubjectBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border font-medium transition-all ${sizeClasses} ${
        active ? "chip-selected" : "chip"
      }`}
    >
      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: color }} />
      {name}
    </button>
  );
}
