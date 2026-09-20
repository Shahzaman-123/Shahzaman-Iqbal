import { useState } from "react";

const PIPELINE_NODES = [
  {
    id: "ingestion",
    number: "01",
    name: "Inbound Ingestion",
    tech: "Webhook & Apollo API",
    badge: "Gateway Node",
    latency: "12ms",
    status: "Active (200 OK)",
    description:
      "Captures raw lead payloads from Meta Ads, website forms, or Apollo webhooks. Normalizes headers, parses JSON, and passes to security sanitization.",
    reliability: "Automatic 3x exponential retry on socket timeout with HMAC validation.",
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
    name: "Validation & Deduplication",
    tech: "Redis & Custom JS Node",
    badge: "Security Layer",
    latency: "24ms",
    status: "Verified (HMAC 256)",
    description:
      "Cross-references inbound email and phone against Redis cache to prevent duplicate processing. Normalizes international phone codes to E.164.",
    reliability: "Deduplicates repeat clicks within 60-second window, dropping noisy retries.",
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
    name: "LLM Neural Intelligence",
    tech: "Claude 3.5 & Groq",
    badge: "Autonomous Reasoner",
    latency: "185ms",
    status: "Completed (Confidence 98.4%)",
    description:
      "Autonomous Claude agent parses lead pain points, classifies immediate qualification tier, and drafts customized voice synthesis scripts with dynamic parameters.",
    reliability: "Fallback channel automatically routes to Groq Llama 3.3 if primary LLM hits rate limits.",
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
    name: "Voice AI Calling Engine",
    tech: "Retell AI / Vapi",
    badge: "Voice Infrastructure",
    latency: "340ms (Sub-second audio)",
    status: "Dispatched",
    description:
      "Initiates ultra-low latency conversational AI phone call within 60 seconds of form submission. Engages the lead in realistic dialogue and captures calendar bookings.",
    reliability: "Automatic fallback to SMS/WhatsApp escalation if call goes to voicemail.",
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
    name: "Dispatch & CRM Sync",
    tech: "GoHighLevel & WhatsApp",
    badge: "Pipeline Hub",
    latency: "85ms",
    status: "Synchronized",
    description:
      "Updates GHL Opportunity pipeline stage to 'Call Booked', triggers SMS confirmation, and sends real-time WhatsApp alert with full call transcript to sales reps.",
    reliability: "Idempotent webhook delivery with Telegram & Slack error routing.",
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
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-mono text-slate-300">
            Topology State: <span className="text-cyan-400 font-bold">Zero-Loss Orchestrated Mesh</span>
          </span>
        </div>

        <button
          onClick={handleSimulateRun}
          disabled={isSimulating}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105"
        >
          {isSimulating ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              <span>Executing Node {simulatedIndex + 1} of 5...</span>
            </>
          ) : (
            <>
              <span>⚡ Simulate Real-Time Execution</span>
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
                  ? "bg-slate-900 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02]"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
              }`}
            >
              {/* Active Ambient Glow */}
              {(isSelected || isCurrentlySimulating) && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/20 rounded-full blur-xl pointer-events-none"></div>
              )}

              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
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
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 w-full"
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
              <span className="text-xs font-mono font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                {activeNode.badge}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● {activeNode.status}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Latency: <span className="text-white font-bold">{activeNode.latency}</span>
              </span>
            </div>

            <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <span>{activeNode.name}</span>
            </h3>
            <p className="text-xs font-mono text-cyan-300">
              Technology Stack: {activeNode.tech}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Operational Mechanics
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeNode.description}
            </p>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              🛡️ Fault Tolerance &amp; Recovery
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
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Live In-Flight JSON Payload</span>
            </div>
            <button
              onClick={handleCopyPayload}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 px-2.5 py-1 rounded transition-colors"
            >
              {copied ? "Copied ✓" : "Copy Payload"}
            </button>
          </div>

          <div className="relative flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[260px] leading-relaxed shadow-inner">
            <pre className="text-cyan-300 whitespace-pre">
              {JSON.stringify(activeNode.payload, null, 2)}
            </pre>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-right">
            Schema Validation: Strict TypeScript Interface (Pass)
          </div>
        </div>
      </div>
    </div>
  );
}
