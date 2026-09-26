import { redirect } from "next/navigation";

/** Startseite des Campus = "Heute" (Dashboard). */
export default function RootPage() {
  redirect("/heute");
}
