import { Suspense } from "react";
import ConnectPage from "./page.client";
import { LoadingOctopus } from "@/components/LoadingOctopus";

export default function ConnectPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="home-perfil flex flex-1 items-center justify-center">
          <LoadingOctopus />
        </main>
      }
    >
      <ConnectPage />
    </Suspense>
  );
}
