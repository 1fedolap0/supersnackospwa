"use client";

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { InboxModule } from "./modules/InboxModule";
import { TripsModule } from "./modules/TripsModule";
import { TasksModule } from "./modules/TasksModule";
import { BriefsModule } from "./modules/BriefsModule";
import { ExpertsModule } from "./modules/ExpertsModule";
import { PWAInstall } from "./components/PWAInstall";
import { useEmails, useTasks } from "./store/useStore";
import { Modal } from "./components/Modal";
import type { Task, Priority, TaskStatus } from "./lib/types";

function QuickAddModal({ onClose, onAddTask }: { onClose: () => void; onAddTask: (t: Task) => void }) {
  const [title, setTitle] = useState("");

  const add = () => {
    if (!title.trim()) return;
    onAddTask({
      id: Date.now().toString(),
      title,
      description: "",
      status: "todo" as TaskStatus,
      priority: "medium" as Priority,
      assignee: "Chief of Staff",
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Task Title</label>
        <input
          autoFocus
          className="w-full text-sm rounded-lg px-4 py-3 outline-none"
          style={{ background: "var(--navy-600)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={add}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
          style={{ background: "var(--orange)", color: "white" }}
        >
          Add to To Do
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

export default function App() {
  const [activeModule, setActiveModule] = useState("inbox");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [emails] = useEmails();
  const [, setTasks] = useTasks();

  const unreadCount = emails.filter((e) => !e.read).length;

  const MODULES: Record<string, React.ReactNode> = {
    inbox: <InboxModule />,
    trips: <TripsModule />,
    tasks: <TasksModule />,
    briefs: <BriefsModule />,
    experts: <ExpertsModule />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--navy)", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active={activeModule} onNavigate={setActiveModule} unreadCount={unreadCount} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <Topbar activeModule={activeModule} onQuickAdd={() => setShowQuickAdd(true)} />
          <main style={{ flex: 1, overflow: "hidden" }}>
            {MODULES[activeModule]}
          </main>
        </div>
      </div>

      <PWAInstall />

      {showQuickAdd && (
        <Modal title="Quick Add Task" onClose={() => setShowQuickAdd(false)}>
          <QuickAddModal
            onClose={() => setShowQuickAdd(false)}
            onAddTask={(task) => {
              setTasks((prev) => [task, ...prev]);
              setShowQuickAdd(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
