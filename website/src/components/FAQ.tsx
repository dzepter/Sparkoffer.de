import { faqs, type Faq } from "@/content/faqs";
import { Reveal } from "./Reveal";
import { Container, SectionHeading } from "./ui";

/**
 * FAQ als native details/summary-Elemente:
 * ohne JavaScript nutzbar, per Tastatur bedienbar.
 */
export function FAQ({
  items = faqs,
  title = "Häufige Fragen",
  eyebrow = "Gut zu wissen",
}: {
  items?: Faq[];
  title?: string;
  eyebrow?: string;
}) {
  return (
    <section className="border-t border-line bg-paper py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} />
        </Reveal>
        <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
          {items.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-rot transition-transform duration-200 group-open:rotate-45"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </summary>
              <p className="pb-6 pr-8 leading-relaxed text-mute">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
