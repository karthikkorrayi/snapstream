import { useState, useRef, useCallback } from "react";
import {
  Download, Clipboard, X, AlertCircle, Music, Video,
  Zap, Globe, ChevronDown, CheckCircle2, ArrowLeft,
} from "lucide-react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const COBALT_API_BASE = "https://my-cobalt-api-4azx.onrender.com";
const RAPIDAPI_KEY = "cf79547581msha0ad8b7e56b0853p14f5d2jsne4cc2f72237e";
const RAPIDAPI_YT_HOST = "youtube-audio-video-download.p.rapidapi.com";

const QUALITY_OPTIONS = [
  { label: "Best Quality", value: "max" },
  { label: "1080p", value: "1080" },
  { label: "720p", value: "720" },
  { label: "480p", value: "480" },
  { label: "360p", value: "360" },
];

const AUDIO_FORMAT_OPTIONS = [
  { label: "MP3", value: "mp3" },
  { label: "M4A (Best)", value: "best" },
  { label: "WAV", value: "wav" },
  { label: "OGG", value: "ogg" },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────
function detectPlatform(url) {
  if (!url) return "generic";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  return "generic";
}

function platformLabel(platform) {
  const map = {
    youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
    tiktok: "TikTok", twitter: "X / Twitter", generic: "Web",
  };
  return map[platform] || "Web";
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── INLINE SVG BRAND ICONS ────────────────────────────────────────────────
function YoutubeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}
function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}
function TwitterXIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function PlatformIcon({ platform, size = 20 }) {
  const cls = size === 20 ? "w-5 h-5" : "w-4 h-4";
  if (platform === "youtube") return <YoutubeIcon className={cls} />;
  if (platform === "instagram") return <InstagramIcon className={cls} />;
  if (platform === "tiktok") return <TikTokIcon className={cls} />;
  if (platform === "twitter") return <TwitterXIcon className={cls} />;
  if (platform === "facebook") return <FacebookIcon className={cls} />;
  return <Globe className={cls} />;
}

// ─── API CALLS ─────────────────────────────────────────────────────────────

// YouTube via RapidAPI
// async function fetchYouTubeMedia({ url, videoQuality, isAudioOnly }) {
//   const videoId = extractYouTubeId(url);
//   if (!videoId) throw new Error("Could not extract YouTube video ID from this link.");

//   if (isAudioOnly) {
//     // Audio endpoint
//     const response = await fetch(
//       `https://${RAPIDAPI_YT_HOST}/audio?id=${videoId}&ext=mp3`,
//       {
//         method: "GET",
//         headers: {
//           "x-rapidapi-key": RAPIDAPI_KEY,
//           "x-rapidapi-host": RAPIDAPI_YT_HOST,
//         },
//         signal: AbortSignal.timeout(60000),
//       }
//     );
//     if (!response.ok) throw new Error(`rapidapi_${response.status}`);
//     const data = await response.json();
//     // Returns { url: "...", ... }
//     if (!data.url) throw new Error("No audio URL returned from YouTube API.");
//     return { status: "stream", url: data.url };
//   } else {
//     // Video endpoint — get available formats
//     const qualityMap = { max: "1080", "1080": "1080", "720": "720", "480": "480", "360": "360" };
//     const q = qualityMap[videoQuality] || "720";
//     const response = await fetch(
//       `https://${RAPIDAPI_YT_HOST}/video?id=${videoId}&ext=mp4&quality=${q}`,
//       {
//         method: "GET",
//         headers: {
//           "x-rapidapi-key": RAPIDAPI_KEY,
//           "x-rapidapi-host": RAPIDAPI_YT_HOST,
//         },
//         signal: AbortSignal.timeout(60000),
//       }
//     );
//     if (!response.ok) throw new Error(`rapidapi_${response.status}`);
//     const data = await response.json();
//     if (!data.url) throw new Error("No video URL returned from YouTube API.");
//     return { status: "stream", url: data.url };
//   }
// }

async function fetchYouTubeMedia({ url, isAudioOnly }) {
  const encodedUrl = encodeURIComponent(url);

  const response = await fetch(
    `https://youtube-audio-video-download.p.rapidapi.com/geturl?video_url=${encodedUrl}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_YT_HOST,
      },
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) throw new Error(`rapidapi_${response.status}`);
  const data = await response.json();

  // API returns { video_url: "...", audio_url: "..." }
  const downloadUrl = isAudioOnly ? data.audio_url : data.video_url;
  if (!downloadUrl) throw new Error("No URL returned from YouTube API.");

  return { status: "stream", url: downloadUrl };
}

// Everything else via Cobalt on Render
async function fetchCobaltMedia({ url, videoQuality, audioFormat, isAudioOnly }) {
  const payload = {
    url,
    videoQuality,
    audioFormat,
    filenameStyle: "pretty",
    downloadMode: isAudioOnly ? "audio" : "auto",
    youtubeVideoCodec: "h264",
  };
  const response = await fetch(`${COBALT_API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.code || `http_${response.status}`);
  }
  const data = await response.json();
  if (data.status === "error") throw new Error(data.error?.code || "unknown");
  return data;
}

// Router — picks the right API based on platform
async function fetchMedia({ url, videoQuality, audioFormat, isAudioOnly }) {
  const platform = detectPlatform(url);
  if (platform === "youtube") {
    return fetchYouTubeMedia({ url, videoQuality, isAudioOnly });
  }
  return fetchCobaltMedia({ url, videoQuality, audioFormat, isAudioOnly });
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-300">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-800">
        Snap<span className="text-violet-600">Stream</span>
      </span>
    </div>
  );
}

function StatusMessage({ step }) {
  const steps = ["Analyzing link…", "Connecting to stream engine…", "Resolving media metadata…", "Almost there…"];
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-2 border-slate-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-violet-500 border-r-violet-400 border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Download className="w-4 h-4 text-violet-500" />
          </div>
        </div>
      </div>
      <p className="text-sm text-violet-600 font-medium animate-pulse">{steps[step % steps.length]}</p>
    </div>
  );
}

function QualitySelect({ options, value, onChange, label }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent cursor-pointer transition-all shadow-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function PickerResult({ items, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select a stream</p>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.url)}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-all text-left group"
          >
            {item.thumb && (
              <img src={item.thumb} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" onError={(e) => (e.target.style.display = "none")} />
            )}
            <span className="text-sm text-slate-700 group-hover:text-slate-900 truncate">{item.type || `Stream ${i + 1}`}</span>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-violet-500 ml-auto flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function SnapStream() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("video");
  const [videoQuality, setVideoQuality] = useState("max");
  const [audioFormat, setAudioFormat] = useState("mp3");
  const [appState, setAppState] = useState("idle");
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [downloadStarted, setDownloadStarted] = useState(false);
  const stepTimerRef = useRef(null);

  const platform = detectPlatform(url);

  const startLoadingSteps = useCallback(() => {
    setLoadStep(0);
    let step = 0;
    stepTimerRef.current = setInterval(() => { step += 1; setLoadStep(step); }, 1800);
  }, []);

  const stopLoadingSteps = useCallback(() => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {}
  };

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setAppState("loading");
    setError("");
    setResult(null);
    setDownloadStarted(false);
    startLoadingSteps();

    try {
      const data = await fetchMedia({
        url: trimmed,
        videoQuality,
        audioFormat,
        isAudioOnly: mode === "audio",
      });
      stopLoadingSteps();
      setResult(data);
      setAppState("result");
    } catch (err) {
      stopLoadingSteps();
      let msg = err.message || "Something went wrong.";

      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
        msg = "Could not reach the server. It may still be waking up — wait 30 seconds and try again.";
      } else if (msg.includes("Could not extract")) {
        msg = "Could not read that YouTube link. Make sure it's a valid youtube.com or youtu.be URL.";
      } else if (msg.includes("No audio URL") || msg.includes("No video URL")) {
        msg = "YouTube returned no download link. The video may be age-restricted, private, or unavailable in your region.";
      } else if (msg.includes("rapidapi_403")) {
        msg = "RapidAPI key issue — check your subscription to the YouTube Audio Video Download API.";
      } else if (msg.includes("rapidapi_429")) {
        msg = "Monthly free limit reached on YouTube downloads. Try again next month or upgrade the RapidAPI plan.";
      } else if (msg.includes("error.link.unsupported") || msg.includes("http_400")) {
        msg = "This link isn't supported. Try YouTube, Instagram, Facebook, or TikTok.";
      } else if (msg.includes("error.link.invalid")) {
        msg = "That doesn't look like a valid video link. Double-check the URL and try again.";
      } else if (msg.includes("timeout") || msg.includes("timed out")) {
        msg = "Request timed out. Try again — it usually works on the second attempt.";
      } else if (msg.includes("http_5")) {
        msg = "The download server ran into an error. Try again in a moment.";
      }

      setError(msg);
      setAppState("error");
    }
  };

  const handleDownload = (downloadUrl) => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadStarted(true);
  };

  const handleReset = () => {
    setAppState("idle");
    setUrl("");
    setResult(null);
    setError("");
    setDownloadStarted(false);
  };

  const canFetch = url.trim().length > 8 && appState !== "loading";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/60 flex flex-col items-center justify-start px-4 py-8 font-sans">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full bg-violet-200/40 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-64 h-64 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          {appState !== "idle" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-50 border border-transparent hover:border-violet-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xl shadow-slate-200/60">

          {/* ── IDLE ── */}
          {appState === "idle" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">
                  Download Shorts, Reels,
                  <br />
                  <span className="text-violet-600">and Videos/Audios.</span>
                </h1>
              </div>

              <div className="space-y-2.5">
                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
                  <div className="pl-3.5 flex-shrink-0 text-slate-400">
                    <PlatformIcon platform={platform} />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                    placeholder="Paste YouTube, Instagram, or Facebook link…"
                    className="flex-1 bg-transparent text-slate-800 text-sm px-3 py-3.5 focus:outline-none placeholder:text-slate-400 min-w-0"
                    autoComplete="off"
                    autoCapitalize="none"
                  />
                  {url ? (
                    <button onClick={() => setUrl("")} className="pr-3.5 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={handlePaste} className="pr-3.5 flex-shrink-0 flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                      <Clipboard className="w-3.5 h-3.5" />
                      Paste
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setMode("video")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "video" ? "bg-white text-violet-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Video className="w-4 h-4" /> Video
                  </button>
                  <button
                    onClick={() => setMode("audio")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "audio" ? "bg-white text-violet-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Music className="w-4 h-4" /> Audio Only
                  </button>
                </div>

                {mode === "video" ? (
                  <QualitySelect label="Video Quality" options={QUALITY_OPTIONS} value={videoQuality} onChange={setVideoQuality} />
                ) : (
                  <QualitySelect label="Audio Format" options={AUDIO_FORMAT_OPTIONS} value={audioFormat} onChange={setAudioFormat} />
                )}
              </div>

              <button
                onClick={handleFetch}
                disabled={!canFetch}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${canFetch ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300 hover:shadow-violet-400 hover:scale-[1.02] active:scale-[0.98]" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                <Download className="w-4 h-4" />
                Fetch Media
              </button>

              <div className="space-y-1.5">
                <p className="text-center text-xs text-slate-400">Supported platforms</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[
                    { label: "YouTube", platform: "youtube" },
                    { label: "Instagram", platform: "instagram" },
                    { label: "Facebook", platform: "facebook" },
                  ].map(({ label, platform: p }) => (
                    <span key={p} className="flex items-center gap-1.5 text-xs text-slate-500 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <PlatformIcon platform={p} size={16} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING ── */}
          {appState === "loading" && (
            <div className="py-8 flex flex-col items-center gap-6">
              <StatusMessage step={loadStep} />
              <div className="w-full">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(20 + loadStep * 22, 90)}%` }} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-400 truncate max-w-xs">{url}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  <PlatformIcon platform={platform} size={16} />
                  <span className="text-xs text-slate-500">{platformLabel(platform)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {appState === "result" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">Media resolved</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                  <PlatformIcon platform={platform} size={16} />
                  <span className="text-xs text-slate-500">{platformLabel(platform)}</span>
                </div>
              </div>

              {result.status === "picker" && result.picker?.length > 0 && (
                <PickerResult items={result.picker} onSelect={handleDownload} />
              )}

              {(result.status === "stream" || result.status === "redirect" || result.status === "tunnel") && result.url && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-200">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                      {mode === "audio" ? <Music className="w-5 h-5 text-violet-600" /> : <Video className="w-5 h-5 text-violet-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{mode === "audio" ? "Audio Track Ready" : "Video Ready"}</p>
                      <p className="text-xs text-slate-500">
                        {mode === "audio" ? `Format: ${audioFormat.toUpperCase()}` : `Quality: ${videoQuality === "max" ? "Best available" : videoQuality + "p"}`}
                      </p>
                    </div>
                  </div>

                  {downloadStarted && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-emerald-700">Download started — check your browser downloads folder.</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDownload(result.url)}
                    className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300 hover:shadow-violet-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {downloadStarted ? "Download Again" : "Download to Device"}
                  </button>
                </div>
              )}

              {!["stream", "redirect", "picker", "tunnel"].includes(result.status) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">Unexpected response: <code className="font-mono">{result.status}</code></p>
                </div>
              )}

              <button onClick={handleReset} className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-violet-700 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all">
                Download another video
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {appState === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold text-red-700">Download failed</p>
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { setAppState("idle"); setError(""); }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Try Again
                </button>
                <button onClick={handleReset} className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-violet-700 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all">
                  Start over
                </button>
              </div>
              {error.includes("waking up") && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <p className="text-xs font-bold text-indigo-700">Server is sleeping 💤</p>
                  <p className="text-xs text-indigo-600 leading-relaxed">Render's free tier sleeps after 15 minutes. Wait 30–60 seconds then try again.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Powered by{" "}
          <a href="https://cobalt.tools" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-violet-600 transition-colors">KK</a>
        </p>
      </div>
    </div>
  );
}
