import type { Email, Priority, EmailAction } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GmailTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: GmailHeader[];
    body?: { data?: string; size: number };
    parts?: GmailMessagePart[];
  };
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
}

// ─── Google Identity Services loader ──────────────────────────────────────────

let gisLoaded = false;

export function loadGIS(): Promise<void> {
  if (gisLoaded || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gis-script");
    if (existing) { gisLoaded = true; resolve(); return; }
    const script = document.createElement("script");
    script.id = "gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => { gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

// ─── OAuth token request (implicit / token grant) ─────────────────────────────

export function requestGmailToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-expect-error google loaded via CDN script
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" "),
      callback: (resp: GmailTokenResponse) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

export function revokeGmailToken(token: string): void {
  // @ts-expect-error google loaded via CDN script
  window.google?.accounts.oauth2.revoke(token, () => {});
}

// ─── Gmail REST API helpers ───────────────────────────────────────────────────

const BASE = "https://gmail.googleapis.com/gmail/v1";

async function gmailFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Gmail API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function getHeader(headers: GmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return atob(base64);
  }
}

function extractBody(payload: GmailMessage["payload"]): string {
  // Try plain text parts first, then html, then direct body
  const findPart = (parts: GmailMessagePart[] | undefined, mime: string): string | null => {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === mime && part.body.data) return decodeBase64Url(part.body.data);
      if (part.parts) { const found = findPart(part.parts, mime); if (found) return found; }
    }
    return null;
  };

  const plain = findPart(payload.parts, "text/plain");
  if (plain) return plain;

  const html = findPart(payload.parts, "text/html");
  if (html) return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();

  if (payload.body?.data) return decodeBase64Url(payload.body.data);

  return "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s{2,}/g, " ").trim();
}

// ─── Summarisation & action detection ────────────────────────────────────────

function summarise(body: string, snippet: string): string {
  const clean = stripHtml(body).replace(/\r?\n+/g, " ").trim();
  if (!clean) return snippet;

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !/^(hi|hello|dear|thanks|thank you|regards|best|cheers)/i.test(s));

  return sentences.slice(0, 2).join(" ") || snippet;
}

function detectAction(subject: string, body: string): EmailAction {
  const text = `${subject} ${body}`.toLowerCase();

  const delegatePatterns = [
    /please\s+(handle|coordinate|manage|take care|action|follow up)/,
    /can you\s+(take|handle|manage|coordinate)/,
    /could you\s+(please\s+)?(take|handle|manage)/,
    /for\s+your\s+action/,
    /please\s+action/,
  ];
  if (delegatePatterns.some((p) => p.test(text))) return "Delegate";

  const replyPatterns = [
    /please\s+(reply|respond|confirm|advise|let me know|provide|send)/,
    /let me know\s+(if|when|your|whether)/,
    /your\s+(thoughts|input|feedback|approval|sign.?off)/,
    /action\s+required/,
    /response\s+(needed|required)/,
    /asap|urgent|deadline|by\s+(monday|tuesday|wednesday|thursday|friday|eod|cob)/,
    /are you available/,
    /does\s+this\s+work/,
    /can\s+we\s+(schedule|book|meet|connect)/,
  ];
  if (replyPatterns.some((p) => p.test(text))) return "Reply";

  return "No Action";
}

function detectPriority(subject: string, from: string, action: EmailAction): Priority {
  const text = `${subject} ${from}`.toLowerCase();
  const highSignals = [
    /urgent|asap|critical|important|action required|deadline|board|ceo|cfo|cto/,
    /sign.?off|approval|decision|risk/,
  ];
  if (action === "Reply" && highSignals.some((p) => p.test(text))) return "high";
  if (action === "No Action") return "low";
  return "medium";
}

// ─── Transform Gmail message → Email ─────────────────────────────────────────

export function transformGmailMessage(msg: GmailMessage, vipAddresses: Set<string>): Email {
  const headers = msg.payload.headers;
  const fromRaw = getHeader(headers, "from");
  const subject = getHeader(headers, "subject") || "(no subject)";
  const date = getHeader(headers, "date");

  // Parse "Display Name <email@example.com>" or plain "email@example.com"
  const fromMatch = fromRaw.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/);
  const fromName = fromMatch?.[1]?.trim() || fromRaw;
  const fromEmail = fromMatch?.[2]?.trim() || fromRaw;

  const body = extractBody(msg.payload);
  const summary = summarise(body, msg.snippet);
  const action = detectAction(subject, body);
  const isVIP = vipAddresses.has(fromEmail.toLowerCase());
  const priority = detectPriority(subject, fromRaw, action);

  return {
    id: msg.id,
    from: fromName,
    fromRole: undefined,
    subject,
    summary,
    body: body || msg.snippet,
    action,
    priority,
    isVIP,
    timestamp: date ? new Date(date).toISOString() : new Date(parseInt(msg.internalDate)).toISOString(),
    read: false,
    tags: [],
  };
}

// ─── Fetch inbox ──────────────────────────────────────────────────────────────

export async function fetchInbox(token: string, maxResults = 30): Promise<GmailMessage[]> {
  const list = await gmailFetch<GmailListResponse>(
    `/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
    token
  );

  if (!list.messages?.length) return [];

  const messages = await Promise.all(
    list.messages.map((m) =>
      gmailFetch<GmailMessage>(`/users/me/messages/${m.id}?format=full`, token)
    )
  );

  return messages;
}

export async function fetchUserEmail(token: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as { email?: string };
  return data.email ?? "";
}
