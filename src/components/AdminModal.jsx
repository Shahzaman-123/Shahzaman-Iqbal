import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { parseYouTubeUrl } from "../utils/youtube";

function parseTimestampsInput(raw) {
  if (!raw || typeof raw !== "string") return [];
  const parts = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  const result = [];
  for (const part of parts) {
    const match = part.match(/^(?:(\d+):)?(\d+):(\d+)\s*[-:]?\s*(.*)$/);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      result.push({ label: part, seconds: totalSeconds });
    }
  }
  return result;
}

export default function AdminModal({
  isOpen,
  onClose,
  db,
  videos = [],
  onSeedDefaults,
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab State: "videos" or "leads"
  const [activeTab, setActiveTab] = useState("videos");

  // Leads State
  const [leads, setLeads] = useState([]);
  const [deletingLeadId, setDeletingLeadId] = useState(null);

  // Video Form state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("Autonomous Agents / n8n");
  const [description, setDescription] = useState("");
  const [timestampsInput, setTimestampsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Real-time listener for Chatbot Leads
  useEffect(() => {
    if (!isAuthenticated || !db) return;

    try {
      const colRef = collection(db, "chatbot_leads");
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const loadedLeads = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          // Sort newest first
          loadedLeads.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
          });

          setLeads(loadedLeads);
        },
        (err) => {
          console.warn("Firestore chatbot_leads listener error:", err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Error setting up leads listener:", err);
    }
  }, [isAuthenticated, db]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e?.preventDefault();
    const expectedPassword =
      import.meta.env.VITE_ADMIN_PASSWORD || "SHAHzaman123*";

    if (!passwordInput.trim()) {
      setAuthError("Please enter the admin password.");
      return;
    }

    if (passwordInput.trim() === expectedPassword.trim()) {
      setIsAuthenticated(true);
      setAuthError("");
      setPasswordInput("");
    } else {
      setAuthError("Invalid admin access key. Access denied.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput("");
    setAuthError("");
    setEditingId(null);
    setTitle("");
    setYoutubeUrl("");
    setDescription("");
    setTimestampsInput("");
    onClose();
  };

  const handleStartEdit = (video) => {
    setEditingId(video.id);
    setTitle(video.title || "");
    setYoutubeUrl(video.url || "");
    setCategory(video.category || "Autonomous Agents / n8n");
    setDescription(video.description || "");
    setTimestampsInput(
      video.timestamps?.map((t) => t.label).join(", ") || ""
    );
    setFormMessage({
      type: "info",
      text: `Editing "${video.title}". Modify fields below and click Update.`,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setYoutubeUrl("");
    setCategory("Autonomous Agents / n8n");
    setDescription("");
    setTimestampsInput("");
    setFormMessage(null);
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      setFormMessage({
        type: "error",
        text: "Please provide both a video title and YouTube URL.",
      });
      return;
    }

    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed.isValid) {
      setFormMessage({
        type: "error",
        text: "Invalid YouTube URL format. Please paste a standard watch, short link, or shorts URL.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    const parsedTimestamps = parseTimestampsInput(timestampsInput);

    try {
      if (!db) {
        throw new Error("Firestore database is not initialized.");
      }

      if (editingId) {
        if (editingId.startsWith("default-")) {
          await addDoc(collection(db, "portfolio_videos"), {
            title: title.trim(),
            url: parsed.watchUrl || youtubeUrl.trim(),
            embedUrl: parsed.embedUrl,
            videoId: parsed.videoId,
            category: category.trim() || "Autonomous Agents / n8n",
            description: description.trim(),
            timestamps: parsedTimestamps,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, "portfolio_videos", editingId), {
            title: title.trim(),
            url: parsed.watchUrl || youtubeUrl.trim(),
            embedUrl: parsed.embedUrl,
            videoId: parsed.videoId,
            category: category.trim() || "Autonomous Agents / n8n",
            description: description.trim(),
            timestamps: parsedTimestamps,
            updatedAt: serverTimestamp(),
          });
        }

        setFormMessage({
          type: "success",
          text: "Video walkthrough updated successfully! ✨",
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "portfolio_videos"), {
          title: title.trim(),
          url: parsed.watchUrl || youtubeUrl.trim(),
          embedUrl: parsed.embedUrl,
          videoId: parsed.videoId,
          category: category.trim() || "Autonomous Agents / n8n",
          description: description.trim(),
          timestamps: parsedTimestamps,
          createdAt: serverTimestamp(),
        });

        setFormMessage({
          type: "success",
          text: "Video walkthrough successfully deployed to live portfolio! 🚀",
        });
      }

      setTitle("");
      setYoutubeUrl("");
      setDescription("");
      setTimestampsInput("");

      setTimeout(() => setFormMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save video:", err);
      setFormMessage({
        type: "error",
        text: "Failed to save video: " + (err.message || "Unknown error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!videoId) return;
    if (videoId.startsWith("default-")) {
      alert("Default videos are seeded automatically. Add custom videos to manage Firestore records directly.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this video walkthrough from Firestore?"
    );
    if (!confirmDelete) return;

    if (editingId === videoId) {
      handleCancelEdit();
    }

    setDeletingId(videoId);
    try {
      if (!db) throw new Error("Firestore not initialized.");
      await deleteDoc(doc(db, "portfolio_videos", videoId));
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert("Error deleting video: " + (err.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!leadId) return;
    const confirmDelete = window.confirm("Delete this lead record permanently?");
    if (!confirmDelete) return;

    setDeletingLeadId(leadId);
    try {
      if (!db) throw new Error("Firestore not initialized.");
      await deleteDoc(doc(db, "chatbot_leads", leadId));
    } catch (err) {
      console.error("Failed to delete lead:", err);
      alert("Error deleting lead: " + (err.message || "Unknown error"));
    } finally {
      setDeletingLeadId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            <div>
              <h2 className="font-heading font-bold text-white text-base tracking-wide flex items-center gap-2">
                🔒 Portfolio Control Center
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                  Admin v2.2
                </span>
              </h2>
              <p className="text-slate-400 text-xs">
                Manage video walkthroughs and view incoming AI chatbot leads in real time.
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-xl p-1 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation (Visible when authenticated) */}
        {isAuthenticated && (
          <div className="px-6 pt-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-3">
            <button
              onClick={() => setActiveTab("videos")}
              className={`pb-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "videos"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <span>📹 Videos Manager</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {videos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`pb-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "leads"
                  ? "border-emerald-400 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <span>💬 Chatbot Leads Inbox</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {leads.length} Live
              </span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isAuthenticated ? (
            /* Password Authentication Screen */
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center text-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  ⚡
                </div>
                <h3 className="text-white font-heading font-bold text-lg">
                  Restricted Access Verification
                </h3>
                <p className="text-slate-400 text-xs">
                  Enter master credentials to access video deployment &amp; chatbot leads inbox.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                  {authError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Master Password
                </label>
                <input
                  type="password"
                  name="admin_pass_key"
                  id="admin_pass_key"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Enter admin password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  Authenticate →
                </button>
              </div>
            </form>
          ) : activeTab === "leads" ? (
            /* Leads Inbox Tab */
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live Chatbot Leads ({leads.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prospect queries captured automatically from your portfolio AI assistant.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  Firestore: chatbot_leads
                </span>
              </div>

              {leads.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
                  <div className="text-2xl">💬</div>
                  <p className="text-xs text-slate-400">
                    No chatbot leads recorded in Firestore yet.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    When visitors chat with your AI assistant, inquiries and contact details will appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => {
                    const timeStr = lead.timestamp?.seconds
                      ? new Date(lead.timestamp.seconds * 1000).toLocaleString()
                      : "Just now";

                    const userMsg = lead.userMessage || "";
                    const whatsappFollowup = `https://wa.me/923241736180?text=${encodeURIComponent(
                      `Hi Shahzaman, reviewing chatbot lead: "${userMsg.slice(0, 100)}"`
                    )}`;

                    return (
                      <div
                        key={lead.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3 shadow-sm hover:border-slate-700 transition-all"
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/60 pb-2">
                          <span className="text-emerald-400 font-bold">
                            📅 {timeStr}
                          </span>
                          <span className="text-slate-500 truncate max-w-[180px]">
                            Session: {lead.sessionId || "N/A"}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-0.5">
                              Prospect Message:
                            </span>
                            <p className="text-white bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-medium">
                              {userMsg || "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-0.5">
                              AI Assistant Reply:
                            </span>
                            <p className="text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed text-[11px] max-h-24 overflow-y-auto">
                              {lead.botReply || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 text-xs">
                          <a
                            href={whatsappFollowup}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px]"
                          >
                            <span>Open in WhatsApp ↗</span>
                          </a>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={deletingLeadId === lead.id}
                            className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold border border-red-500/30 transition-all"
                          >
                            {deletingLeadId === lead.id ? "Deleting..." : "Delete Lead"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Videos Manager Tab */
            <div className="space-y-8">
              {/* Add / Edit Video Section */}
              <div
                className={`p-5 rounded-xl border space-y-4 transition-all ${
                  editingId
                    ? "bg-slate-950/90 border-cyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                    {editingId ? (
                      <>
                        <span className="text-cyan-400">✏️</span>
                        <span>Edit Video Walkthrough</span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40">
                          Editing Mode
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-cyan-400">+</span>
                        <span>Add New Video Walkthrough</span>
                      </>
                    )}
                  </h3>

                  <div className="flex items-center gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline"
                      >
                        ✕ Cancel Edit
                      </button>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      Collection: <span className="text-cyan-400">portfolio_videos</span>
                    </span>
                  </div>
                </div>

                {formMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      formMessage.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : formMessage.type === "info"
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                        : "bg-red-500/10 border border-red-500/30 text-red-400"
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}

                <form onSubmit={handleSaveVideo} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-medium">Video Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Multi-Agent Lead Enrichment (n8n)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-medium">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Autonomous Agents / n8n">Autonomous Agents / n8n</option>
                        <option value="Voice AI / Retell AI">Voice AI / Retell AI</option>
                        <option value="Voice AI / Vapi">Voice AI / Vapi</option>
                        <option value="CRM Automation / GHL">CRM Automation / GHL</option>
                        <option value="Full-Stack Web App">Full-Stack Web App</option>
                        <option value="Data Pipeline & Scraping">Data Pipeline &amp; Scraping</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">
                      YouTube URL (Watch, Shorts, or youtu.be)
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500"
                      required
                    />
                    {youtubeUrl && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Embed Preview URL:{" "}
                        <span className="text-cyan-400">
                          {parseYouTubeUrl(youtubeUrl).embedUrl || "Invalid YouTube link"}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">
                      Chapter Timestamps (Optional, comma-separated or line-by-line)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0:15 Demo Call, 1:30 Architecture, 2:20 CRM Sync"
                      value={timestampsInput}
                      onChange={(e) => setTimestampsInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500">
                      Creates clickable chapter pills on the video card that jump visitors to that exact second.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Technical overview, features demonstrated, integrations covered..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500"
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-xs"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2"
                    >
                      {isSubmitting
                        ? "Saving to Firestore..."
                        : editingId
                        ? "Update Video Walkthrough 💾"
                        : "Publish Video Walkthrough 🚀"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Videos List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold text-sm text-white">
                    Active Video Records ({videos.length})
                  </h4>
                  {onSeedDefaults && (
                    <button
                      onClick={onSeedDefaults}
                      className="text-[11px] font-mono text-cyan-400 hover:underline"
                    >
                      Re-seed Default Walkthroughs
                    </button>
                  )}
                </div>

                {videos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No videos recorded in Firestore yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {videos.map((v) => (
                      <div
                        key={v.id || v.url}
                        className={`p-3 rounded-xl bg-slate-950/70 border flex items-center justify-between gap-3 transition-all ${
                          editingId === v.id
                            ? "border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            : "border-slate-800"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                              {v.category}
                            </span>
                            {v.id?.startsWith("default-") && (
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                            {v.timestamps && v.timestamps.length > 0 && (
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                {v.timestamps.length} Chapters
                              </span>
                            )}
                            {editingId === v.id && (
                              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                                (Currently Editing)
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-semibold text-white truncate mt-1">
                            {v.title}
                          </h5>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-cyan-400 truncate block font-mono"
                          >
                            {v.url}
                          </a>
                        </div>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEdit(v)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              editingId === v.id
                                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                                : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
                            }`}
                          >
                            {editingId === v.id ? "Editing" : "Edit"}
                          </button>

                          <button
                            onClick={() => handleDeleteVideo(v.id)}
                            disabled={deletingId === v.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-all"
                          >
                            {deletingId === v.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-xs">
          <div className="text-slate-500 font-mono">
            {isAuthenticated ? "Session: Active Administrator" : "Session: Locked"}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            {isAuthenticated ? "Logout & Close" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
