import type { Email, Task, Trip, Priority, TaskStatus } from "./types";

// ─── Urgency ──────────────────────────────────────────────────────────────────

export type UrgencyLevel = "none" | "due-today" | "overdue" | "critical";

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  daysOverdue: number;
  color: string;
}

export function getTaskUrgency(task: Task): UrgencyInfo {
  if (task.status === "done" || !task.dueDate) return { level: "none", label: "", daysOverdue: 0, color: "" };

  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const daysOverdue = Math.floor(diffMs / 86400000);

  if (daysOverdue >= 3) return { level: "critical", label: "CRITICAL", daysOverdue, color: "#dc2626" };
  if (daysOverdue >= 1) return { level: "overdue", label: "OVERDUE", daysOverdue, color: "#ef4444" };
  if (daysOverdue >= 0) return { level: "overdue", label: "DUE TODAY", daysOverdue: 0, color: "#f97316" };

  // Due within 24h but not yet overdue
  const hoursUntilDue = Math.abs(diffMs) / 3600000;
  if (hoursUntilDue <= 24) return { level: "due-today", label: "DUE SOON", daysOverdue: 0, color: "#eab308" };

  return { level: "none", label: "", daysOverdue: 0, color: "" };
}

// ─── Pre-generated reply drafts ───────────────────────────────────────────────

export interface ReplyDraft {
  emailId: string;
  draft: string;
  generatedAt: string;
}

function buildDraft(email: Email): string {
  const greeting = `Hi ${email.from.split(" ")[0]},`;
  const closing = "\n\nBest regards,\n[Chief of Staff]";

  const subject = email.subject.toLowerCase();
  const summary = email.summary.toLowerCase();

  if (email.action === "Delegate") {
    return `${greeting}\n\nThank you for bringing this to my attention. I'm routing this to the appropriate owner and will ensure you receive a response by end of day.\n\nI'll keep you informed of progress.${closing}`;
  }

  if (subject.includes("board") || subject.includes("deck")) {
    return `${greeting}\n\nThank you — noted on the board deck. I'm coordinating the outstanding items and will ensure everything is ready for sign-off ahead of the deadline.\n\nI'll confirm once complete.${closing}`;
  }
  if (subject.includes("budget") || subject.includes("finance") || summary.includes("budget")) {
    return `${greeting}\n\nThank you for the update. I'll schedule the required meeting and circulate a proposed agenda in advance.\n\nPlease confirm your availability and I'll send a calendar invite shortly.${closing}`;
  }
  if (subject.includes("calendar") || subject.includes("schedule") || subject.includes("meeting")) {
    return `${greeting}\n\nUnderstood, thank you. I'll prepare the necessary briefing materials and have them with you ahead of each session.\n\nI'll confirm once ready.${closing}`;
  }
  if (subject.includes("roadmap") || subject.includes("product")) {
    return `${greeting}\n\nThank you — I'll coordinate time on the CEO's calendar for the roadmap discussion and send through a proposed slot shortly.\n\nPlease let me know if there's any pre-read you'd like shared in advance.${closing}`;
  }

  return `${greeting}\n\nThank you for your message. I've reviewed the details and will action accordingly.\n\nI'll follow up with next steps shortly.${closing}`;
}

export function preGenerateReplies(emails: Email[]): ReplyDraft[] {
  return emails
    .filter((e) => e.action === "Reply" || e.action === "Delegate")
    .map((e) => ({
      emailId: e.id,
      draft: buildDraft(e),
      generatedAt: new Date().toISOString(),
    }));
}

// ─── Trip → auto-tasks ────────────────────────────────────────────────────────

export function generateTripTasks(trip: Trip): Task[] {
  const depart = new Date(trip.departureTime);
  const dayBefore = new Date(depart);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const twoDaysBefore = new Date(depart);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  const threeDaysBefore = new Date(depart);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const now = new Date().toISOString();

  const tasks: Omit<Task, "id">[] = [
    {
      title: `Prepare briefing pack – ${trip.title}`,
      description: `Prepare all CEO briefing materials for ${trip.title}. Include agenda, key contacts, objectives, and talking points for each meeting.`,
      status: "todo" as TaskStatus,
      priority: "high" as Priority,
      assignee: "Chief of Staff",
      dueDate: fmt(threeDaysBefore),
      createdAt: now,
    },
    {
      title: `Confirm ground transport – ${trip.title}`,
      description: `Confirm car service or ground transport from ${trip.toAirport} to hotel/venue. Share pickup details with CEO.`,
      status: "todo" as TaskStatus,
      priority: "medium" as Priority,
      assignee: "Chief of Staff",
      dueDate: fmt(twoDaysBefore),
      createdAt: now,
    },
    {
      title: `Online check-in – ${trip.airline} ${trip.flightNumber}`,
      description: `Complete online check-in for ${trip.airline} flight ${trip.flightNumber}. Select preferred seat. Forward boarding pass to CEO.`,
      status: "todo" as TaskStatus,
      priority: "medium" as Priority,
      assignee: "Chief of Staff",
      dueDate: fmt(dayBefore),
      createdAt: now,
    },
    {
      title: `Share trip brief with CEO – ${trip.title}`,
      description: `Send the finalised trip brief to CEO covering: itinerary, key meetings, ground logistics, hotel details, and 'what you need to know' summary.`,
      status: "todo" as TaskStatus,
      priority: "high" as Priority,
      assignee: "Chief of Staff",
      dueDate: fmt(twoDaysBefore),
      createdAt: now,
    },
  ];

  return tasks.map((t) => ({ ...t, id: `trip-task-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
}

// ─── Proactive intelligence brief ─────────────────────────────────────────────

export interface IntelligenceItem {
  id: string;
  type: "email-action" | "overdue-task" | "trip-prep" | "draft-ready" | "escalation";
  title: string;
  detail: string;
  urgency: "critical" | "high" | "medium" | "low";
  entityId?: string;
  module?: string;
  action?: string;
}

export function buildIntelligenceFeed(
  emails: Email[],
  tasks: Task[],
  trips: Trip[]
): IntelligenceItem[] {
  const items: IntelligenceItem[] = [];
  const now = new Date();

  // Overdue and critical tasks
  tasks.forEach((task) => {
    const urgency = getTaskUrgency(task);
    if (urgency.level === "critical") {
      items.push({
        id: `task-critical-${task.id}`,
        type: "escalation",
        title: `${task.title}`,
        detail: `${urgency.daysOverdue} day${urgency.daysOverdue !== 1 ? "s" : ""} overdue${task.assignee ? ` · ${task.assignee}` : ""}`,
        urgency: "critical",
        entityId: task.id,
        module: "tasks",
        action: "View task",
      });
    } else if (urgency.level === "overdue") {
      items.push({
        id: `task-overdue-${task.id}`,
        type: "overdue-task",
        title: task.title,
        detail: urgency.daysOverdue > 0
          ? `${urgency.daysOverdue} day${urgency.daysOverdue !== 1 ? "s" : ""} overdue · ${task.assignee || "Unassigned"}`
          : `Due today · ${task.assignee || "Unassigned"}`,
        urgency: "high",
        entityId: task.id,
        module: "tasks",
        action: "View task",
      });
    } else if (urgency.level === "due-today") {
      items.push({
        id: `task-due-${task.id}`,
        type: "overdue-task",
        title: task.title,
        detail: `Due within 24 hours · ${task.assignee || "Unassigned"}`,
        urgency: "medium",
        entityId: task.id,
        module: "tasks",
        action: "View task",
      });
    }
  });

  // Unread high-priority emails requiring action
  emails
    .filter((e) => !e.read && e.action === "Reply" && e.priority === "high")
    .forEach((email) => {
      items.push({
        id: `email-reply-${email.id}`,
        type: "email-action",
        title: `Reply needed: ${email.subject}`,
        detail: `From ${email.from}${email.fromRole ? ` (${email.fromRole})` : ""} · Draft ready`,
        urgency: "high",
        entityId: email.id,
        module: "inbox",
        action: "Open email",
      });
    });

  // Unread emails to delegate
  emails
    .filter((e) => !e.read && e.action === "Delegate")
    .slice(0, 2)
    .forEach((email) => {
      items.push({
        id: `email-delegate-${email.id}`,
        type: "draft-ready",
        title: `Delegate: ${email.subject}`,
        detail: `From ${email.from} · Delegation draft ready`,
        urgency: "medium",
        entityId: email.id,
        module: "inbox",
        action: "Open email",
      });
    });

  // Upcoming trips needing prep
  trips.forEach((trip) => {
    const depart = new Date(trip.departureTime);
    const daysUntil = Math.ceil((depart.getTime() - now.getTime()) / 86400000);
    if (daysUntil > 0 && daysUntil <= 5) {
      items.push({
        id: `trip-prep-${trip.id}`,
        type: "trip-prep",
        title: `Trip in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}: ${trip.title}`,
        detail: `${trip.from} → ${trip.to} · ${trip.airline} ${trip.flightNumber}`,
        urgency: daysUntil <= 2 ? "high" : "medium",
        entityId: trip.id,
        module: "trips",
        action: "View trip",
      });
    }
  });

  // Sort: critical → high → medium → low
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return items.sort((a, b) => order[a.urgency] - order[b.urgency]);
}
