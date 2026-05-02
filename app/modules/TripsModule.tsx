"use client";

import { useState } from "react";
import { Plane, Plus, Clock, MapPin, Bell, Sparkles, ChevronRight, Trash2 } from "lucide-react";
import type { Trip } from "../lib/types";
import { useTrips } from "../store/useStore";
import { Modal } from "../components/Modal";
import { generateTripBrief } from "../lib/mockAI";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-xl border transition-all hover:border-orange-500/30 hover:bg-orange-500/5 group"
      style={{ background: "var(--navy-700)", borderColor: "var(--border-light)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{trip.title}</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{trip.airline} · {trip.flightNumber}</p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          <Plane size={16} style={{ color: "var(--orange)" }} />
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{trip.from}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{trip.fromAirport}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: "var(--orange)" }}>{formatTime(trip.departureTime)}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <div className="w-8 h-px" style={{ background: "var(--border-light)" }} />
            <Plane size={12} style={{ color: "var(--text-muted)", transform: "rotate(45deg)" }} />
            <div className="w-8 h-px" style={{ background: "var(--border-light)" }} />
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatDate(trip.departureTime)}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{trip.to}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{trip.toAirport}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: "var(--orange)" }}>{formatTime(trip.arrivalTime)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-2">
          {trip.reminders.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
              <Bell size={10} /> {trip.reminders.length} reminders
            </span>
          )}
        </div>
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
      </div>
    </button>
  );
}

interface AddTripFormProps {
  onAdd: (trip: Trip) => void;
  onClose: () => void;
}

function AddTripForm({ onAdd, onClose }: AddTripFormProps) {
  const [form, setForm] = useState({
    title: "",
    from: "",
    fromAirport: "",
    to: "",
    toAirport: "",
    departureTime: "",
    arrivalTime: "",
    airline: "",
    flightNumber: "",
    pastedDetails: "",
  });

  const f = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    const trip: Trip = {
      id: Date.now().toString(),
      title: form.title || `${form.from} → ${form.to}`,
      from: form.from,
      fromAirport: form.fromAirport,
      to: form.to,
      toAirport: form.toAirport,
      departureTime: form.departureTime || new Date().toISOString(),
      arrivalTime: form.arrivalTime || new Date().toISOString(),
      airline: form.airline,
      flightNumber: form.flightNumber,
      brief: generateTripBrief({ ...form, departureTime: form.departureTime, arrivalTime: form.arrivalTime }),
      ceoNotes: "Brief auto-generated. Add CEO-specific notes here.",
      reminders: [
        `Online check-in opens 24hrs before departure`,
        `Prepare briefing pack for key meetings`,
        `Confirm ground transport`,
      ],
      createdAt: new Date().toISOString(),
    };
    onAdd(trip);
    onClose();
  };

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Trip Title</label>
        <input style={inputStyle} placeholder="e.g. NYC Leadership Summit" value={form.title} onChange={(e) => f("title", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>From City</label>
          <input style={inputStyle} placeholder="London" value={form.from} onChange={(e) => f("from", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>From Airport</label>
          <input style={inputStyle} placeholder="Heathrow (LHR)" value={form.fromAirport} onChange={(e) => f("fromAirport", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>To City</label>
          <input style={inputStyle} placeholder="New York" value={form.to} onChange={(e) => f("to", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>To Airport</label>
          <input style={inputStyle} placeholder="JFK International (JFK)" value={form.toAirport} onChange={(e) => f("toAirport", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Departure</label>
          <input type="datetime-local" style={inputStyle} value={form.departureTime} onChange={(e) => f("departureTime", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Arrival</label>
          <input type="datetime-local" style={inputStyle} value={form.arrivalTime} onChange={(e) => f("arrivalTime", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Airline</label>
          <input style={inputStyle} placeholder="British Airways" value={form.airline} onChange={(e) => f("airline", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Flight Number</label>
          <input style={inputStyle} placeholder="BA177" value={form.flightNumber} onChange={(e) => f("flightNumber", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Paste Flight Details (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder="Paste raw confirmation email or booking details here..."
          value={form.pastedDetails}
          onChange={(e) => f("pastedDetails", e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--orange)", color: "white" }}
        >
          <Sparkles size={14} className="inline mr-2" />
          Add Trip & Generate Brief
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

export function TripsModule() {
  const [trips, setTrips] = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const addTrip = (trip: Trip) => setTrips((p) => [trip, ...p]);
  const deleteTrip = (id: string) => { setTrips((p) => p.filter((t) => t.id !== id)); setSelectedTrip(null); };

  return (
    <div className="flex h-full">
      {/* List */}
      <div
        className={`flex flex-col border-r ${selectedTrip ? "hidden md:flex md:w-80 lg:w-96 shrink-0" : "flex-1"}`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Upcoming Trips</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Plus size={12} />
            Add Trip
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {trips.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Plane size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No trips yet</p>
            </div>
          )}
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onClick={() => setSelectedTrip(trip)} />
          ))}
        </div>
      </div>

      {/* Detail */}
      {selectedTrip ? (
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 max-w-3xl">
            {/* Back */}
            <button
              onClick={() => setSelectedTrip(null)}
              className="flex items-center gap-1 text-sm mb-5 md:hidden"
              style={{ color: "var(--orange)" }}
            >
              <ChevronRight size={14} className="rotate-180" />
              Back
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{selectedTrip.title}</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selectedTrip.airline} · {selectedTrip.flightNumber} · {formatDate(selectedTrip.departureTime)}</p>
              </div>
              <button
                onClick={() => deleteTrip(selectedTrip.id)}
                className="p-2 rounded-lg hover:bg-red-900/30 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Flight info */}
            <div className="p-5 rounded-xl mb-5" style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{selectedTrip.from}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedTrip.fromAirport}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--orange)" }}>{formatTime(selectedTrip.departureTime)}</p>
                </div>
                <div className="text-center">
                  <Plane size={20} style={{ color: "var(--text-muted)" }} className="mx-auto mb-1" />
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Direct</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{selectedTrip.to}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedTrip.toAirport}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--orange)" }}>{formatTime(selectedTrip.arrivalTime)}</p>
                </div>
              </div>
            </div>

            {/* What CEO needs to know */}
            <Section title="What CEO Needs to Know" icon={<Sparkles size={14} />}>
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{selectedTrip.ceoNotes}</p>
            </Section>

            {/* Trip Brief */}
            <Section title="Trip Brief" icon={<MapPin size={14} />}>
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{selectedTrip.brief}</p>
            </Section>

            {/* Reminders */}
            <Section title="Reminders" icon={<Bell size={14} />}>
              <ul className="space-y-2">
                {selectedTrip.reminders.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Clock size={12} className="mt-1 shrink-0" style={{ color: "var(--orange)" }} />
                    {r}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <Plane size={48} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a trip to view details</p>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add New Trip" onClose={() => setShowAdd(false)} wide>
          <AddTripForm onAdd={addTrip} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5 p-5 rounded-xl" style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span style={{ color: "var(--orange)" }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
