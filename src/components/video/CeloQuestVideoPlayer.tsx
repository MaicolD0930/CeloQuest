"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

type Labels = {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  fullscreen: string;
  exitFullscreen: string;
};

type Props = {
  src: string;
  title: string;
  labels: Labels;
  onEnded?: () => void;
  className?: string;
  /** immersive = mobile 9:16 frame; inline = embedded card */
  layout?: "inline" | "immersive";
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CeloQuestVideoPlayer({
  src,
  title,
  labels,
  onEnded,
  className = "",
  layout = "inline",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (!playing) return;
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 2800);
  }, [playing]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
    setShowControls(true);
    scheduleHideControls();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    setShowControls(true);
  }

  function handleVolumeChange(value: number) {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.min(1, Math.max(0, value));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setMuted(clamped === 0);
    setShowControls(true);
  }

  function handleSeek(value: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration)) return;
    video.currentTime = value;
    setCurrentTime(value);
    setShowControls(true);
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      const video = videoRef.current as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      video?.webkitEnterFullscreen?.();
    }
    setShowControls(true);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const immersive = layout === "immersive";

  const playerShell = (
    <>
      <video
        ref={videoRef}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
          onEnded?.();
        }}
      />

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="px-3 pb-3 pt-8">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="video-progress mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-lemon"
            aria-label="Progress"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface/90 text-h-foreground ring-1 ring-h-border transition-transform active:scale-95"
              aria-label={playing ? labels.pause : labels.play}
            >
              {playing ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
            </button>

            <span className="min-w-[4.5rem] text-xs font-bold tabular-nums text-h-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="grid size-9 place-items-center rounded-xl bg-surface/80 text-h-foreground ring-1 ring-h-border"
                aria-label={muted ? labels.unmute : labels.mute}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="hidden w-20 cursor-pointer accent-lemon sm:block"
                aria-label="Volume"
              />

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="grid size-9 place-items-center rounded-xl bg-surface/80 text-h-foreground ring-1 ring-h-border"
                aria-label={
                  isFullscreen ? labels.exitFullscreen : labels.fullscreen
                }
              >
                {isFullscreen ? (
                  <Minimize className="size-4" />
                ) : (
                  <Maximize className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!playing && currentTime === 0 && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-black/20"
          aria-label={labels.play}
        >
          <span className="grid size-16 place-items-center rounded-full bg-lemon text-h-background shadow-lg ring-4 ring-lemon/30">
            <Play className="size-7 fill-current translate-x-0.5" />
          </span>
        </button>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-white/10"
        aria-hidden
      >
        <div
          className="h-full bg-lemon transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );

  if (immersive) {
    return (
      <div
        className={`flex min-h-0 flex-1 items-center justify-center ${className}`}
        onMouseMove={() => {
          setShowControls(true);
          scheduleHideControls();
        }}
        onTouchStart={() => setShowControls(true)}
      >
        <div
          ref={containerRef}
          className="video-frame-mobile relative overflow-hidden bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          {playerShell}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video overflow-hidden rounded-2xl bg-h-background ring-1 ring-h-border ${className}`}
      onMouseMove={() => {
        setShowControls(true);
        scheduleHideControls();
      }}
      onTouchStart={() => setShowControls(true)}
    >
      {playerShell}
    </div>
  );
}
