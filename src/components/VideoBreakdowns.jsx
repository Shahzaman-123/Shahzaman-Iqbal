import { useState, useMemo } from "react";
import { parseYouTubeUrl } from "../utils/youtube";
import { DEFAULT_VIDEOS } from "../constants/videos";

export default function VideoBreakdowns({ videos = [] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTimestamps, setActiveTimestamps] = useState({});

  const displayVideos = videos && videos.length > 0 ? videos : DEFAULT_VIDEOS;

  // Filter categories available
  const filterCategories = [
    "All",
    "Voice Calls",
    "Automations",
    "Smart Helpers",
    "Websites",
  ];

  const filteredVideos = useMemo(() => {
    if (activeCategory === "All") return displayVideos;

    return displayVideos.filter((vid) => {
      const cat = (vid.category || "").toLowerCase();
      if (activeCategory === "Voice Calls") return cat.includes("voice");
      if (activeCategory === "Automations") return cat.includes("n8n");
      if (activeCategory === "Smart Helpers") return cat.includes("agent") || cat.includes("autonomous");
      if (activeCategory === "Websites") return cat.includes("web") || cat.includes("app");
      return cat.includes(activeCategory.toLowerCase());
    });
  }, [displayVideos, activeCategory]);

  const handleTimestampClick = (videoId, seconds) => {
    setActiveTimestamps((prev) => ({
      ...prev,
      [videoId]: seconds,
    }));
  };

  return (
    <section
      id="video-breakdowns"
      className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="section-label"><b>03</b> From Raw to Real</div>
          <h2 className="section-title text-3xl md:text-5xl text-white">
            Watch How It Works
          </h2>
          <p className="text-slate-400 text-sm max-w-lg">
            Short videos that show real systems working — step by step.
          </p>
        </div>

        {/* Interactive Filter Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {filterCategories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? "bg-neon-500/20 border-neon-400 text-neon-300 shadow-[0_0_20px_rgba(255, 42, 42,0.35)] font-bold scale-105"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <p className="text-slate-400 text-sm">
            No videos in this group yet.
          </p>
          <button
            onClick={() => setActiveCategory("All")}
            className="mt-3 text-xs text-neon-400 hover:underline font-mono"
          >
            Show all videos ({displayVideos.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredVideos.map((video) => {
            const { videoId, embedUrl, watchUrl } = parseYouTubeUrl(video.url);
            const currentSeconds = activeTimestamps[video.id];
            
            // Build embed URL with start timestamp & autoplay if clicked
            let finalEmbedUrl = embedUrl;
            if (embedUrl && currentSeconds != null) {
              finalEmbedUrl = `${embedUrl}?start=${currentSeconds}&autoplay=1`;
            }

            return (
              <div
                key={video.id || video.url}
                className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-500/30 via-neon-600/30 to-neon-600/30 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>

                <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 group-hover:border-neon-500/50 flex flex-col justify-between h-full gap-5">
                  {/* 16:9 Responsive Aspect Ratio Video Embed Container */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 relative shadow-inner">
                    {finalEmbedUrl ? (
                      <iframe
                        src={finalEmbedUrl}
                        title={video.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                        <span>Video didn't load</span>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neon-400 hover:underline mt-2"
                        >
                          Open Video Link ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neon-400 bg-neon-500/10 px-2.5 py-1 rounded-md border border-neon-500/30">
                          {video.category || "Smart System"}
                        </span>
                        {videoId && (
                          <span className="text-[10px] font-mono text-slate-500">
                            ID: {videoId}
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading text-lg md:text-xl font-normal text-white group-hover:text-neon-300 transition-colors">
                        {video.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {video.description}
                      </p>

                      {/* Timestamp Quick-Links */}
                      {video.timestamps && video.timestamps.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/50 space-y-1.5">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-400 inline-block"></span>
                            Chapters:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {video.timestamps.map((ts, idx) => {
                              const isJumpActive = currentSeconds === ts.seconds;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleTimestampClick(video.id, ts.seconds)}
                                  className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all duration-200 border flex items-center gap-1 ${
                                    isJumpActive
                                      ? "bg-neon-500 text-slate-950 font-bold border-neon-300 shadow-[0_0_15px_rgba(255, 42, 42,0.5)]"
                                      : "bg-slate-950/80 text-neon-400 border-neon-500/20 hover:border-neon-500/60 hover:bg-neon-500/10"
                                  }`}
                                  title={`Seek video to ${ts.label}`}
                                >
                                  <span>▶</span>
                                  <span>{ts.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Link to Watch on YouTube */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <a
                        href={watchUrl || video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-neon-400 hover:text-neon-300 transition-all hover:translate-x-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-neon-500"
                        >
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                        Watch on YouTube ↗
                      </a>

                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                        1080p HD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
