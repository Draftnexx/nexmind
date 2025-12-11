import { CheckSquare, Calendar, Lightbulb, FileText, User } from "lucide-react";
import { NoteCategory } from "../types/note";

interface CategoryBadgeProps {
  category: NoteCategory;
  size?: "sm" | "md";
}

const categoryConfig = {
  task: {
    label: "Aufgabe",
    icon: CheckSquare,
    className: "badge-task",
  },
  event: {
    label: "Termin",
    icon: Calendar,
    className: "badge-event",
  },
  idea: {
    label: "Idee",
    icon: Lightbulb,
    className: "badge-idea",
  },
  info: {
    label: "Info",
    icon: FileText,
    className: "badge-info",
  },
  person: {
    label: "Person",
    icon: User,
    className: "badge-person",
  },
};

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl font-medium ${config.className} ${sizeClasses}`}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
}
