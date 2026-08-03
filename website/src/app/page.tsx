import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BenefitGrid } from "@/components/BenefitGrid";
import { ContactCTA } from "@/components/ContactCTA";
import { FAQ } from "@/components/FAQ";
import { FootballPrinciple } from "@/components/FootballPrinciple";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { ModuleOverview } from "@/components/ModuleOverview";
import { PresenceSection } from "@/components/PresenceSection";
import { ProblemSection } from "@/components/ProblemSection";
import { TestimonialSection } from "@/components/TestimonialSection";
import { faqs } from "@/content/faqs";
import { contactData, routes, siteConfig } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Handel Offensiv | Führungskräfteentwicklung für den Handel",
  description:
    "Der Führungsführerschein für Marktleiter, Filialleiter und Abteilungsleiter. Fünf praxisnahe Offensivtage – persönlich und zu 100 Prozent in Präsenz.",
  path: "/",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.brand,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/logo-aigner-offensiv.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: contactData.street,
    postalCode: contactData.zip,
    addressLocality: contactData.city,
    addressCountry: "DE",
  },
  email: contactData.email,
  telephone: contactData.phoneHref,
  founder: {
    "@type": "Person",
    name: "Rainer Aigner",
    url: `${siteConfig.url}${routes.rainerAigner}`,
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Handel Offensiv – Der Führungsführerschein für den Handel",
  serviceType: "Führungskräfteentwicklung im stationären Handel",
  description:
    "Praxisorientiertes Präsenzprogramm mit fünf Offensivtagen für Marktleiter, Filialleiter, Abteilungsleiter, Teamleiter und Nachwuchsführungskräfte im stationären Handel.",
  provider: { "@type": "Organization", name: siteConfig.brand, url: siteConfig.url },
  areaServed: "DE",
  url: `${siteConfig.url}${routes.handelOffensiv}`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Hero />
      <ProblemSection />
      <BenefitGrid />
      <ModuleOverview />
      <FootballPrinciple />
      <PresenceSection />
      <TestimonialSection />
      <FAQ />
      <ContactCTA />
    </>
  );
}
