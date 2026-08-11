import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ProgramRow } from "@handel-offensiv/types";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ProgramForm } from "../../program-form";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProgrammBearbeitenPage({
  params,
}: {
  params: Promise<{ programmId: string }>;
}) {
  const { programmId } = await params;
  if (!UUID_RE.test(programmId)) notFound();

  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Programme" title="Programm bearbeiten" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programmId)
    .maybeSingle();

  if (error) {
    return (
      <>
        <PageHeader kicker="Programme" title="Programm bearbeiten" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const program = data as ProgramRow | null;
  if (program === null) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/programme/${program.id}`}
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← Zurück zum Programm
        </Link>
      </div>

      <PageHeader kicker="Programme" title="Programm bearbeiten" description={program.title} />

      <Card>
        <ProgramForm
          program={{
            id: program.id,
            slug: program.slug,
            title: program.title,
            subtitle: program.subtitle,
            description: program.description,
            status: program.status,
          }}
        />
      </Card>
    </>
  );
}
