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
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all ${sizeClasses} ${
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-zinc-300"
      }`}
      style={active ? { borderColor: color + "40", backgroundColor: color + "15" } : undefined}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </button>
  );
}
