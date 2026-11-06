import { useState } from "react";

const PIPELINE_NODES = [
  {
    id: "ingestion",
    number: "01",
    name: "New Lead Comes In",
    tech: "From ads, forms & lists",
    badge: "Step 1 — Entry",
    latency: "12ms",
    status: "Working",
    description:
      "A new lead comes in from a Facebook ad, your website, or a list. The system reads the name, phone number, and where they came from.",
    reliability: "If the first try fails, it tries again by itself (up to 3 times).",
    payload: {
      event: "lead.created",
      source: "meta_ad_campaign_v4",
      timestamp: "2026-09-20T08:30:12.441Z",
      lead: {
        name: "Marcus Vance",
        company: "Apex Media Scale",
        email: "m.vance@apexmediascale.io",
        intent: "Book AI Voice Assistant & CRM Integration",
        budget_tier: "enterprise_custom",
      },
    },
  },
  {
    id: "validation",
    number: "02",
    name: "Check & Clean Up",
    tech: "Checks for copies",
    badge: "Step 2 — Safety check",
    latency: "24ms",
    status: "Checked",
    description:
      "The system checks if this lead is new or a repeat, and fixes the phone number format before anything else happens.",
    reliability: "Repeat clicks in the same minute are ignored — no double records.",
    payload: {
      status: "validated",
      is_duplicate: false,
      normalized_phone: "+1 (555) 234-8910",
      security_hash: "sha256_e8910cfa2210bbf9",
      enrichment_target: "bright_data_apollo_graph",
    },
  },
  {
    id: "llm-agent",
    number: "03",
    name: "Smart Reply Written",
    tech: "AI reads & decides",
    badge: "Step 3 — AI thinks",
    latency: "185ms",
    status: "Done",
    description:
      "The AI reads what the customer wants, decides how likely they are to buy, and writes a personal reply.",
    reliability: "If the main AI is busy, a backup AI takes over.",
    payload: {
      agent_decision: "HIGH_INTENT_LEAD",
      priority_score: 9.4,
      classified_service: "Retell AI Voice Assistant + GHL Pipeline",
      suggested_pitch: "Automate inbound voice calls and sync calendar slots directly into GoHighLevel.",
      tokens_consumed: 142,
    },
  },
  {
    id: "voice-ai",
    number: "04",
    name: "AI Phone Call",
    tech: "Voice calls",
    badge: "Step 4 — The call",
    latency: "340ms (Sub-second audio)",
    status: "Calling",
    description:
      "The AI calls the customer within a minute, talks naturally, and books the appointment.",
    reliability: "If nobody picks up, it sends a text or WhatsApp message instead.",
    payload: {
      call_id: "call_retell_82910fbc",
      assistant_id: "asst_shahzaman_booking_v2",
      call_status: "in_progress",
      latency_ms: 340,
      collected_fields: {
        preferred_time: "Tomorrow at 3:00 PM EST",
        confirmed_attendees: 1,
      },
    },
  },
  {
    id: "crm-dispatch",
    number: "05",
    name: "List Updated & Alert Sent",
    tech: "Customer list & WhatsApp",
    badge: "Step 5 — Done",
    latency: "85ms",
    status: "Updated",
    description:
      "Your customer list updates, the customer gets a confirmation text, and you get a WhatsApp message with the call details.",
    reliability: "Every update is sent once — no doubles — and errors go to WhatsApp or Telegram.",
    payload: {
      ghl_contact_id: "ghl_cnt_918230",
      stage_updated: "Booked Technical Call",
      whatsapp_alert_sent: true,
      google_calendar_event: "https://calendar.google.com/event?eid=89210",
      sync_latency_ms: 85,
    },
  },
];

export default function WorkflowPipelineVisualizer() {
  const [activeNodeId, setActiveNodeId] = useState("llm-agent");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedIndex, setSimulatedIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  const activeNode =
    PIPELINE_NODES.find((n) => n.id === activeNodeId) || PIPELINE_NODES[0];

  // Run sequential simulation across nodes 1 to 5
  const handleSimulateRun = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedIndex(0);
    setActiveNodeId(PIPELINE_NODES[0].id);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < PIPELINE_NODES.length) {
        setSimulatedIndex(current);
        setActiveNodeId(PIPELINE_NODES[current].id);
      } else {
        clearInterval(interval);
        setSimulatedIndex(null);
        setIsSimulating(false);
      }
    }, 1100);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(activeNode.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neon-400 animate-pulse"></span>
          <span className="text-xs font-mono text-slate-300">
            System status: <span className="text-neon-400 font-bold">Working — nothing gets lost</span>
          </span>
        </div>

        <button
          onClick={handleSimulateRun}
          disabled={isSimulating}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-500 to-neon-600 hover:from-neon-400 hover:to-neon-500 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(255, 42, 42,0.3)] hover:scale-105"
        >
          {isSimulating ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              <span>Step {simulatedIndex + 1} of 5...</span>
            </>
          ) : (
            <>
              <span>⚡ ▶ Watch It Work</span>
            </>
          )}
        </button>
      </div>

      {/* 5-Node Interactive Architecture Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {PIPELINE_NODES.map((node, idx) => {
          const isSelected = activeNode.id === node.id;
          const isCurrentlySimulating = simulatedIndex === idx;

          return (
            <button
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              className={`p-4 rounded-xl text-left border transition-all duration-300 relative group overflow-hidden ${
                isSelected || isCurrentlySimulating
                  ? "bg-slate-900 border-neon-400 shadow-[0_0_25px_rgba(255, 42, 42,0.35)] scale-[1.02]"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
              }`}
            >
              {/* Active Ambient Glow */}
              {(isSelected || isCurrentlySimulating) && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-neon-500/20 rounded-full blur-xl pointer-events-none"></div>
              )}

              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono font-bold text-neon-400 bg-neon-500/10 px-1.5 py-0.5 rounded border border-neon-500/20">
                  {node.number}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {node.latency}
                </span>
              </div>

              <h4 className="text-white font-semibold text-xs truncate mb-1">
                {node.name}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {node.tech}
              </p>

              {/* Connected node indicator bar */}
              <div
                className={`mt-3 h-1 rounded-full transition-all duration-300 ${
                  isSelected || isCurrentlySimulating
                    ? "bg-gradient-to-r from-neon-400 to-neon-500 w-full"
                    : "bg-slate-800 w-1/3 group-hover:w-2/3"
                }`}
              ></div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl">
        {/* Node Metadata & Architectural Specs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase text-neon-400 bg-neon-500/10 px-2.5 py-1 rounded border border-neon-500/30">
                {activeNode.badge}
              </span>
              <span className="text-[11px] font-mono text-neon-400 bg-neon-500/10 px-2 py-0.5 rounded border border-neon-500/20">
                ● {activeNode.status}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Speed: <span className="text-white font-bold">{activeNode.latency}</span>
              </span>
            </div>

            <h3 className="font-heading text-xl font-normal text-white flex items-center gap-2">
              <span>{activeNode.name}</span>
            </h3>
            <p className="text-xs font-mono text-neon-300">
              Tools: {activeNode.tech}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              What happens here
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeNode.description}
            </p>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-neon-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              🛡️ If Something Goes Wrong
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {activeNode.reliability}
            </p>
          </div>
        </div>

        {/* Live Payload Visualizer */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between pb-1">
            <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-400"></span>
              <span>Live Example Data</span>
            </div>
            <button
              onClick={handleCopyPayload}
              className="text-[10px] font-mono text-neon-400 hover:text-neon-300 bg-slate-950 border border-slate-800 hover:border-neon-500/40 px-2.5 py-1 rounded transition-colors"
            >
              {copied ? "Copied ✓" : "Copy Payload"}
            </button>
          </div>

          <div className="relative flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[260px] leading-relaxed shadow-inner">
            <pre className="text-neon-300 whitespace-pre">
              {JSON.stringify(activeNode.payload, null, 2)}
            </pre>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-right">
            Data check: Passed ✓
          </div>
        </div>
      </div>
    </div>
  );
}
