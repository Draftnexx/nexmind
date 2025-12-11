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
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  event: {
    label: "Termin",
    icon: Calendar,
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  idea: {
    label: "Idee",
    icon: Lightbulb,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  info: {
    label: "Info",
    icon: FileText,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  person: {
    label: "Person",
    icon: User,
    className: "bg-pink-100 text-pink-700 border-pink-200",
  },
};

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${config.className} ${sizeClasses}`}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
}
