import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import VideoBreakdowns from "./components/VideoBreakdowns";
import { DEFAULT_VIDEOS } from "./constants/videos";
import AdminModal from "./components/AdminModal";
import { parseYouTubeUrl } from "./utils/youtube";
import WorkflowPipelineVisualizer from "./components/WorkflowPipelineVisualizer";
import RoiCalculator from "./components/RoiCalculator";
import KineticHero from "./components/KineticHero";
import Starfield from "./components/Starfield";

gsap.registerPlugin(ScrollTrigger);

// Firebase Configuration Setup
const firebaseConfig = {
  apiKey: "AIzaSyDA5zaoMGEhN1S8_fghbWD_Rz5WBnE07ZU",
  authDomain: "shahzaman-3a4cd.firebaseapp.com",
  projectId: "shahzaman-3a4cd",
  storageBucket: "shahzaman-3a4cd.firebasestorage.app",
  messagingSenderId: "632345579126",
  appId: "1:632345579126:web:bb76f9223467162d091957",
  measurementId: "G-8Y47VCNC5L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Groq API Key Setup (loaded from environment)
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

// System Prompt
const SYSTEM_PROMPT = `
You are the official Custom AI Assistant for Shahzaman Iqbal — a premier Backend Automation & Workflow Architect.

CRITICAL RULES:
1. Respond EXCLUSIVELY in clear, professional English.
2. NEVER mention third-party AI companies like Groq, Llama, OpenAI, or Meta. You are Shahzaman's proprietary neural assistant.
3. In Markdown tables, DO NOT output raw HTML tags like <br> or <br/>. Format items cleanly on separate lines or clean list syntax.
4. NEVER output internal reasoning or thought blocks (e.g. <think>...). Return only the direct, final response.
5. DIRECT WHATSAPP PREFILL LINKS: When a prospect inquires about a price quote, custom workflow build, consultation, or project timeline, invite them to finalize specifics on WhatsApp by generating a direct click-to-chat link: [Chat on WhatsApp with Project Brief →](https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20chatted%20with%20your%20AI%20about%20[Project_Type]) replacing [Project_Type] with a clean URL-encoded summary of their specific requirement.

Shahzaman's Technical Profile:
- Full Name: Shahzaman Iqbal
- Role: Backend Automation & Workflow Architect / Full-Stack AI Engineer
- Core Expertise: n8n workflow architecture, GoHighLevel (GHL) CRM automation, Vapi & Retell AI voice agents, REST APIs, Webhooks, React.js, Python, JavaScript, Scraping & Data Enrichment (Apollo, Dripify, Bright Data).
- Credentials & Certifications:
  1. Anthropic Academy Certified AI Engineer (Claude 101 Foundations & Building with Claude API)
  2. DataCrumbs N8N Chatbot Lab Masterclass Graduate
- Production Portfolio & Web Applications:
  1. A2Z FIX (a2zfix.vercel.app) — Institute platform for Chip-Level Mobile Repairing with certificate verification & student portals.
  2. Decoria Store (decoria-store.vercel.app) — E-Commerce web app for home decor & cosmetics with dynamic product filtering & catalog integrations.
  3. YouTube Data Extraction & Lead Enrichment Pipeline (n8n + JS).
  4. AI Sales Closer + CRM Automation Agent (n8n + GHL).
  5. 29+ autonomous AI agents & complex automated backend workflows built.
- Engagement & Pricing:
  - Single Workflow Build: Starting at Rs. 10,000 (specific n8n workflow, automation pipeline, or standalone agent).
  - Full System Architecture: Custom Quote for scaling agencies & enterprise brands.
- Direct Channels:
  - WhatsApp: +92 324 1736180
  - LinkedIn: https://www.linkedin.com/in/shahzaman-iqbal-76172836a
  - YouTube: https://www.youtube.com/@shahzamaniqbal-v8n
  - Instagram: https://www.instagram.com/n8n_developer/?hl=en
  - TikTok: https://www.tiktok.com/@n8ndeveloper
  - Facebook: https://www.facebook.com/profile.php?id=61578748077131

Tone & Formatting:
- Professional, concise, structured, and helpful.
- Use bold highlights, clean bullet lists, and standard Markdown tables for pricing/deliverables.
`;

export default function App() {
  const containerRef = useRef(null);

  // Video Management & Admin Modal State
  const [videos, setVideos] = useState(DEFAULT_VIDEOS);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("");
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now());
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Shahzaman's AI helper. Ask me what he builds, what it costs, or about his work — A2Z FIX and Decoria Store.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // Firestore Real-Time Video Listener & Auto-Seeding
  useEffect(() => {
    try {
      const colRef = collection(db, "portfolio_videos");
      const unsubscribe = onSnapshot(
        colRef,
        async (snapshot) => {
          if (snapshot.empty) {
            console.log("portfolio_videos is empty in Firestore. Auto-seeding initial walkthroughs...");
            for (const defVid of DEFAULT_VIDEOS) {
              try {
                const { embedUrl, watchUrl, videoId } = parseYouTubeUrl(defVid.url);
                await addDoc(collection(db, "portfolio_videos"), {
                  title: defVid.title,
                  url: watchUrl || defVid.url,
                  embedUrl,
                  videoId,
                  category: defVid.category,
                  description: defVid.description,
                  createdAt: serverTimestamp(),
                });
              } catch (seedErr) {
                console.warn("Failed to auto-seed video to Firestore:", seedErr);
              }
            }
            setVideos(DEFAULT_VIDEOS);
          } else {
            const loaded = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            setVideos(loaded);
          }
          ScrollTrigger.refresh();
        },
        (err) => {
          console.warn("Firestore videos onSnapshot error:", err);
          setVideos(DEFAULT_VIDEOS);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore setup error:", err);
      setVideos(DEFAULT_VIDEOS);
    }
  }, []);

  const handleSeedDefaults = async () => {
    try {
      for (const defVid of DEFAULT_VIDEOS) {
        const { embedUrl, watchUrl, videoId } = parseYouTubeUrl(defVid.url);
        await addDoc(collection(db, "portfolio_videos"), {
          title: defVid.title,
          url: watchUrl || defVid.url,
          embedUrl,
          videoId,
          category: defVid.category,
          description: defVid.description,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error manually seeding default walkthroughs:", err);
    }
  };

  // Secret Triple-Click Handler (3 rapid clicks in 1.2 seconds on footer copyright)
  const handleCopyrightClick = () => {
    clickCountRef.current += 1;

    if (clickCountRef.current >= 3) {
      clearTimeout(clickTimerRef.current);
      clickCountRef.current = 0;
      setIsAdminModalOpen(true);
      return;
    }

    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1200);
  };

  // Robust Dynamic Detection of Valid Chat Models
  useEffect(() => {
    async function getUsableModel() {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: "Bearer " + GROQ_API_KEY.trim(),
          },
        });
        if (res.ok) {
          const json = await res.json();
          const validChatModels = json.data
            .map((m) => m.id)
            .filter(
              (id) =>
                !id.includes("guard") &&
                !id.includes("whisper") &&
                !id.includes("vision") &&
                !id.includes("orpheus") &&
                !id.includes("embed")
            );

          const chosen =
            validChatModels.find((m) => m.includes("llama-3.1-8b-instant")) ||
            validChatModels.find((m) => m.includes("gemma2-9b-it")) ||
            validChatModels.find((m) => m.includes("mixtral-8x7b-32768")) ||
            validChatModels.find((m) => m.includes("llama-3.3-70b-versatile")) ||
            validChatModels[0];

          if (chosen) {
            setActiveModel(chosen);
          }
        }
      } catch (err) {
        console.error("Auto model selection error:", err);
      }
    }
    getUsableModel();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".metric-item", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".metrics-bar",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      document.querySelectorAll("section.gsap-reveal").forEach((section) => {
        gsap.to(section, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Groq API Call Handler & Firebase Firestore Logger
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    const updatedMessages = [...messages, { role: "user", content: userText }];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const selectedModel = activeModel || "gemma2-9b-it";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + GROQ_API_KEY.trim(),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
          ],
          temperature: 0.5,
          max_tokens: 600,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }

      let botReply = data.choices?.[0]?.message?.content || "No response received.";
      
      // Clean up think tags and raw HTML break tags
      botReply = botReply
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .trim();

      setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);

      // Log conversation to Firebase Firestore
      try {
        await addDoc(collection(db, "chatbot_leads"), {
          sessionId: sessionId,
          userMessage: userText,
          botReply: botReply,
          timestamp: serverTimestamp(),
          modelUsed: "Shahzaman-Neural-Engine",
        });
      } catch (fbErr) {
        console.warn("Firestore logging skipped:", fbErr);
      }

    } catch (err) {
      console.error("Groq Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: " + (err.message || "Failed to fetch response") + ". Direct WhatsApp: +923241736180",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const faqs = [
    {
      q: "What do you build with?",
      a: "I build with n8n, GoHighLevel, AI voice helpers (Vapi and Retell), React websites, Python, and lead-finding tools (Apollo, Dripify, Bright Data)."
    },
    {
      q: "Do you build websites too, or only automations?",
      a: "Both. I build full websites — like the A2Z FIX school site and the Decoria online shop — with the smart systems behind them."
    },
    {
      q: "How much does it cost?",
      a: "One system starts at Rs. 10,000. A full system for your whole business gets a custom price — we talk first, then I quote."
    },
    {
      q: "Can your voice helper work with my customer list?",
      a: "Yes. The voice helper can book appointments, update your customer list, and send follow-up messages by itself."
    },
    {
      q: "What happens if something breaks?",
      a: "Every system has safety checks. If something fails, it tries again — and you get an alert on WhatsApp or email, so nothing fails quietly."
    }
  ];

  return (
    <div
      ref={containerRef}
      className="text-slate-200 min-h-screen flex flex-col justify-between selection:bg-[#ff2a2a] selection:text-slate-900 bg-[#0a0a0a] font-sans overflow-x-hidden"
    >
      {/* Starfield — twinkling stars + shooting stars behind the whole site */}
      <Starfield />

      {/* Floating Circular AI Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Open AI Assistant"
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-neon-600 via-neon-500 to-neon-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(255, 42, 42,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(255, 42, 42,0.6)]"
        >
          {isChatOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-.986 4.453 4.453 0 00.75-2.023C3.805 16.38 3 14.28 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          )}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neon-400 rounded-full border-2 border-slate-950"></span>
        </button>
      </div>

      {/* AI Assistant Interactive Drawer Modal */}
      {isChatOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[min(540px,85vh)] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-neon-500/40 rounded-2xl shadow-[0_0_50px_rgba(255, 42, 42,0.25)] z-50 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-400 animate-ping"></div>
              <div>
                <h3 className="font-heading font-normal text-white text-sm">Shahzaman's AI Helper</h3>
                <span className="text-[10px] text-neon-400 font-mono">
                  Ask me anything
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white text-lg font-bold p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] p-3.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-neon-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:text-neon-300 [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-700 [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-900/80 [&_th]:p-1.5 [&_th]:text-left [&_th]:text-neon-400 [&_td]:border [&_td]:border-slate-700 [&_td]:p-1.5 [&_code]:bg-slate-950 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-neon-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 text-neon-400 border border-slate-700 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Dynamic WhatsApp Escalation Quick Action */}
          {(() => {
            const lastUserMsg = messages
              .slice()
              .reverse()
              .find((m) => m.role === "user")?.content;

            const prefillQuery = lastUserMsg
              ? `Hi Shahzaman, I chatted with your AI about ${lastUserMsg.slice(0, 90).trim()}`
              : "Hi Shahzaman, I chatted with your AI about building a smart system for my business";

            const whatsappUrl = `https://wa.me/923241736180?text=${encodeURIComponent(prefillQuery)}`;

            return (
              <div className="px-3.5 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-pulse shrink-0"></span>
                  <span className="truncate">Want a price for your work?</span>
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-neon-500/10 hover:bg-neon-500/20 text-neon-400 border border-neon-500/30 hover:border-neon-500/60 px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 hover:scale-105"
                  title="Open WhatsApp chat with prefilled context"
                >
                  <span>WhatsApp Brief →</span>
                </a>
              </div>
            );
          })()}

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask what he builds, what it costs, or about his work..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-neon-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-neon-500 hover:bg-neon-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Header — floating pill nav, centred at the top (reference video) */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl px-5 py-3 flex justify-between items-center rounded-full border border-slate-800/80 bg-slate-950 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="font-heading text-xl font-normal tracking-tight text-white flex items-center gap-2">
          <span>Shahzaman</span>
          <span className="w-2 h-2 rounded-full bg-neon-400 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-neon-500/10 hover:bg-neon-500/20 text-xs font-semibold tracking-wide text-neon-400 uppercase px-4 py-2 rounded-lg border border-neon-500/30 hover:border-neon-500/60 transition-all duration-300 shadow-[0_0_20px_rgba(255, 42, 42,0.15)] hover:shadow-[0_0_30px_rgba(255, 42, 42,0.3)]"
          >
            LinkedIn
          </a>
          <a
            href="https://wa.me/923241736180"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-neon-500 hover:bg-neon-400 text-slate-950 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(255, 42, 42,0.2)] hover:shadow-[0_0_35px_rgba(255, 42, 42,0.5)]"
          >
            Book a Call
          </a>
        </div>
      </header>

      {/* Spacer for the fixed floating nav */}
      <div className="h-[76px] shrink-0" aria-hidden="true" />

      {/* Kinetic Hero — approved Nov 5, 2026 (dark luxury, neon #ff2a2a) */}
      <KineticHero />

      {/* Metrics Bar — red accent */}
      <section className="metrics-bar border-y border-slate-800/60 bg-slate-900/40 backdrop-blur-md gsap-reveal opacity-0 translate-y-10">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-wrap justify-center sm:justify-between gap-6 text-center">
          <div className="metric-item hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-normal text-white drop-shadow-[0_0_6px_rgba(255, 42, 42,0.25)]">29+</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Smart Systems Built</div>
          </div>
          <div className="metric-item hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-normal text-neon-400 drop-shadow-[0_0_6px_rgba(255, 42, 42,0.25)]">n8n + GHL</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Main Tools</div>
          </div>
          <div className="metric-item hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-normal text-neon-400 drop-shadow-[0_0_6px_rgba(255, 42, 42,0.25)]">Voice AI</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Voice Calls &amp; Leads</div>
          </div>
          <div className="metric-item hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-normal text-neon-400 drop-shadow-[0_0_6px_rgba(255, 42, 42,0.25)]">Triple Certified</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Certificates</div>
          </div>
        </div>
      </section>

      {/* Featured Architecture & Live Web Applications */}
      <section id="portfolio" className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="section-label"><b>01</b> Selected Work</div>
          <h2 className="section-title text-3xl md:text-5xl text-white">Websites &amp; Systems That Work for You</h2>
          <p className="text-slate-400 text-sm max-w-md">Real websites and smart systems, built for real clients.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: A2Z FIX */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-neon-400 tracking-wider font-bold">LIVE WEBSITE</div>
                <h4 className="font-heading text-white font-normal text-xl group-hover:text-neon-300 transition-colors">
                  A2Z FIX - Mobile Repairing Institute
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A website for a chip-level mobile repair school in Multan — course details, certificate checks, and a sign-up form for new students.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://a2zfix.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  Visit the live website →
                </a>
                <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded">a2zfix.vercel.app</span>
              </div>
            </div>
          </div>

          {/* Card: Decoria Store */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-neon-400 tracking-wider font-bold">ONLINE SHOP</div>
                <h4 className="font-heading text-white font-normal text-xl group-hover:text-neon-300 transition-colors">
                  Decoria Store - Home Decor &amp; Cosmetics
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  An online shop for home decor and cosmetics — browse products, filter by category, and buy in a few clicks.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://decoria-store.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  Visit the live website →
                </a>
                <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded">decoria-store.vercel.app</span>
              </div>
            </div>
          </div>

          {/* Card: YouTube Data Extraction */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-neon-400 tracking-wider font-bold">FINDS NEW CUSTOMERS</div>
                <h4 className="font-heading text-white font-normal text-xl group-hover:text-neon-300 transition-colors">
                  YouTube Lead Finder
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Finds new customers from YouTube videos by itself and saves their details — no manual searching.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20show%20me%20the%20YouTube%20Lead%20Finder"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  See how it works →
                </a>
                <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded">Automatic system</span>
              </div>
            </div>
          </div>

          {/* Card: AI Sales Closer */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-neon-400 tracking-wider font-bold">SALES HELPER</div>
                <h4 className="font-heading text-white font-normal text-xl group-hover:text-neon-300 transition-colors">
                  AI Sales Helper
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a new lead comes in, the system replies at once, updates your customer list, and lets you know.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20show%20me%20the%20AI%20Sales%20Helper"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  See how it works →
                </a>
                <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded">Automatic system</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEPARATE SECTION: Verified Certifications & Technical Credentials */}
      <section id="certificates" className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="section-label"><b>02</b> Recognition</div>
          <h2 className="section-title text-3xl md:text-5xl text-white">My Certificates</h2>
          <p className="text-slate-400 text-sm max-w-md">Official certificates that prove my skills — in AI, automation, and research.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Anthropic Certificate Card */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-neon-400 font-bold uppercase tracking-wider">Anthropic Academy</span>
                  <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded border border-neon-500/30">Verified</span>
                </div>
                <h3 className="font-heading text-xl font-normal text-white group-hover:text-neon-300 transition-colors">
                  Anthropic Certified AI Engineer
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A certificate from Anthropic, the makers of Claude AI, for building AI assistants that answer customers and use tools.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://drive.google.com/file/d/1kcRNXkWHvI8shllJCkw7EQ2J56low8jE/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  View Official Certificate ↗
                </a>
                <span className="text-[10px] font-mono text-slate-500">ID: ANTH-AI-8291</span>
              </div>
            </div>
          </div>

          {/* DataCrumbs Certificate Card */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-neon-400 font-bold uppercase tracking-wider">DataCrumbs</span>
                  <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded border border-neon-500/30">Verified</span>
                </div>
                <h3 className="font-heading text-xl font-normal text-white group-hover:text-neon-300 transition-colors">
                  DataCrumbs N8N Chatbot Lab Masterclass
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A certificate for building smart chatbots that talk to customers, answer questions, and take bookings on their own.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://drive.google.com/file/d/1bwGK-6CXdQqXbxBsav7jC4HE-Q0onIZ3/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  View Official Certificate ↗
                </a>
                <span className="text-[10px] font-mono text-slate-500">ID: DC-N8N-4190</span>
              </div>
            </div>
          </div>

          {/* University of London Certificate Card */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-neon-400 font-bold uppercase tracking-wider">University of London &amp; SOAS</span>
                  <span className="text-[10px] font-mono bg-neon-500/10 text-neon-400 px-2.5 py-1 rounded border border-neon-500/30">Verified</span>
                </div>
                <h3 className="font-heading text-xl font-normal text-white group-hover:text-neon-300 transition-colors">
                  Understanding Research Methods
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A certificate in research methods from the University of London and SOAS — finished in October 2026 on Coursera.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://drive.google.com/file/d/1KLbBwI9GSOHqScwo6HCUX7MNY2bBct4b/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-neon-400 hover:text-neon-300 transition-colors"
                >
                  View Official Certificate ↗
                </a>
                <span className="text-[10px] font-mono text-slate-500">ID: W4F27I336ZHS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Society Memberships Bar */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Automation Community Member</div>
              <div className="text-[11px] text-slate-400">I help other builders in the automation community.</div>
            </div>
            <span className="text-neon-400 text-xs font-mono font-bold">Active Member</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">AI Builders' Group</div>
              <div className="text-[11px] text-slate-400">I build smart systems and share what I learn.</div>
            </div>
            <span className="text-neon-400 text-xs font-mono font-bold">Peer Verified</span>
          </div>
        </div>
      </section>

      {/* Video Breakdowns & Architecture Walkthroughs */}
      <VideoBreakdowns videos={videos} />

      {/* Enterprise System Architecture Topology */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="section-label"><b>04</b> Behind the Frames</div>
          <h2 className="section-title text-3xl md:text-5xl text-white">How My Systems Work for You</h2>
          <p className="text-slate-400 text-sm max-w-lg">Your leads come in, the system replies and follows up — all on its own.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-neon-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-500/10 rounded-full blur-2xl group-hover:bg-neon-500/20 transition-all"></div>
            <div className="text-neon-400 font-mono text-sm font-bold mb-2">01. NEW LEAD COMES IN</div>
            <h4 className="text-white font-semibold text-base mb-2">Leads from anywhere</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              New leads come in from Facebook ads, your website, or anywhere else. The system checks each one and saves it.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-neon-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-500/10 rounded-full blur-2xl group-hover:bg-neon-500/20 transition-all"></div>
            <div className="text-neon-400 font-mono text-sm font-bold mb-2">02. THE SYSTEM READS &amp; DECIDES</div>
            <h4 className="text-white font-semibold text-base mb-2">A smart reply, ready in seconds</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              The AI reads what the customer wants, checks their details, and writes a personal reply.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-neon-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-500/10 rounded-full blur-2xl group-hover:bg-neon-500/20 transition-all"></div>
            <div className="text-neon-400 font-mono text-sm font-bold mb-2">03. FOLLOW-UP, DONE FOR YOU</div>
            <h4 className="text-white font-semibold text-base mb-2">Your customer list, always up to date</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your customer list updates by itself, calls go out on time, and you get a WhatsApp message if anything needs you.
            </p>
          </div>
        </div>

        {/* Interactive Live Automation Node Pipeline Visualizer */}
        <div className="mt-10">
          <WorkflowPipelineVisualizer />
        </div>

        {/* 4-step build process — part of Behind the Frames */}
        <div className="space-y-2 mt-12">
          <h3 className="section-title text-2xl md:text-3xl text-white">How I Build It for You</h3>
          <p className="text-slate-400 text-sm max-w-md">A clear, step-by-step way of working — so your system works from day one.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-neon-500/40 transition-colors">
            <div className="text-xs font-mono text-neon-400 font-bold">STEP 01</div>
            <h4 className="text-white font-semibold text-base">Understand your work</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              We look at where your customers come from, what you do by hand today, and what the system should do for you.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-neon-500/40 transition-colors">
            <div className="text-xs font-mono text-neon-400 font-bold">STEP 02</div>
            <h4 className="text-white font-semibold text-base">Build the system</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              I build the automations, connect your tools, and set up the AI replies.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-neon-500/40 transition-colors">
            <div className="text-xs font-mono text-neon-400 font-bold">STEP 03</div>
            <h4 className="text-white font-semibold text-base">Test everything</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              We test busy days, odd cases, and what happens if something fails — so nothing breaks quietly.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-neon-500/40 transition-colors">
            <div className="text-xs font-mono text-neon-400 font-bold">STEP 04</div>
            <h4 className="text-white font-semibold text-base">Go live</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your system goes live, you get a simple guide, and I stay in touch if you need help.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Stack — red glow */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="section-label"><b>SKILLS</b> My Tools</div>
          <h2 className="section-title text-3xl md:text-4xl text-white">Tools I Use</h2>
          <p className="text-slate-400 text-sm max-w-md">The tools I use to build your system.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-neon-400 uppercase tracking-wider font-bold">Automation</div>
                <h4 className="text-white font-semibold text-base group-hover:text-neon-300 transition-colors">n8n &amp; GoHighLevel</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Connects your apps so work moves by itself — leads, messages, and bookings, all in one flow.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-neon-400 uppercase tracking-wider font-bold">Voice Calls</div>
                <h4 className="text-white font-semibold text-base group-hover:text-neon-300 transition-colors">Retell AI &amp; Vapi</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  AI voice helpers that answer calls, book appointments, and update your customer list.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-neon-400 uppercase tracking-wider font-bold">Finding Customers</div>
                <h4 className="text-white font-semibold text-base group-hover:text-neon-300 transition-colors">Apollo, Dripify &amp; Bright Data</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Finds new customers for you and reaches out to them on LinkedIn — automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-neon-400 uppercase tracking-wider font-bold">Websites &amp; Apps</div>
                <h4 className="text-white font-semibold text-base group-hover:text-neon-300 transition-colors">React / Vite / Python / APIs</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Custom websites and apps, built to fit your business exactly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 / The Journey — milestones from his own shipped work */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="section-label"><b>05</b> The Journey</div>
          <h2 className="section-title text-3xl md:text-5xl text-white">The Journey So Far</h2>
          <p className="text-slate-400 text-sm max-w-lg">Every project and client that built this portfolio.</p>
        </div>

        <div className="relative pl-8 md:pl-10 space-y-10 before:absolute before:left-[7px] md:before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-neon-500 before:via-slate-700 before:to-transparent">
          {[
            { step: "01", title: "The First Build — A2Z FIX", text: "A live website for a mobile repair school in Multan — courses, certificate checks, and student sign-ups." },
            { step: "02", title: "The Store — Decoria Store", text: "A live online shop for home decor and cosmetics — products, categories, and easy checkout." },
            { step: "03", title: "The Finder — YouTube Leads", text: "A system that finds new customers from YouTube by itself — in minutes, not hours." },
            { step: "04", title: "The Helper — AI Sales Replies", text: "New leads get a smart reply at once, and your customer list updates by itself." },
            { step: "05", title: "The Proof — Triple Certified", text: "Certificates from Anthropic, DataCrumbs, and the University of London & SOAS (Oct 2026)." },
          ].map((m) => (
            <div key={m.step} className="relative">
              <span className="absolute -left-8 md:-left-10 top-1 w-[15px] h-[15px] md:w-[19px] md:h-[19px] rounded-full bg-neon-500 shadow-[0_0_16px_rgba(255,42,42,0.7)] ring-4 ring-[#0a0a0a]"></span>
              <div className="text-xs font-mono text-neon-400 font-bold tracking-widest">{m.step}</div>
              <h3 className="font-heading text-lg md:text-xl font-normal text-white mt-1">{m.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mt-1">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4 space-y-3">
            <div className="section-label"><b>ABOUT</b> Me</div>
            <h2 className="section-title text-3xl md:text-4xl text-white">About Me</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-500/10 border border-neon-500/20 text-neon-400 text-xs font-medium w-full">
              Anthropic Academy Certified
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-500/10 border border-neon-500/20 text-neon-400 text-xs font-medium w-full">
              N8N Chatbot Lab Graduate
            </div>
          </div>
          <div className="md:col-span-8 space-y-4 text-slate-400 text-sm md:text-base leading-relaxed">
            <p>
              I am Shahzaman Iqbal, from Multan, Pakistan. I build smart systems for businesses — I connect your apps, your customer list, and your messages, so the repeat work happens by itself, reliably, day after day.
            </p>
            <p>
              Whether you need new customers (Apollo, Dripify), clean data (Bright Data), or a voice helper that talks to customers (Retell AI, Vapi), I bring it all together in one system that just works.
            </p>
            <p>
              Everything I build has safety checks — so if something goes wrong, it fails safely and you get told.
            </p>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="max-w-6xl w-full mx-auto px-6 py-12 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-[0_0_30px_rgba(2,6,23,0.8)]">
          <div>
            <h3 className="font-heading text-white font-normal text-lg">Find Me Online</h3>
            <p className="text-slate-400 text-xs mt-1">Short videos and posts about the systems I build.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.youtube.com/@shahzamaniqbal-v8n"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-neon-500/10 border border-neon-500/20 hover:border-neon-500/70 hover:shadow-[0_0_20px_rgba(255, 42, 42,0.4)] text-neon-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              YouTube
            </a>
            <a
              href="https://www.instagram.com/n8n_developer/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-neon-500/10 border border-neon-500/20 hover:border-neon-500/70 hover:shadow-[0_0_20px_rgba(255, 42, 42,0.4)] text-neon-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@n8ndeveloper"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-neon-500/10 border border-neon-500/20 hover:border-neon-500/70 hover:shadow-[0_0_20px_rgba(255, 42, 42,0.4)] text-neon-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              TikTok
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61578748077131"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-neon-500/10 border border-neon-500/20 hover:border-neon-500/70 hover:shadow-[0_0_20px_rgba(255, 42, 42,0.4)] text-neon-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              Facebook
            </a>
            <a
              href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-neon-500/10 border border-neon-500/20 hover:border-neon-500/70 hover:shadow-[0_0_20px_rgba(255, 42, 42,0.4)] text-neon-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Agency ROI & Automation Cost Calculator */}
      <RoiCalculator />

      {/* Engagement Tiers — heavy red accent */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-normal text-white">Ways to Work With Me</h2>
          <p className="text-slate-400 text-sm max-w-md">Every project is different — you get an exact price after a short chat.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative rounded-2xl transition-all duration-300">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-neon-800 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4 h-full">
              <h4 className="font-heading text-white font-normal text-lg">One System, Built for You</h4>
              <div className="text-neon-400 font-normal text-3xl font-heading">
                Rs. 10,000 <span className="text-xs text-slate-500 font-normal font-sans">starting</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed flex-grow">
                One automation or AI helper — for example, a WhatsApp reply system or a lead-finding system.
              </p>
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20interested%20in%20one%20system%2C%20built%20for%20me"
                target="_blank"
                rel="noreferrer"
                className="text-center bg-slate-800 hover:bg-neon-500 hover:text-slate-950 text-white text-xs font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Get Started
              </a>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500 to-neon-600 rounded-2xl blur opacity-40 group-hover:opacity-80 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/95 border border-neon-500/50 flex flex-col gap-4 h-full shadow-[0_0_35px_rgba(255, 42, 42,0.15)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-500 to-neon-500 text-slate-950 text-[10px] font-bold uppercase px-3.5 py-1 rounded-full shadow-[0_0_15px_rgba(255, 42, 42,0.6)]">
                For Growing Businesses
              </div>
              <h4 className="font-heading text-white font-normal text-lg mt-2">Your Whole System, Done for You</h4>
              <div className="text-neon-400 font-normal text-3xl font-heading">Custom Quote</div>
              <p className="text-slate-400 text-xs leading-relaxed flex-grow">
                Everything connected — your website, customer list, AI replies, and voice calls — built and set up end to end.
              </p>
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20interested%20in%20my%20whole%20system%2C%20done%20for%20you"
                target="_blank"
                rel="noreferrer"
                className="text-center bg-neon-500 hover:bg-neon-400 text-slate-950 text-xs font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255, 42, 42,0.3)] hover:shadow-[0_0_35px_rgba(255, 42, 42,0.6)]"
              >
                Ask for a Price
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-normal text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm max-w-md">Short answers to the questions I hear most.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-800/80 rounded-xl bg-slate-900/30 hover:border-neon-500/30 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4.5 text-left flex justify-between items-center text-sm font-semibold text-white hover:text-neon-400 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-neon-400 text-lg font-mono">{openFaq === index ? "−" : "+"}</span>
              </button>
              {openFaq === index && (
                <div className="p-4.5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Direct Contact Call to Action */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 text-center gsap-reveal opacity-0 translate-y-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-500 via-neon-600 to-neon-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
          <div className="relative bg-slate-950 border border-neon-500/40 p-8 sm:p-14 rounded-3xl space-y-6 shadow-2xl">
            <h2 className="font-heading text-3xl md:text-5xl font-normal text-white">
              Want Your Boring Work Done for You?
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Tell me about your work — I'll look at how you do things today and show you what a smart system could do.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20ready%20to%20build%20a%20smart%20system"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-neon-500 hover:bg-neon-400 text-slate-950 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(255, 42, 42,0.4)] hover:scale-105"
              >
                Start Conversation on WhatsApp →
              </a>
              <a
                href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-neon-500/50 text-white text-sm font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-800/60 text-xs text-slate-500">
        <div
          onClick={handleCopyrightClick}
          className="cursor-pointer select-none transition-colors hover:text-neon-400 active:scale-95"
          title="© 2026 Shahzaman Iqbal"
        >
          &copy; 2026 Shahzaman Iqbal. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="https://wa.me/923241736180" className="hover:text-neon-400 transition-colors">WhatsApp</a>
          <a href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a" className="hover:text-neon-400 transition-colors">LinkedIn</a>
          <a href="https://www.youtube.com/@shahzamaniqbal-v8n" className="hover:text-neon-400 transition-colors">YouTube</a>
          <a href="https://www.instagram.com/n8n_developer/?hl=en" className="hover:text-neon-400 transition-colors">Instagram</a>
        </div>
      </footer>

      {/* Hidden Triple-Click Admin Manager Modal */}
      {isAdminModalOpen && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          db={db}
          videos={videos}
          onSeedDefaults={handleSeedDefaults}
        />
      )}
    </div>
  );
}