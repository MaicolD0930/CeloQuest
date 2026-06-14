export type TutorialVideoId = "crear-wallet";

export type TutorialVideo = {
  id: TutorialVideoId;
  /** Path under /public */
  src: string;
  /** i18n key under t.onboarding.videos */
  titleKey: "crearWallet";
  /** Recommended capture format for mobile tutorials */
  aspectRatio: "9/16";
};

export const TUTORIAL_VIDEOS: Record<TutorialVideoId, TutorialVideo> = {
  "crear-wallet": {
    id: "crear-wallet",
    src: "/videos/crear-wallet.mp4",
    titleKey: "crearWallet",
    aspectRatio: "9/16",
  },
};

export function getTutorialVideo(id: string): TutorialVideo | null {
  return TUTORIAL_VIDEOS[id as TutorialVideoId] ?? null;
}

export function listTutorialVideos(): TutorialVideo[] {
  return Object.values(TUTORIAL_VIDEOS);
}
