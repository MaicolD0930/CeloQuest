import { redirect } from "next/navigation";

/** Legacy route — achievements and history live on /achievements. */
export default function MedalsPage() {
  redirect("/achievements");
}
