import { useEffect, useState } from "react";
import {
  CheckSquare,
  AlertCircle,
  Clock,
  Filter,
  SortAsc,
  Sparkles,
} from "lucide-react";
import { Note, TaskStatus, TaskPriority } from "../types/note";
import {
  getTasks,
  getTasksDueToday,
  getOverdueTasks,
  getOpenTasks,
  updateTaskStatus,
  updateTaskPriority,
} from "../storage/localStorage";

export default function TaskDashboardView() {
  const [allTasks, setAllTasks] = useState<Note[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<Note[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Note[]>([]);
  const [openTasks, setOpenTasks] = useState<Note[]>([]);

  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "created">("priority");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    setAllTasks(getTasks());
    setTasksDueToday(getTasksDueToday());
    setOverdueTasks(getOverdueTasks());
    setOpenTasks(getOpenTasks());
  };

  const handleStatusChange = (noteId: string, status: TaskStatus) => {
    updateTaskStatus(noteId, status);
    loadTasks();
  };

  const handlePriorityChange = (noteId: string, priority: TaskPriority) => {
    updateTaskPriority(noteId, priority);
    loadTasks();
  };

  // Filter and sort open tasks
  const filteredTasks = openTasks
    .filter((task) => {
      if (filterStatus !== "all" && (task.status || "open") !== filterStatus) {
        return false;
      }
      if (filterPriority !== "all" && (task.priority || "medium") !== filterPriority) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || "medium"] - priorityOrder[b.priority || "medium"];
      } else if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getPriorityColor = (priority?: TaskPriority) => {
    const p = priority || "medium";
    const colors = {
      high: "text-red-500 bg-red-500/10 border-red-500/30",
      medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
      low: "text-green-500 bg-green-500/10 border-green-500/30",
    };
    return colors[p];
  };

  const getPriorityLabel = (priority?: TaskPriority) => {
    const labels = {
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    };
    return labels[priority || "medium"];
  };

  const getStatusLabel = (status?: TaskStatus) => {
    const labels = {
      open: "Offen",
      in_progress: "In Arbeit",
      done: "Erledigt",
    };
    return labels[status || "open"];
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === -1) return "Gestern";
    if (diffDays < 0) return `Vor ${Math.abs(diffDays)} Tagen`;
    if (diffDays <= 7) return `In ${diffDays} Tagen`;

    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-dark-bg overflow-y-auto">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border-dark px-8 py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cat-task/10 rounded-xl">
                  <CheckSquare size={28} className="text-cat-task" />
                </div>
                <h2 className="text-2xl font-display font-bold text-text-primary">
                  Task Dashboard
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                {openTasks.length} offene Aufgaben · {overdueTasks.length} überfällig · {tasksDueToday.length} heute fällig
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Today Important Section */}
          {(tasksDueToday.length > 0 || overdueTasks.length > 0) && (
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={22} className="text-cat-task" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  Heute wichtig
                </h3>
              </div>

              <div className="space-y-3">
                {/* Overdue Tasks */}
                {overdueTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    isOverdue={true}
                  />
                ))}

                {/* Due Today Tasks */}
                {tasksDueToday.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Open Tasks Section */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={22} className="text-cat-task" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  Alle offenen Aufgaben
                </h3>
              </div>

              {/* Filters and Sort */}
              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
                  className="px-3 py-1.5 bg-dark-elevated border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Alle Status</option>
                  <option value="open">Offen</option>
                  <option value="in_progress">In Arbeit</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
                  className="px-3 py-1.5 bg-dark-elevated border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Alle Prioritäten</option>
                  <option value="high">Hoch</option>
                  <option value="medium">Mittel</option>
                  <option value="low">Niedrig</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "priority" | "dueDate" | "created")}
                  className="px-3 py-1.5 bg-dark-elevated border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="priority">Nach Priorität</option>
                  <option value="dueDate">Nach Fälligkeit</option>
                  <option value="created">Nach Erstellung</option>
                </select>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles size={48} className="text-accent mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary">Keine offenen Aufgaben gefunden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Note;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  isOverdue?: boolean;
}

function TaskCard({ task, onStatusChange, onPriorityChange, isOverdue }: TaskCardProps) {
  const getPriorityColor = (priority?: TaskPriority) => {
    const p = priority || "medium";
    const colors = {
      high: "text-red-500 bg-red-500/10 border-red-500/30",
      medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
      low: "text-green-500 bg-green-500/10 border-green-500/30",
    };
    return colors[p];
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === -1) return "Gestern";
    if (diffDays < 0) return `Vor ${Math.abs(diffDays)} Tagen`;
    if (diffDays <= 7) return `In ${diffDays} Tagen`;

    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className={`p-4 bg-dark-elevated rounded-xl border ${isOverdue ? "border-red-500/50 bg-red-500/5" : "border-border-dark"}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => {
            const newStatus = (task.status || "open") === "done" ? "open" : "done";
            onStatusChange(task.id, newStatus);
          }}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            (task.status || "open") === "done"
              ? "bg-cat-task border-cat-task"
              : "border-text-muted hover:border-cat-task"
          }`}
        >
          {(task.status || "open") === "done" && (
            <CheckSquare size={16} className="text-dark-bg" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-text-primary mb-2 ${(task.status || "open") === "done" ? "line-through opacity-50" : ""}`}>
            {task.content}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Badge */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-muted">Priorität:</span>
              <select
                value={task.priority || "medium"}
                onChange={(e) => onPriorityChange(task.id, e.target.value as TaskPriority)}
                className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)} focus:outline-none focus:ring-2 focus:ring-primary`}
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
              </select>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-muted">Status:</span>
              <select
                value={task.status || "open"}
                onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="open">Offen</option>
                <option value="in_progress">In Arbeit</option>
                <option value="done">Erledigt</option>
              </select>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isOverdue ? "bg-red-500/20 text-red-500" : "bg-dark-surface text-text-secondary"}`}>
                <Clock size={12} />
                <span className="text-xs font-medium">{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
