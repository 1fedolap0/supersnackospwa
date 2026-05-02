import type { Email, Brief, Trip } from "./types";

export function generateEmailReply(email: Email): string {
  const replies: Record<string, string> = {
    "1": `Hi James,\n\nThanks for the heads up. I've reviewed the deck and will connect with Amara today to get the updated financials for slides 12–18.\n\nI'll confirm once the deck is ready for final sign-off – expect it by Wednesday EOD.\n\nBest,\n[Chief of Staff]`,
    "2": `Hi Amara,\n\nThank you for flagging. Thursday 2pm works well. I'll confirm with James and send a calendar invite shortly.\n\nLooking forward to discussing the mitigation options.\n\nBest,\n[Chief of Staff]`,
    "5": `Hi Priya,\n\nNoted, thank you. I'll have both briefing packs ready by Friday EOD:\n\n1. Helios Capital partnership brief (Tuesday 10am)\n2. Government affairs brief (Thursday 3pm)\n\nI'll send them your way once complete.\n\nBest,\n[Chief of Staff]`,
  };
  return (
    replies[email.id] ||
    `Hi ${email.from.split(" ")[0]},\n\nThank you for your message. I've reviewed the details and will action accordingly.\n\nI'll follow up with next steps shortly.\n\nBest regards,\n[Chief of Staff]`
  );
}

export function generateDelegationEmail(email: Email): string {
  return `Hi [Colleague],\n\nI'm forwarding this for your action. Please see the context below:\n\n**Original from:** ${email.from} (${email.fromRole || "N/A"})\n**Subject:** ${email.subject}\n**Summary:** ${email.summary}\n\n**What I need from you:**\nPlease review and [respond / prepare a summary / schedule a meeting] by [DATE].\n\nLet me know if you need any additional context.\n\nBest,\n[Chief of Staff]`;
}

export function generateBriefFromNotes(rawInput: string): Omit<Brief, "id" | "rawInput" | "createdAt"> {
  const lines = rawInput.split("\n").filter((l) => l.trim());

  return {
    title: `Executive Brief – ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    keyUpdates: lines.slice(0, 4).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).concat(
      lines.length === 0 ? ["No updates provided – please add your raw notes above"] : []
    ),
    decisionsRequired: [
      "Review key updates and determine which require immediate CEO attention",
      "Confirm prioritisation of open action items",
    ],
    risks: [
      "Items without clear owners risk falling through the cracks",
      "Time-sensitive decisions may require same-day CEO input",
    ],
    nextSteps: [
      "CoS: Distribute brief to relevant stakeholders",
      "Schedule any required decision-making sessions",
      "Follow up on delegated items within 24 hours",
    ],
  };
}

export function generateTripBrief(trip: Partial<Trip>): string {
  return `**Trip Brief – ${trip.title || "Upcoming Trip"}**\n\nCEO is travelling from ${trip.from || "Origin"} (${trip.fromAirport || "Airport"}) to ${trip.to || "Destination"} (${trip.toAirport || "Airport"}) on ${trip.departureTime ? new Date(trip.departureTime).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "TBD"}.\n\n**Flight:** ${trip.airline || "Airline"} ${trip.flightNumber || ""}\n**Departs:** ${trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "TBD"} local\n**Arrives:** ${trip.arrivalTime ? new Date(trip.arrivalTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "TBD"} local\n\n**Purpose:** Confirm agenda and objectives with CEO before travel.\n**Action Required:** Prepare briefing pack, confirm ground logistics, check visa requirements if applicable.`;
}

export const expertPersonas: Record<string, { name: string; role: string; color: string; tone: string; avatar: string }> = {
  ceo: {
    name: "CEO",
    role: "Group Chief Executive Officer",
    color: "#f97316",
    tone: "strategic",
    avatar: "👔",
  },
  cfo: {
    name: "CFO",
    role: "Chief Financial Officer",
    color: "#3b82f6",
    tone: "financial",
    avatar: "📊",
  },
  cto: {
    name: "CTO",
    role: "Chief Technology Officer",
    color: "#10b981",
    tone: "technical",
    avatar: "💻",
  },
  product: {
    name: "Product",
    role: "Chief Product Officer",
    color: "#8b5cf6",
    tone: "product",
    avatar: "🚀",
  },
  designer: {
    name: "Designer",
    role: "Chief Design Officer",
    color: "#ec4899",
    tone: "design",
    avatar: "🎨",
  },
};

export function getExpertResponse(expertId: string, userMessage: string): string {
  const persona = expertPersonas[expertId];
  if (!persona) return "I'm not sure how to respond to that.";

  const responses: Record<string, (msg: string) => string> = {
    ceo: (msg) => {
      if (msg.toLowerCase().includes("priorit")) return "Priority is straightforward: revenue impact and strategic alignment. If it doesn't move the needle on our 3-year plan, it waits. What's the specific decision you're weighing?";
      if (msg.toLowerCase().includes("risk")) return "Every risk is a resource allocation question. Quantify it, assign it an owner, and set a review date. Unowned risks are how companies fail. What's the risk on the table?";
      if (msg.toLowerCase().includes("board")) return "The board wants three things: confidence in the numbers, clarity on the strategy, and a credible management team. Make sure your deck leads with those before anything else.";
      return `From a CEO perspective: focus on what creates shareholder value and what protects the business. The question is always – is this the best use of our capital and talent right now? My advice: clarify the strategic objective first, then work backwards to execution. What specifically are you trying to solve?`;
    },
    cfo: (msg) => {
      if (msg.toLowerCase().includes("budget")) return "Budget variance above 5% needs a written explanation and a mitigation plan. Anything above 10% goes to the board. What's driving the overspend and what's the recovery plan?";
      if (msg.toLowerCase().includes("invest")) return "Show me the IRR and payback period. If you can't model those, we're not ready to invest. What are the key assumptions driving the return?";
      return `Financially speaking: every decision has a cost of capital attached to it. Before committing, I'd want to see the cash flow model, the risk-adjusted return, and how it impacts our covenant headroom. Don't bring me a decision without the numbers. What's the financial picture here?`;
    },
    cto: (msg) => {
      if (msg.toLowerCase().includes("migrat")) return "Migrations are 80% planning, 20% execution. The risk isn't the migration itself – it's the rollback plan. Do you have a tested rollback procedure and a clear go/no-go criteria?";
      if (msg.toLowerCase().includes("ai")) return "AI integration is about data quality and feedback loops, not just model selection. Start with the use case that has the cleanest data and clearest success metric. What problem are you actually trying to automate?";
      return `From a technology perspective: build for reliability first, innovation second. Tech debt is a tax that compounds. My recommendation is to define the architecture decision record before writing a line of code. What's the technical problem you're trying to solve?`;
    },
    product: (msg) => {
      if (msg.toLowerCase().includes("roadmap")) return "A roadmap without outcomes is just a feature list. Frame every item as: what customer problem does this solve, and how will we measure success? What's the outcome you're optimizing for?";
      if (msg.toLowerCase().includes("user")) return "User research before opinions. What does the data tell you? If you don't have data, that's the first thing to fix. What are users actually doing vs. what they say they want?";
      return `Product thinking starts with the customer. What job are they hiring this product to do? Every feature decision should trace back to a validated customer need. My process: identify the problem, validate it's real, size the market, then build the minimum to learn. What customer insight is driving this?`;
    },
    designer: (msg) => {
      if (msg.toLowerCase().includes("ui") || msg.toLowerCase().includes("design")) return "Good UI is invisible – users don't notice it because it works. Start with the user's mental model, not your information architecture. What's the user trying to accomplish in 3 steps or less?";
      if (msg.toLowerCase().includes("brand")) return "Brand is a promise. Every touchpoint either reinforces or erodes it. Consistency beats creativity every time. What feeling should the user walk away with?";
      return `Design is problem-solving, not decoration. The question is always: what's the clearest path from the user's intent to their goal? I'd start with a journey map, identify the friction points, and remove them one by one. Simplicity is the ultimate sophistication. What experience are you trying to create?`;
    },
  };

  return responses[expertId]?.(userMessage) ?? `As ${persona.name}, I'd approach this by thinking about the core principles of ${persona.role.toLowerCase()}. The key question to ask is: what's the desired outcome, and what's the most direct path to get there? Tell me more about the specific challenge.`;
}
