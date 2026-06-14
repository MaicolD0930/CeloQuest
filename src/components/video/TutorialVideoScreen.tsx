"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { CeloQuestVideoPlayer } from "@/components/video/CeloQuestVideoPlayer";
import {
  getTutorialVideo,
  type TutorialVideoId,
} from "@/lib/videos/catalog";

type Labels = {
  videos: Record<string, string>;
  videoReadyTitle: string;
  createWallet: string;
  alreadyHaveWallet: string;
  close: string;
  player: {
    play: string;
    pause: string;
    mute: string;
    unmute: string;
    fullscreen: string;
    exitFullscreen: string;
  };
};

type Props = {
  videoId: TutorialVideoId;
  labels: Labels;
  onClose: () => void;
  onCreateWallet: () => void;
  onAlreadyHaveWallet: () => void;
};

export function TutorialVideoScreen({
  videoId,
  labels,
  onClose,
  onCreateWallet,
  onAlreadyHaveWallet,
}: Props) {
  const video = getTutorialVideo(videoId);
  const [finished, setFinished] = useState(false);

  if (!video) return null;

  const title = labels.videos[video.titleKey] ?? video.id;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center bg-celo-cream">
      <div className="home-perfil flex min-h-0 w-full max-w-md flex-col safe-top safe-bottom">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-surface text-h-foreground ring-1 ring-h-border transition-transform active:scale-95"
            aria-label={labels.close}
          >
            <X className="size-4" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center font-display text-sm font-extrabold text-h-foreground">
            {title}
          </h1>
          <div className="size-9" aria-hidden />
        </header>

        {!finished ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <CeloQuestVideoPlayer
              src={video.src}
              title={title}
              labels={labels.player}
              layout="immersive"
              onEnded={() => setFinished(true)}
              className="min-h-0 flex-1"
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-4 pb-6">
            <div className="animate-card-pop flex flex-1 flex-col items-center justify-center text-center">
              <div className="grid size-24 place-items-center rounded-full bg-surface text-5xl ring-2 ring-prosperity/40 card-depth-sm">
                ✅
              </div>
              <h2 className="mt-6 font-display text-2xl font-extrabold text-h-foreground">
                {labels.videoReadyTitle}
              </h2>

              <div className="mt-8 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={onCreateWallet}
                  className="btn-chunky flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-lg font-bold text-h-background"
                >
                  👛 {labels.createWallet}
                </button>
                <button
                  type="button"
                  onClick={onAlreadyHaveWallet}
                  className="btn-chunky flex w-full items-center justify-center gap-2 rounded-2xl bg-prosperity py-4 font-display text-lg font-bold text-h-background"
                >
                  {labels.alreadyHaveWallet}
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
