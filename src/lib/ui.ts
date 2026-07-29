import { LectureStatus, Priority } from "@/lib/types";

/** Sharp-cornered panel */
export const panel = "panel p-5";

/** Uppercase metadata label */
export const microLabel = "micro-label";

/** Standard text input */
export const input = "input-field w-full px-3 py-2 text-sm outline-none";

/** Primary inverted button */
export const btnPrimary = "btn btn-primary flex items-center gap-1.5";

/** Secondary bordered button */
export const btnSecondary = "btn btn-secondary flex items-center gap-1.5";

/** Ghost / cancel button */
export const btnGhost = "btn btn-ghost flex items-center gap-1.5";

/** Destructive solid button */
export const btnDanger = "btn btn-danger flex items-center gap-1.5";

/** Icon-only ghost button */
export const btnIcon = "btn-icon";

/** Icon-only danger ghost */
export const btnIconDanger = "btn-icon btn-danger-ghost";

export const filterActive = "chip chip-selected";
export const filterInactive = "chip";

export function priorityChip(priority: Priority, selected: boolean): string {
  if (!selected) return filterInactive;
  if (priority === "high") return "chip chip-alert";
  if (priority === "low") return "chip chip-quiet";
  return filterActive;
}

export function statusChip(status: LectureStatus): string {
  if (status === "in_progress") return "chip chip-active";
  if (status === "completed") return "chip chip-active";
  return "chip chip-quiet";
}

export function countdownBadge(days: number | null): { text: string; className: string } | null {
  if (days === null) return null;
  if (days < 0) return { text: "Past", className: "badge badge-quiet" };
  if (days === 0) return { text: "Today", className: "badge badge-alert" };
  if (days <= 3) return { text: `${days}d`, className: "badge badge-alert" };
  if (days <= 7) return { text: `${days}d`, className: "badge badge-quiet" };
  return { text: `${days}d`, className: "badge badge-quiet" };
}

export function priorityTextClass(priority: Priority): string {
  if (priority === "high") return "text-[var(--alert)]";
  if (priority === "low") return "text-[var(--quiet)]";
  return "";
}
