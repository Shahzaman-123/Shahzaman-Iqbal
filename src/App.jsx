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
        "Hello! I am Shahzaman's AI Assistant. Feel free to ask about his backend automation expertise, verified certifications, live web apps (A2Z FIX, Decoria Store), pricing tiers, or portfolio systems!",
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
      gsap.to(".hero-anim", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
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
      q: "What tools and platforms do you specialize in?",
      a: "I specialize in end-to-end backend automation using n8n, GoHighLevel (GHL), Vapi & Retell AI voice agents, REST APIs, Webhooks, React web apps, Python, and JavaScript data scrapers (Apollo, Dripify, Bright Data)."
    },
    {
      q: "Do you build complete web platforms along with backend automation?",
      a: "Yes. I engineer full-stack React web applications (such as A2Z FIX Institute and Decoria E-Commerce Store) paired with automated backend pipelines, database integrations, and CRM synchronization."
    },
    {
      q: "How does the pricing work for custom workflows vs full architecture?",
      a: "Single workflow builds start at Rs. 10,000 for focused automations or single AI agents. Full system architectures for agencies and enterprise setups are scoped via custom quotes based on complexity and integrations."
    },
    {
      q: "Can you connect AI Voice Agents to my CRM?",
      a: "Yes. I build real-time voice infrastructure (via Vapi or Retell AI) that triggers instant calendar booking, CRM pipeline updates, and SMS/Email follow-up sequences through webhook logic."
    },
    {
      q: "How do you ensure workflows don't break when APIs update?",
      a: "All workflows are engineered with comprehensive error branches, retry nodes, payload normalization, and automatic alerting (via Telegram, WhatsApp, or SMTP) to prevent silent failures."
    }
  ];

  return (
    <div
      ref={containerRef}
      className="text-slate-200 min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-900 bg-[#020617] font-sans overflow-x-hidden"
    >
      {/* Floating Circular AI Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Open AI Assistant"
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 via-cyan-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]"
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
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950"></span>
        </button>
      </div>

      {/* AI Assistant Interactive Drawer Modal */}
      {isChatOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[min(540px,85vh)] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] z-50 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
              <div>
                <h3 className="font-heading font-bold text-white text-sm">Shahzaman AI Architect</h3>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Engine · Shahzaman Neural Agent
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
                      ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:text-cyan-300 [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-700 [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-900/80 [&_th]:p-1.5 [&_th]:text-left [&_th]:text-cyan-400 [&_td]:border [&_td]:border-slate-700 [&_td]:p-1.5 [&_code]:bg-slate-950 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300">
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
                <div className="bg-slate-800/80 text-cyan-400 border border-slate-700 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  Shahzaman Architecture Core processing...
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
              : "Hi Shahzaman, I chatted with your AI about building an automated workflow";

            const whatsappUrl = `https://wa.me/923241736180?text=${encodeURIComponent(prefillQuery)}`;

            return (
              <div className="px-3.5 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate">Need a custom quote or audit?</span>
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 hover:scale-105"
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
              placeholder="Ask about n8n workflows, pricing, A2Z Fix, Decoria..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-800/60">
        <div className="font-heading text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Shahzaman</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold tracking-wide text-cyan-400 uppercase px-4 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            LinkedIn
          </a>
          <a
            href="https://wa.me/923241736180"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
          >
            Book a Call
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-14 md:py-24 flex-grow grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-8 order-2 md:order-1">
          <div className="space-y-4 hero-anim opacity-0 translate-y-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium tracking-wide uppercase shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              ⚡ Backend Automation &amp; Workflow Architect
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              I Engineer the Backend Systems Agencies Run On
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
              I design and deploy enterprise-grade n8n workflows, GoHighLevel CRM infrastructures, programmatic outbound engines, low-latency AI Voice Agents, and custom web applications.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 hero-anim opacity-0 translate-y-10">
            <a
              href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%27d%20like%20to%20discuss%20a%20backend%20automation%20project"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:-translate-y-0.5"
            >
              Book a Technical Call →
            </a>
            <button
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-sm font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:-translate-y-0.5"
            >
              Chat With AI Model
            </button>
          </div>
        </div>

        <div className="md:col-span-5 flex justify-center order-1 md:order-2 hero-anim opacity-0 translate-y-10">
          <div className="relative group">
            {/* Ambient Neon Backlight */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-75 transition duration-700"></div>
            <div className="relative w-64 h-72 md:w-80 md:h-[390px] rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl transition-all duration-300">
              <img
                src="/profile.png"
                alt="Shahzaman Iqbal"
                className="w-full h-full object-cover object-top grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </main>

      {/* Metrics Bar with Neon Accent */}
      <section className="border-y border-slate-800/60 bg-slate-900/40 backdrop-blur-md gsap-reveal opacity-0 translate-y-10">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-wrap justify-center sm:justify-between gap-6 text-center">
          <div className="hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">29+</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">AI Agents &amp; Workflows</div>
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-bold text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">n8n + GHL</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Core Architecture</div>
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-bold text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">Voice AI</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Retell · Vapi · Apollo</div>
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <div className="font-heading text-2xl md:text-3xl font-bold text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">Dual Certified</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-1">Anthropic &amp; DataCrumbs</div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="max-w-6xl w-full mx-auto px-6 py-12 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-[0_0_30px_rgba(2,6,23,0.8)]">
          <div>
            <h3 className="font-heading text-white font-bold text-lg">Connect Across All Channels</h3>
            <p className="text-slate-400 text-xs mt-1">Daily workflow automations, video breakdowns, and technical case studies.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.youtube.com/@shahzamaniqbal-v8n"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/70 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              YouTube
            </a>
            <a
              href="https://www.instagram.com/n8n_developer/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/70 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] text-pink-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@n8ndeveloper"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/70 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              TikTok
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61578748077131"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/70 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              Facebook
            </a>
            <a
              href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/70 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Technical Stack with Neon Glow Effect */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Technical Skillset &amp; Stack</h2>
          <p className="text-slate-400 text-sm max-w-md">The production-ready technologies I configure, code, and orchestrate.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-cyan-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Core Automation</div>
                <h4 className="text-white font-semibold text-base group-hover:text-cyan-300 transition-colors">n8n &amp; GoHighLevel</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Advanced workflow topologies, snapshot management, nested looping structures, and multi-channel webhook networks.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-purple-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold">Voice AI Architecture</div>
                <h4 className="text-white font-semibold text-base group-hover:text-purple-300 transition-colors">Retell AI &amp; Vapi</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deploying conversational AI voice assistants with hyper-low latency integrations, webhook triggers, and real-time CRM updates.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-amber-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">Outbound &amp; Scraped Data</div>
                <h4 className="text-white font-semibold text-base group-hover:text-amber-300 transition-colors">Apollo, Dripify &amp; Bright Data</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Automating scalable lead scraping workflows, cross-referencing targeted lead lists, and scaling automatic LinkedIn outreach systems.
                </p>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-emerald-500/50 space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">Custom Code &amp; Web Apps</div>
                <h4 className="text-white font-semibold text-base group-hover:text-emerald-300 transition-colors">React / Vite / Python / APIs</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Building responsive web applications, webhook integrations, normalization layers, and high-performance serverless endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise System Architecture Topology */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">System Blueprint</div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">How Enterprise Workflows Execute</h2>
          <p className="text-slate-400 text-sm max-w-lg">A zero-touch orchestrated backend lifecycle connecting webhooks, LLM agents, and CRM syncs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="text-cyan-400 font-mono text-sm font-bold mb-2">01. INGESTION &amp; VALIDATION</div>
            <h4 className="text-white font-semibold text-base mb-2">Multi-Channel Inbound Webhooks</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Receives incoming leads from Meta Ads, website forms, or Apollo webhooks. Executes instant schema parsing, deduplication, and HMAC security validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
            <div className="text-purple-400 font-mono text-sm font-bold mb-2">02. LLM LOGIC &amp; ENRICHMENT</div>
            <h4 className="text-white font-semibold text-base mb-2">Autonomous Agent Evaluation</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Triggers Claude / Groq AI nodes to analyze lead intent, classify budget capacity, fetch Bright Data enrichment records, and prepare personalized outbound pitches.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="text-emerald-400 font-mono text-sm font-bold mb-2">03. DISPATCH &amp; ERROR-PROOFING</div>
            <h4 className="text-white font-semibold text-base mb-2">CRM Sync &amp; Fallback Alerting</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Updates GoHighLevel pipelines in real-time, initiates voice AI outreach calls via Vapi, and routes instantaneous WhatsApp/Telegram alerts to human closers.
            </p>
          </div>
        </div>

        {/* Interactive Live Automation Node Pipeline Visualizer */}
        <div className="mt-10">
          <WorkflowPipelineVisualizer />
        </div>
      </section>

      {/* Featured Architecture & Live Web Applications */}
      <section id="portfolio" className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">Portfolio &amp; Deployments</div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Live Web Applications &amp; Enterprise Workflows</h2>
          <p className="text-slate-400 text-sm max-w-md">Real client web apps, data pipelines, and multi-agent backend systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: A2Z FIX */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-cyan-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-cyan-400 tracking-wider font-bold">LIVE WEB APP · REACT + VERCEL</div>
                <h4 className="font-heading text-white font-bold text-xl group-hover:text-cyan-300 transition-colors">
                  A2Z FIX - Mobile Repairing Institute
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A comprehensive web portal for Chip-Level Mobile Diagnostics &amp; Micro-soldering Institute in Multan. Features dynamic course syllabi, certificate verification system, and student lead capture.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://a2zfix.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Visit Live Web App →
                </a>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded">a2zfix.vercel.app</span>
              </div>
            </div>
          </div>

          {/* Card: Decoria Store */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-amber-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-amber-400 tracking-wider font-bold">LIVE E-COMMERCE · REACT + VERCEL</div>
                <h4 className="font-heading text-white font-bold text-xl group-hover:text-amber-300 transition-colors">
                  Decoria Store - Home Decor &amp; Cosmetics
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Modern e-commerce platform engineered with responsive product grids, category filtering (Organizers, Lamps, Home Decor), cart flows, and Meta Commerce catalog synchronization.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://decoria-store.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Visit Live Web App →
                </a>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded">decoria-store.vercel.app</span>
              </div>
            </div>
          </div>

          {/* Card: YouTube Data Extraction */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-purple-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-purple-400 tracking-wider font-bold">DATA PIPELINE · n8n + JAVASCRIPT</div>
                <h4 className="font-heading text-white font-bold text-xl group-hover:text-purple-300 transition-colors">
                  YouTube Lead Enrichment Pipeline
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated scraping and data normalization engine executing through n8n workflows with custom JS code blocks, cutting lead enrichment time to near-zero.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20show%20me%20the%20YouTube%20Pipeline%20case%20study"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Request Technical Blueprint →
                </a>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded">n8n Workflow</span>
              </div>
            </div>
          </div>

          {/* Card: AI Sales Closer */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-green-500/50 flex flex-col justify-between gap-4 h-full">
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-green-400 tracking-wider font-bold">CRM AUTOMATION · n8n + GHL</div>
                <h4 className="font-heading text-white font-bold text-xl group-hover:text-green-300 transition-colors">
                  AI Sales Closer + CRM Pipeline
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant lead ingestion engine connected to conversational AI nodes and real-time CRM stage transitions with dynamic alerting.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20show%20me%20the%20AI%20Sales%20Closer%20architecture"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                >
                  Request Live Architecture →
                </a>
                <span className="text-[10px] font-mono bg-green-500/10 text-green-400 px-2.5 py-1 rounded">GHL + Vapi Node</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Breakdowns & Architecture Walkthroughs */}
      <VideoBreakdowns videos={videos} />

      {/* SEPARATE SECTION: Verified Certifications & Technical Credentials */}
      <section id="certificates" className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <div className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold">Verified Credentials &amp; Societies</div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Certifications &amp; Technical Masterclasses</h2>
          <p className="text-slate-400 text-sm max-w-md">Official industry-standard certifications in LLM architecture and advanced workflow orchestration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Anthropic Certificate Card */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-amber-500/50 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Anthropic Academy</span>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/30">Verified</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Anthropic Certified AI Engineer
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Claude 101 Foundations and Building with the Claude API. Validating mastery over model context protocols (MCP), advanced prompt engineering, tool use, and enterprise-grade Claude API integrations.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://drive.google.com/file/d/1kcRNXkWHvI8shllJCkw7EQ2J56low8jE/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View Official Certificate ↗
                </a>
                <span className="text-[10px] font-mono text-slate-500">ID: ANTH-AI-8291</span>
              </div>
            </div>
          </div>

          {/* DataCrumbs Certificate Card */}
          <div className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-cyan-500/50 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">DataCrumbs</span>
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded border border-cyan-500/30">Verified</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  DataCrumbs N8N Chatbot Lab Masterclass
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Certified validation of advanced proficiency in n8n Chatbot Lab topologies, nested sub-workflows, vector embeddings, custom code execution, and fault-tolerant reporting systems.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href="https://drive.google.com/file/d/1bwGK-6CXdQqXbxBsav7jC4HE-Q0onIZ3/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View Official Certificate ↗
                </a>
                <span className="text-[10px] font-mono text-slate-500">ID: DC-N8N-4190</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Society Memberships Bar */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Open Source n8n Community Contributor</div>
              <div className="text-[11px] text-slate-400">Active member of Workflow Automation Architects &amp; Custom Nodes Developers</div>
            </div>
            <span className="text-cyan-400 text-xs font-mono font-bold">Active Member</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Full-Stack AI Automation Guild</div>
              <div className="text-[11px] text-slate-400">Certified Developer &amp; Autonomous Agent Workflow Contributor</div>
            </div>
            <span className="text-emerald-400 text-xs font-mono font-bold">Peer Verified</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4 space-y-3">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">About Me</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium w-full">
              Anthropic Academy Certified
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium w-full">
              N8N Chatbot Lab Graduate
            </div>
          </div>
          <div className="md:col-span-8 space-y-4 text-slate-400 text-sm md:text-base leading-relaxed">
            <p>
              I am Shahzaman Iqbal, a Backend Automation Engineer designing and architecting high-scale data systems for global agencies and fast-scaling brands. My expertise goes beyond basic visual nodes — I stitch custom code layers, APIs, webhooks, and database logic into reliable, fault-tolerant ecosystems.
            </p>
            <p>
              Whether your pipeline demands <b className="text-white font-semibold">Apollo</b> and <b className="text-white font-semibold">Dripify</b> for outbound prospecting, <b className="text-white font-semibold">Bright Data</b> for structured data extraction, or conversational voice engines via <b className="text-white font-semibold">Retell AI</b> and <b className="text-white font-semibold">Vapi</b>, I consolidate everything under unified <b className="text-white font-semibold">n8n</b> workflows and CRM hubs.
            </p>
            <p>
              Every configuration node and custom script is built with strict error handling and production scalability in mind.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Process Flow */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">How I Build &amp; Deploy</h2>
          <p className="text-slate-400 text-sm max-w-md">A systematic, step-by-step engineering roadmap for bulletproof backend automation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-cyan-500/40 transition-colors">
            <div className="text-xs font-mono text-cyan-400 font-bold">STEP 01</div>
            <h4 className="text-white font-semibold text-base">Discovery &amp; Topology</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Mapping data touchpoints, APIs, trigger events, error scenarios, and output endpoints into an architectural blueprint.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-purple-500/40 transition-colors">
            <div className="text-xs font-mono text-purple-400 font-bold">STEP 02</div>
            <h4 className="text-white font-semibold text-base">Workflow Engineering</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Writing custom JS/Python transformation blocks, configuring Webhooks, CRM snapshots, and AI agent logic.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-amber-500/40 transition-colors">
            <div className="text-xs font-mono text-amber-400 font-bold">STEP 03</div>
            <h4 className="text-white font-semibold text-base">Stress &amp; Edge Testing</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Running rate-limit tests, edge-case payload validation, and automatic failure fallback channels.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 hover:border-emerald-500/40 transition-colors">
            <div className="text-xs font-mono text-green-400 font-bold">STEP 04</div>
            <h4 className="text-white font-semibold text-base">Production Deployment</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Deploying live webhooks, syncing CRM databases, and handing over complete architectural documentation.
            </p>
          </div>
        </div>
      </section>

      {/* Agency ROI & Automation Cost Calculator */}
      <RoiCalculator />

      {/* Engagement Tiers with Heavy Neon Accent */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Engagement Tiers</h2>
          <p className="text-slate-400 text-sm max-w-md">Every project scope is unique; accurate quotes are provided following a discovery session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative rounded-2xl transition-all duration-300">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-cyan-800 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4 h-full">
              <h4 className="font-heading text-white font-bold text-lg">Single Workflow Build</h4>
              <div className="text-cyan-400 font-bold text-3xl font-heading">
                Rs. 10,000 <span className="text-xs text-slate-500 font-normal font-sans">starting</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed flex-grow">
                A targeted integration or standalone automated asset — such as a single n8n workflow, an autonomous AI agent, or a lead qualification pipeline.
              </p>
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20interested%20in%20a%20Single%20Workflow%20Build"
                target="_blank"
                rel="noreferrer"
                className="text-center bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white text-xs font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Get Started
              </a>
            </div>
          </div>

          <div className="group relative rounded-2xl transition-all duration-300">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-40 group-hover:opacity-80 transition duration-500"></div>
            <div className="relative p-7 rounded-2xl bg-slate-900/95 border border-cyan-500/50 flex flex-col gap-4 h-full shadow-[0_0_35px_rgba(6,182,212,0.15)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-[10px] font-bold uppercase px-3.5 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                For High-Growth Agencies
              </div>
              <h4 className="font-heading text-white font-bold text-lg mt-2">Full System Architecture</h4>
              <div className="text-cyan-400 font-bold text-3xl font-heading">Custom Quote</div>
              <p className="text-slate-400 text-xs leading-relaxed flex-grow">
                Complete multi-workflow networks, CRM orchestration, custom web portal setups, and AI voice/outreach infrastructure scoped and deployed end-to-end.
              </p>
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20interested%20in%20Full%20System%20Architecture"
                target="_blank"
                rel="noreferrer"
                className="text-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)]"
              >
                Request Architecture Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
        <div className="space-y-2 mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm max-w-md">Common queries regarding integrations, technical architecture, and turnaround times.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-800/80 rounded-xl bg-slate-900/30 hover:border-cyan-500/30 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4.5 text-left flex justify-between items-center text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-cyan-400 text-lg font-mono">{openFaq === index ? "−" : "+"}</span>
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
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
          <div className="relative bg-slate-950 border border-cyan-500/40 p-8 sm:p-14 rounded-3xl space-y-6 shadow-2xl">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white">
              Ready to Automate Your Manual Operations?
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Let’s discuss your backend requirements, audit your current workflows, and design a custom automation roadmap.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%20am%20ready%20to%20build%20an%20automation%20system"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105"
              >
                Start Conversation on WhatsApp →
              </a>
              <a
                href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-white text-sm font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:scale-105"
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
          className="cursor-pointer select-none transition-colors hover:text-cyan-400 active:scale-95"
          title="© 2026 Shahzaman Iqbal"
        >
          &copy; 2026 Shahzaman Iqbal. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="https://wa.me/923241736180" className="hover:text-cyan-400 transition-colors">WhatsApp</a>
          <a href="https://www.linkedin.com/in/shahzaman-iqbal-76172836a" className="hover:text-cyan-400 transition-colors">LinkedIn</a>
          <a href="https://www.youtube.com/@shahzamaniqbal-v8n" className="hover:text-cyan-400 transition-colors">YouTube</a>
          <a href="https://www.instagram.com/n8n_developer/?hl=en" className="hover:text-cyan-400 transition-colors">Instagram</a>
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