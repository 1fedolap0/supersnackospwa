export type Priority = "high" | "medium" | "low";
export type EmailAction = "Reply" | "Delegate" | "No Action";
export type TaskStatus = "todo" | "inprogress" | "waiting" | "done";

export interface Email {
  id: string;
  from: string;
  fromRole?: string;
  subject: string;
  summary: string;
  body: string;
  action: EmailAction;
  priority: Priority;
  isVIP: boolean;
  timestamp: string;
  read: boolean;
  tags: string[];
}

export interface Trip {
  id: string;
  title: string;
  from: string;
  fromAirport: string;
  to: string;
  toAirport: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  brief: string;
  ceoNotes: string;
  reminders: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  linkedEmailId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Brief {
  id: string;
  title: string;
  rawInput: string;
  keyUpdates: string[];
  decisionsRequired: string[];
  risks: string[];
  nextSteps: string[];
  createdAt: string;
}

export interface ExpertMessage {
  role: "user" | "expert";
  content: string;
  timestamp: string;
}

export interface ExpertConversation {
  expertId: string;
  messages: ExpertMessage[];
}
