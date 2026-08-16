import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "./cta";
import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd, type Crumb } from "@/lib/schema";

/**
 * Seitenkopf für Unterseiten: dezente Breadcrumb, Eyebrow,
 * kräftige H1 und Intro-Text. Erzeugt das BreadcrumbList-JSON-LD.
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
    <div className="bg-cream">
      <div className="mx-auto max-w-[85rem] px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-10 text-[0.8rem] text-ink-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors duration-fast hover:text-ink">
                Startseite
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                <span aria-hidden className="text-saffron">/</span>
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
        <h1 className="max-w-4xl font-display display-black text-[2.7rem] font-bold leading-[1.0] sm:text-6xl">
          {title}
        </h1>
        {children && (
          <div className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {children}
          </div>
        )}
      </div>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  );
}
