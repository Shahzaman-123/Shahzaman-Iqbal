/**
 * Parses various YouTube URL formats (standard, shortened, shorts, embed, or raw ID)
 * and returns standard embed, watch, and thumbnail URLs.
 */
export function parseYouTubeUrl(url) {
  if (!url || typeof url !== "string") {
    return {
      videoId: "",
      embedUrl: "",
      watchUrl: "",
      thumbnailUrl: "",
      isValid: false,
    };
  }

  const trimmed = url.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      videoId: trimmed,
      embedUrl: `https://www.youtube.com/embed/${trimmed}`,
      watchUrl: `https://www.youtube.com/watch?v=${trimmed}`,
      thumbnailUrl: `https://img.youtube.com/vi/${trimmed}/hqdefault.jpg`,
      isValid: true,
    };
  }

  // Match youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/i
  );

  if (match && match[1]) {
    const videoId = match[1];
    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      isValid: true,
    };
  }

  return {
    videoId: "",
    embedUrl: trimmed,
    watchUrl: trimmed,
    thumbnailUrl: "",
    isValid: false,
  };
}
