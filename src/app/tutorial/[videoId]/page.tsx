"use client";

import { useParams, useRouter } from "next/navigation";
import { TutorialVideoScreen } from "@/components/video/TutorialVideoScreen";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  getTutorialVideo,
  type TutorialVideoId,
} from "@/lib/videos/catalog";

export default function TutorialVideoPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams();
  const videoId = String(params.videoId ?? "");
  const video = getTutorialVideo(videoId);

  if (!video) {
    return (
      <main className="home-perfil flex min-h-dvh items-center justify-center px-4 safe-top safe-bottom">
        <p className="text-center font-bold text-h-muted">
          {t.onboarding.videoNotFound}
        </p>
      </main>
    );
  }

  return (
    <TutorialVideoScreen
      videoId={video.id as TutorialVideoId}
      labels={{
        videos: t.onboarding.videos,
        videoReadyTitle: t.onboarding.videoReadyTitle,
        createWallet: t.onboarding.createWallet,
        alreadyHaveWallet: t.onboarding.alreadyHaveWallet,
        close: t.onboarding.closeVideo,
        player: t.videoPlayer,
      }}
      onClose={() => router.back()}
      onCreateWallet={() => router.push("/onboarding?resources=1")}
      onAlreadyHaveWallet={() => router.push("/connect?from=onboarding")}
    />
  );
}
