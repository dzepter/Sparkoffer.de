import { redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";

import { ProgramForm } from "../program-form";

export const dynamic = "force-dynamic";

export default async function NeuesProgrammPage() {
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Programme" title="Neues Programm" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Programme"
        title="Neues Programm"
        description="Grunddaten des Lernprogramms. Module und Lernphasen legen Sie anschließend im Programm an."
      />
      <Card>
        <ProgramForm />
      </Card>
    </>
  );
}
