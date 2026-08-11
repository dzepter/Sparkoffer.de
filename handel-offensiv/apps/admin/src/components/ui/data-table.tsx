import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Generische, server-taugliche Datentabelle (keine Client-Hooks).
 * Pagination erfolgt ueber Links (Server Components + Searchparams).
 */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Zelleninhalt je Zeile */
  render: (row: T) => ReactNode;
  /** z. B. "w-32 text-right" */
  className?: string;
}

export interface DataTablePagination {
  page: number;
  pageCount: number;
  /** Ziel-URL fuer eine Seite, z. B. (p) => `/teilnehmer?seite=${p}` */
  hrefForPage: (page: number) => string;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  /** Stabiler Key je Zeile */
  rowKey: (row: T) => string;
  /** Empty-State, wenn keine Zeilen vorhanden sind */
  empty?: ReactNode;
  /** Zusammenfassung fuer Screenreader, z. B. "Liste aller Teilnehmer" */
  caption?: string;
  pagination?: DataTablePagination;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
  pagination,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <>{empty ?? <EmptyState title="Keine Einträge vorhanden" />}</>
    );
  }

  return (
    <div className={cn("rounded border border-line bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-line/60 last:border-b-0 hover:bg-paper/70"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 align-middle text-ink", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pageCount > 1 ? (
        <nav
          aria-label="Seitennavigation"
          className="flex items-center justify-between border-t border-line px-4 py-3 text-sm"
        >
          <PageLink
            href={pagination.hrefForPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Zurück
          </PageLink>
          <span className="text-ink-soft">
            Seite {pagination.page} von {pagination.pageCount}
          </span>
          <PageLink
            href={pagination.hrefForPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount}
          >
            Weiter
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-touch items-center px-3 font-bold uppercase tracking-kicker text-ink-soft/50"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex min-h-touch items-center rounded px-3 font-bold uppercase tracking-kicker text-green-deep hover:bg-paper"
    >
      {children}
    </Link>
  );
}
