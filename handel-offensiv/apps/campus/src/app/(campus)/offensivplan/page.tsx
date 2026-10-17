import type { Metadata } from "next";

import { APP } from "@handel-offensiv/config";
import { Badge, Banner, Card, EmptyState, ErrorState, Kicker, ModuleNumber, PageHeader } from "@handel-offensiv/ui";

import { loadOffensivplan, type OffensivplanData, type PlanModule } from "@/features/offensivplan/data";
import { NewItemToggle, PlanItemCard, ShareToggle, type PlanScope } from "@/features/offensivplan/forms";
import { primaryItem, sortedItems, statusLabel, type PlanWithItems } from "@/features/offensivplan/shared";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Offensivplan" };

/**
 * OFFENSIVPLAN – "Mein Umsetzungsplan": je Modul ein Plan mit Vorhaben
 * (fuenf Felder, Status, Bis wann), Freigabe fuer den Trainer und Anzeige
 * von Trainer-Feedback; nach Modul 05 der 90-Tage-Offensivplan.
 * Schreibrechte erzwingt ausschliesslich die Datenbank (RLS).
 */
export default async function OffensivplanPage() {
  const session = await requireCampusSession();

  if (session.cohort === null) {
    return (
      <>
        <PageHeader kicker="Ihre Umsetzung" title="Mein Umsetzungsplan" />
        <Banner
          kind="info"
          message={`Ihrem Konto ist noch keine Gruppe zugeordnet. Bitte wenden Sie sich an Ihren Ansprechpartner bei ${APP.company}.`}
        />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const data = await loadOffensivplan(supabase, session.cohort.id, session.cohort.program_id, session.userId);
  const cohortId = session.cohort.id;
  const planFor = (moduleId: string | null): PlanWithItems | undefined => data.plans.find((p) => p.module_id === moduleId);

  return (
    <>
      <PageHeader
        kicker="Ihre Umsetzung"
        title="Mein Umsetzungsplan"
        description="Halten Sie je Modul fest, was Sie erkannt haben und was Sie konkret umsetzen. Ihr Plan ist privat, solange Sie ihn nicht mit Ihrem Trainer teilen."
      />

      {data.error ? (
        <ErrorState message={data.error} />
      ) : data.modules.length === 0 ? (
        <EmptyState
          title="Noch keine Module verfügbar"
          description="Sobald Ihr Programm freigeschaltet ist, legen Sie hier Ihre Umsetzungspläne zu den Modulen 01–05 an."
        />
      ) : (
        <div className="space-y-6">
          {data.modules.map((module) => (
            <ModulePlanCard key={module.id} module={module} plan={planFor(module.id)} data={data} cohortId={cohortId} />
          ))}

          <NinetyDaySection data={data} plan={planFor(null)} cohortId={cohortId} planFor={planFor} />
        </div>
      )}
    </>
  );
}

/* --------------------------- Modul-Plan-Karte --------------------------- */

function ModulePlanCard({ module, plan, data, cohortId }: { module: PlanModule; plan: PlanWithItems | undefined; data: OffensivplanData; cohortId: string }) {
  const items = sortedItems(plan);
  const scope: PlanScope = { cohortId, moduleId: module.id };
  const shared = plan?.share_with_trainer ?? false;

  return (
    <Card padding="none" className="overflow-hidden">
      <header className="flex items-center gap-4 border-b border-line px-5 py-4">
        <ModuleNumber label={module.number_label} />
        <div className="min-w-0 flex-1">
          <Kicker>Modul {module.number_label}</Kicker>
          <h2 className="mt-1 text-base font-bold text-ink sm:text-lg">{module.title}</h2>
        </div>
        {shared ? <Badge tone="gold">Geteilt</Badge> : <Badge tone="neutral">Privat</Badge>}
      </header>

      <div className="space-y-4 p-5">
        {items.length === 0 ? (
          <NewItemToggle
            scope={scope}
            label="Plan anlegen"
            hint="Legen Sie Ihren Plan zu diesem Modul an – am besten direkt nach dem Offensivtag."
          />
        ) : (
          <>
            {items.map((item, i) => (
              <PlanItemCard key={item.id} scope={scope} item={item} index={i + 1} feedback={data.feedbackByItem[item.id] ?? []} canDelete />
            ))}
            <NewItemToggle scope={scope} label="Weiteres Vorhaben hinzufügen" />
          </>
        )}

        <ShareToggle scope={scope} shared={shared} />
      </div>
    </Card>
  );
}

/* ------------------------- 90-Tage-Offensivplan ------------------------- */

function NinetyDaySection({
  data,
  plan,
  cohortId,
  planFor,
}: {
  data: OffensivplanData;
  plan: PlanWithItems | undefined;
  cohortId: string;
  planFor: (moduleId: string | null) => PlanWithItems | undefined;
}) {
  if (!data.show90) {
    return (
      <Card className="bg-paper">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1 h-0.5 w-5 shrink-0 bg-gold" />
          <p className="text-sm text-ink-soft">
            Nach Modul 05 finden Sie hier Ihren 90-Tage-Offensivplan: alle Maßnahmen aus den Modulen auf einen Blick, ergänzbar um eigene
            Vorhaben für die nächsten 90 Tage.
          </p>
        </div>
      </Card>
    );
  }

  const items = sortedItems(plan);
  const scope: PlanScope = { cohortId, moduleId: null };
  const shared = plan?.share_with_trainer ?? false;
  const consolidated = data.modules
    .map((module) => ({ module, item: primaryItem(planFor(module.id)) }))
    .filter((row): row is { module: PlanModule; item: NonNullable<ReturnType<typeof primaryItem>> } => Boolean(row.item?.action));

  return (
    <section aria-labelledby="neunzig-tage" className="space-y-4 pt-2">
      <div>
        <Kicker>Nach Modul 05</Kicker>
        <h2 id="neunzig-tage" className="mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Mein 90-Tage-Offensivplan
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Ihre Maßnahmen aus allen Modulen auf einen Blick – ergänzt um eigene Vorhaben für die nächsten 90 Tage.
        </p>
      </div>

      <Card title="Maßnahmen aus den Modulen" highlighted>
        {consolidated.length === 0 ? (
          <p className="text-sm text-ink-soft">Noch keine Maßnahmen aus den Modulen – füllen Sie oben Ihre Modul-Pläne aus.</p>
        ) : (
          <ol className="space-y-3">
            {consolidated.map(({ module, item }) => (
              <li key={module.id} className="flex items-start gap-3">
                <ModuleNumber label={module.number_label} className="text-2xl sm:text-3xl" />
                <div className="min-w-0">
                  <p className="text-sm text-ink">{item.action}</p>
                  <p className="text-xs text-ink-soft">Status: {statusLabel(item.status)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card padding="none">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h3 className="text-base font-bold text-ink">Eigene Vorhaben</h3>
          {shared ? <Badge tone="gold">Geteilt</Badge> : <Badge tone="neutral">Privat</Badge>}
        </header>
        <div className="space-y-4 p-5">
          {items.map((item, i) => (
            <PlanItemCard key={item.id} scope={scope} item={item} index={i + 1} feedback={data.feedbackByItem[item.id] ?? []} canDelete />
          ))}
          <NewItemToggle
            scope={scope}
            label="Vorhaben hinzufügen"
            hint={items.length === 0 ? "Ergänzen Sie eigene Vorhaben für die nächsten 90 Tage." : undefined}
          />
          <ShareToggle scope={scope} shared={shared} />
        </div>
      </Card>
    </section>
  );
}
