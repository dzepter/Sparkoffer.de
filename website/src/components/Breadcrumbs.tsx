import Link from "next/link";
import { routes, siteConfig } from "@/content/site";
import { JsonLd } from "./JsonLd";
import { Container } from "./ui";

export type Crumb = { label: string; href: string };

/** Breadcrumbs für Unterseiten inkl. BreadcrumbList-Strukturdaten. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Startseite", href: routes.home }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: `${siteConfig.url}${crumb.href === "/" ? "" : crumb.href}`,
    })),
  };

  return (
    <nav aria-label="Brotkrümelnavigation" className="border-b border-line bg-paper-2">
      <JsonLd data={jsonLd} />
      <Container>
        <ol className="flex flex-wrap items-center gap-2 py-3 text-sm">
          {all.map((crumb, i) => {
            const last = i === all.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-2">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-mute">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" className="font-medium text-ink">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-mute transition-colors hover:text-rot hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </nav>
  );
}
