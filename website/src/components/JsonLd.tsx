/**
 * Bettet strukturierte Daten (JSON-LD) XSS-sicher ein.
 * "<" wird escaped, damit kein HTML aus Daten entstehen kann.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
