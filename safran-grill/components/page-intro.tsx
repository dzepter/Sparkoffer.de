import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "./cta";
import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd, type Crumb } from "@/lib/schema";

/**
 * Einheitlicher Seitenkopf für Unterseiten:
 * sichtbare Breadcrumb, Eyebrow, H1 und Intro-Text.
 * Erzeugt zusätzlich das BreadcrumbList-JSON-LD.
 */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        <nav aria-label="Breadcrumb" className="mb-8 text-[0.85rem] text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors duration-fast hover:text-ink">
                Startseite
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                <span aria-hidden>/</span>
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-ink-soft">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="transition-colors duration-fast hover:text-ink"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
          {title}
        </h1>
        {children && (
          <div className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {children}
          </div>
        )}
      </div>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  );
}
