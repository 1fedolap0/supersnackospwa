"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Link, AlertTriangle, Zap } from "lucide-react";
import type { Task, TaskStatus, Priority } from "../lib/types";
import { useTasks } from "../store/useStore";
import { PriorityBadge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { getTaskUrgency } from "../lib/orchestrator";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "#6b7280" },
  { id: "inprogress", label: "In Progress", color: "#f97316" },
  { id: "waiting", label: "Waiting", color: "#3b82f6" },
  { id: "done", label: "Done", color: "#10b981" },
];

function formatDueDate(due?: string) {
  if (!due) return null;
  return new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface TaskCardProps {
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

function TaskCard({ task, onMove, onDelete, onClick }: TaskCardProps) {
  const urgency = getTaskUrgency(task);
  const isUrgent = urgency.level !== "none";

  return (
    <div
      className="p-3.5 rounded-lg border cursor-pointer transition-all group relative"
      style={{
        background: urgency.level === "critical"
          ? "rgba(220,38,38,0.06)"
          : urgency.level === "overdue"
          ? "rgba(249,115,22,0.05)"
          : "var(--navy-600)",
        borderColor: isUrgent ? `${urgency.color}40` : "var(--border-light)",
        boxShadow: urgency.level === "critical" ? `0 0 0 1px ${urgency.color}30` : "none",
      }}
      onClick={onClick}
    >
      {/* Urgency strip */}
      {isUrgent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
          style={{ background: urgency.color }}
        />
      )}

      <div className="flex items-start gap-2">
        <GripVertical size={12} className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight mb-2" style={{ color: "var(--text-primary)" }}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.linkedEmailId && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <Link size={9} /> email
              </span>
            )}
            {urgency.level !== "none" ? (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${urgency.color}20`, color: urgency.color, border: `1px solid ${urgency.color}40` }}
              >
                {urgency.level === "critical" ? <AlertTriangle size={8} /> : <Zap size={8} />}
                {urgency.label}
                {urgency.daysOverdue > 0 && ` · ${urgency.daysOverdue}d`}
              </span>
            ) : task.dueDate ? (
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {formatDueDate(task.dueDate)}
              </span>
            ) : null}
          </div>
          {task.assignee && (
            <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>→ {task.assignee}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:text-red-400"
          style={{ color: "var(--text-muted)" }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Move buttons */}
      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
          <button
            key={c.id}
            onClick={(e) => { e.stopPropagation(); onMove(task.id, c.id); }}
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors hover:opacity-80"
            style={{ background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}40` }}
          >
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AddTaskFormProps {
  onAdd: (task: Task) => void;
  onClose: () => void;
}

function AddTaskForm({ onAdd, onClose }: AddTaskFormProps) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as Priority, assignee: "", dueDate: "", status: "todo" as TaskStatus });
  const f = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }));

  const inputStyle = {
    background: "var(--navy-600)",
    border: "1px solid var(--border-light)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onAdd({
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Task Title *</label>
        <input style={inputStyle} placeholder="What needs to be done?" value={form.title} onChange={(e) => f("title", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
          placeholder="Additional context..."
          value={form.description}
          onChange={(e) => f("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Priority</label>
          <select style={inputStyle} value={form.priority} onChange={(e) => f("priority", e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Start In</label>
          <select style={inputStyle} value={form.status} onChange={(e) => f("status", e.target.value)}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Assignee</label>
          <input style={inputStyle} placeholder="Chief of Staff" value={form.assignee} onChange={(e) => f("assignee", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Due Date</label>
          <input type="date" style={inputStyle} value={form.dueDate} onChange={(e) => f("dueDate", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAdd}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--orange)", color: "white" }}
        >
          Add Task
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TasksModule() {
  const [tasks, setTasks] = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const moveTask = (id: string, status: TaskStatus) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
  };

  const addTask = (task: Task) => {
    setTasks((p) => [task, ...p]);
  };

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = activeTasks.filter((t) => getTaskUrgency(t).level === "critical");
  const overdueTasks = activeTasks.filter((t) => getTaskUrgency(t).level === "overdue");

  return (
    <div className="flex flex-col h-full">
      {/* Urgency bar */}
      {(criticalTasks.length > 0 || overdueTasks.length > 0) && (
        <div
          className="flex items-center gap-4 px-6 py-2.5 border-b shrink-0"
          style={{
            background: criticalTasks.length > 0 ? "rgba(220,38,38,0.07)" : "rgba(249,115,22,0.05)",
            borderColor: criticalTasks.length > 0 ? "rgba(220,38,38,0.25)" : "rgba(249,115,22,0.2)",
          }}
        >
          {criticalTasks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} style={{ color: "#dc2626" }} className="animate-pulse" />
              <span className="text-xs font-bold" style={{ color: "#dc2626" }}>
                {criticalTasks.length} critical — escalate now
              </span>
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap size={12} style={{ color: "#f97316" }} />
              <span className="text-xs font-semibold" style={{ color: "#f97316" }}>
                {overdueTasks.length} overdue
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Kanban Board</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tasks.length} tasks</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--orange)", color: "white" }}
        >
          <Plus size={12} />
          Add Task
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-5 h-full min-w-max">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col w-72 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      {col.label}
                    </h3>
                  </div>
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div
                  className="flex-1 rounded-xl p-3 space-y-2.5 overflow-y-auto"
                  style={{ background: "var(--navy-800)", border: "1px solid var(--border)" }}
                >
                  {colTasks.length === 0 && (
                    <div
                      className="h-20 flex items-center justify-center rounded-lg border-2 border-dashed text-xs"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      No tasks
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <Modal title="New Task" onClose={() => setShowAdd(false)}>
          <AddTaskForm onAdd={addTask} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {selectedTask && (
        <Modal title="Task Details" onClose={() => setSelectedTask(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{selectedTask.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selectedTask.description || "No description"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Priority", <PriorityBadge key="p" priority={selectedTask.priority} />],
                ["Status", COLUMNS.find((c) => c.id === selectedTask.status)?.label],
                ["Assignee", selectedTask.assignee || "Unassigned"],
                ["Due Date", selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("en-GB") : "No due date"],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap pt-2">
              {COLUMNS.filter((c) => c.id !== selectedTask.status).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { moveTask(selectedTask.id, c.id); setSelectedTask(null); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}40` }}
                >
                  Move to {c.label}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
