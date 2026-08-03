import Image from "next/image";
import Link from "next/link";
import {
  contactData,
  footerNavigation,
  siteConfig,
} from "@/content/site";
import { YearNow } from "./YearNow";

export function Footer() {
  const buildYear = new Date().getFullYear();

  return (
    <footer className="on-dark border-t-4 border-rot bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Image
              src="/images/logo-aigner-offensiv.png"
              alt="Aigner Offensiv"
              width={1092}
              height={428}
              sizes="160px"
              className="h-14 w-auto bg-paper p-1.5"
            />
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-mute-dark">
              {siteConfig.footerShort}
            </p>
          </div>

          <nav aria-label="Footer-Navigation">
            <h2 className="eyebrow text-mute-dark">Navigation</h2>
            <ul className="mt-4 space-y-2.5">
              {footerNavigation.main.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[0.9375rem] text-white/90 transition-colors hover:text-white hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-mute-dark">Kontakt</h2>
            <address className="mt-4 space-y-2.5 text-[0.9375rem] not-italic text-white/90">
              <p>
                {contactData.company}
                <br />
                {contactData.street}
                <br />
                {contactData.zip} {contactData.city}
              </p>
              <p>
                <a
                  href={`tel:${contactData.phoneHref}`}
                  className="transition-colors hover:text-white hover:underline"
                >
                  Tel. {contactData.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${contactData.email}`}
                  className="transition-colors hover:text-white hover:underline"
                >
                  {contactData.email}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line-dark pt-6 text-sm text-mute-dark sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <YearNow fallback={buildYear} /> {siteConfig.brand}. Alle
            Rechte vorbehalten.
          </p>
          <ul className="flex gap-6">
            {footerNavigation.legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
