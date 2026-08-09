import Link from "next/link";
import { redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { firstParam } from "../inhalte/_components/notice";
import { evaluateLessonRelease, loadPreviewData } from "./_lib/preview";

/**
 * VORSCHAU ALS TEILNEHMER (§25): Auswahl Organisation -> Gruppe -> optional
 * Teilnehmer, dann die Programmansicht exakt aus Teilnehmersicht – mit den
 * echten Releases/Sessions der Gruppe (isLessonReleased aus dem Domain-Paket).
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanUuid(value: string | undefined): string | null {
  return value !== undefined && UUID_RE.test(value) ? value : null;
}

export default async function VorschauPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "content.read")) {
    return (
      <>
        <PageHeader kicker="Redaktion" title="Vorschau als Teilnehmer" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const orgId = cleanUuid(firstParam(sp.unternehmen));
  const cohortIdRaw = cleanUuid(firstParam(sp.gruppe));
  const profileIdRaw = cleanUuid(firstParam(sp.teilnehmer));

  const supabase = await createSupabaseServerClient();

  const orgsRes = await supabase
    .from("organizations")
    .select("id, name")
    .order("name", { ascending: true });
  const orgs = (orgsRes.data ?? []) as Array<{ id: string; name: string }>;

  let cohorts: Array<{ id: string; name: string }> = [];
  let cohortsError = false;
  if (orgId !== null) {
    const cohortsRes = await supabase
      .from("cohorts")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("name", { ascending: true });
    cohortsError = cohortsRes.error !== null;
    cohorts = (cohortsRes.data ?? []) as Array<{ id: string; name: string }>;
  }

  // Gruppe muss zur gewaehlten Organisation gehoeren
  const cohortId =
    cohortIdRaw !== null && cohorts.some((c) => c.id === cohortIdRaw) ? cohortIdRaw : null;

  let members: Array<{ profile_id: string; name: string }> = [];
  let membersError = false;
  if (cohortId !== null) {
    const membersRes = await supabase
      .from("cohort_members")
      .select("profile_id, profile:profiles(first_name, last_name)")
      .eq("cohort_id", cohortId)
      .eq("status", "active");
    membersError = membersRes.error !== null;
    members = (
      (membersRes.data ?? []) as unknown as Array<{
        profile_id: string;
        profile: { first_name: string | null; last_name: string | null } | null;
      }>
    )
      .map((row) => ({
        profile_id: row.profile_id,
        name:
          [row.profile?.first_name, row.profile?.last_name].filter(Boolean).join(" ") ||
          "Teilnehmer ohne Namen",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  const profileId =
    profileIdRaw !== null && members.some((m) => m.profile_id === profileIdRaw)
      ? profileIdRaw
      : null;

  const preview = cohortId !== null ? await loadPreviewData(cohortId, profileId) : null;

  const lessonQuery = (lessonId: string): string => {
    const params = new URLSearchParams({ gruppe: cohortId ?? "" });
    if (orgId !== null) params.set("unternehmen", orgId);
    if (profileId !== null) params.set("teilnehmer", profileId);
    return `/vorschau/lektion/${lessonId}?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        kicker="Redaktion"
        title="Vorschau als Teilnehmer"
        description="Programm und Lektionen exakt so, wie sie ein Teilnehmer der gewählten Gruppe sieht – inklusive Freischaltungslogik."
      />

      <Card title="Auswahl" className="mb-8">
        <form method="get" className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="vorschau-unternehmen" className="block text-sm font-bold text-ink">
              Organisation
            </label>
            <Select id="vorschau-unternehmen" name="unternehmen" defaultValue={orgId ?? ""}>
              <option value="">Bitte wählen …</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="vorschau-gruppe" className="block text-sm font-bold text-ink">
              Gruppe
            </label>
            <Select
              id="vorschau-gruppe"
              name="gruppe"
              defaultValue={cohortId ?? ""}
              disabled={orgId === null}
            >
              <option value="">
                {orgId === null ? "Zuerst Organisation wählen" : "Bitte wählen …"}
              </option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="vorschau-teilnehmer" className="block text-sm font-bold text-ink">
              Teilnehmer (optional)
            </label>
            <Select
              id="vorschau-teilnehmer"
              name="teilnehmer"
              defaultValue={profileId ?? ""}
              disabled={cohortId === null}
            >
              <option value="">Ohne konkreten Teilnehmer</option>
              {members.map((member) => (
                <option key={member.profile_id} value={member.profile_id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
            >
              Vorschau anzeigen
            </button>
          </div>
        </form>
        {orgsRes.error || cohortsError || membersError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {ERROR_MESSAGES.load}
          </p>
        ) : null}
      </Card>

      {cohortId === null ? (
        <EmptyState
          title="Noch keine Gruppe gewählt"
          description="Wählen Sie Organisation und Gruppe, um die Teilnehmersicht zu prüfen. Optional können Sie einen konkreten Teilnehmer wählen – dann gelten dessen Fortschritt und individuelle Freischaltungen."
        />
      ) : preview === null || !preview.ok ? (
        <ErrorState
          message={
            preview !== null && !preview.ok && preview.error === "not_found"
              ? ERROR_MESSAGES.notFound
              : ERROR_MESSAGES.load
          }
        />
      ) : (
        <div>
          {preview.data.program === null || preview.data.program.status !== "published" ? (
            <div
              role="status"
              className="mb-6 rounded border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink"
            >
              Das Programm dieser Gruppe ist noch nicht veröffentlicht – Teilnehmer sehen aktuell
              keine Inhalte.
            </div>
          ) : null}

          {preview.data.program !== null ? (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                Teilnehmersicht · {preview.data.cohort.name}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-ink">
                {preview.data.program.title}
              </h2>
              {preview.data.program.subtitle ? (
                <p className="mt-1 text-sm text-ink-soft">{preview.data.program.subtitle}</p>
              ) : null}
            </div>
          ) : null}

          {preview.data.modules.length === 0 ? (
            <EmptyState
              title="Keine veröffentlichten Module"
              description="Sobald Module veröffentlicht sind, erscheinen sie hier in der Teilnehmersicht."
            />
          ) : (
            <div className="space-y-6">
              {preview.data.modules.map((module) => {
                const phases = preview.data.phasesByModule.get(module.id) ?? [];
                return (
                  <section
                    key={module.id}
                    className="pitch-lines rounded border border-line bg-white p-6"
                  >
                    <div className="flex items-start gap-5">
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-6xl font-extrabold leading-none tracking-tight text-green-deep"
                      >
                        {module.number_label}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold uppercase tracking-tight text-ink">
                          <span className="sr-only">Modul {module.number_label}: </span>
                          {module.title}
                        </h3>
                        {module.claim ? (
                          <p className="mt-0.5 text-sm text-ink-soft">{module.claim}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      {phases.map((phase) => {
                        const lessons = preview.data.lessonsByPhase.get(phase.id) ?? [];
                        if (lessons.length === 0) return null;
                        return (
                          <div key={phase.id}>
                            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                              <span aria-hidden="true" className="font-extrabold text-green-deep">
                                //
                              </span>
                              {phase.title}
                            </p>
                            <ul className="divide-y divide-line/60 rounded border border-line bg-white">
                              {lessons.map((lesson) => {
                                const decision = evaluateLessonRelease(
                                  preview.data,
                                  lesson.id,
                                  profileId,
                                );
                                const completed = preview.data.completedLessonIds.has(lesson.id);
                                return (
                                  <li
                                    key={lesson.id}
                                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                                  >
                                    <div className="min-w-0 flex-1">
                                      {decision.released ? (
                                        <Link
                                          href={lessonQuery(lesson.id)}
                                          className="text-sm font-bold text-ink hover:text-green-deep"
                                        >
                                          {lesson.title}
                                        </Link>
                                      ) : (
                                        <p className="text-sm font-bold text-ink-soft">
                                          {lesson.title}
                                        </p>
                                      )}
                                      <p className="text-xs text-ink-soft">
                                        {decision.released
                                          ? (lesson.estimated_minutes !== null
                                              ? `ca. ${lesson.estimated_minutes} Min.`
                                              : lesson.summary) ?? ""
                                          : (decision.lockedLabel ??
                                            "Diese Lektion ist noch gesperrt.")}
                                      </p>
                                    </div>
                                    {completed ? (
                                      <Badge tone="success">Abgeschlossen</Badge>
                                    ) : decision.released ? (
                                      <Badge tone="brand">Frei</Badge>
                                    ) : (
                                      <Badge tone="neutral">Gesperrt</Badge>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
