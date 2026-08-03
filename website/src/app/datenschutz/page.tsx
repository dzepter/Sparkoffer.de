import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/ui";
import { contactData, routes } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Datenschutzerklärung | Aigner Offensiv",
  description: "Datenschutzerklärung von Aigner Offensiv, München.",
  path: routes.datenschutz,
});

/**
 * Grundlage ist die Datenschutzerklärung der bisherigen Website.
 * Abschnitte zu nicht mehr eingesetzten Diensten (Google Analytics,
 * YouTube, Borlabs Cookie, reCAPTCHA/Turnstile) wurden entfernt; ein
 * Abschnitt zum neuen Kontaktformular wurde ergänzt.
 *
 * VOR LIVEGANG PRÜFEN: rechtliche Prüfung durch eine qualifizierte
 * Stelle sowie Bestätigung des tatsächlichen Hosting-Anbieters
 * (siehe CONTENT-TODO.md).
 */

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="display mt-12 text-2xl text-ink">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="display mt-8 text-lg text-ink">{children}</h3>;
}

export default function DatenschutzPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Datenschutz", href: routes.datenschutz }]}
      />
      <section className="bg-paper py-14 sm:py-20">
        <Container>
          <h1 className="display text-4xl text-ink sm:text-5xl">
            Datenschutzerklärung
          </h1>

          <div className="mt-6 max-w-3xl space-y-4 leading-relaxed break-words text-ink">
            <H2>1. Datenschutz auf einen Blick</H2>
            <H3>Allgemeine Hinweise</H3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber,
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
              Website besuchen. Personenbezogene Daten sind alle Daten, mit
              denen Sie persönlich identifiziert werden können. Ausführliche
              Informationen zum Thema Datenschutz entnehmen Sie unserer unter
              diesem Text aufgeführten Datenschutzerklärung.
            </p>
            <H3>Datenerfassung auf dieser Website</H3>
            <p>
              <strong>
                Wer ist verantwortlich für die Datenerfassung auf dieser
                Website?
              </strong>
              <br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den
              Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt
              „Hinweis zur verantwortlichen Stelle“ in dieser
              Datenschutzerklärung entnehmen.
            </p>
            <p>
              <strong>Wie erfassen wir Ihre Daten?</strong>
              <br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
              mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die
              Sie in ein Kontaktformular eingeben. Andere Daten werden
              automatisch beim Besuch der Website durch unsere IT-Systeme
              erfasst. Das sind vor allem technische Daten (z.&nbsp;B.
              Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
              Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese
              Website betreten.
            </p>
            <p>
              <strong>Wofür nutzen wir Ihre Daten?</strong>
              <br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie
              Bereitstellung der Website zu gewährleisten. Daten, die Sie uns
              über das Kontaktformular mitteilen, verarbeiten wir zur
              Bearbeitung Ihrer Anfrage. Diese Website verwendet keine
              Analyse- oder Marketing-Tools.
            </p>
            <p>
              <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
              <br />
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über
              Herkunft, Empfänger und Zweck Ihrer gespeicherten
              personenbezogenen Daten zu erhalten. Sie haben außerdem ein
              Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
              Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben,
              können Sie diese Einwilligung jederzeit für die Zukunft
              widerrufen. Außerdem haben Sie das Recht, unter bestimmten
              Umständen die Einschränkung der Verarbeitung Ihrer
              personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen
              ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
              Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie
              sich jederzeit an uns wenden.
            </p>

            <H2>2. Hosting</H2>
            <p>
              Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
            </p>
            <H3>Strato</H3>
            <p>
              Anbieter ist die Strato AG, Otto-Ostrowski-Straße 7, 10249
              Berlin (nachfolgend „Strato“). Wenn Sie unsere Website besuchen,
              erfasst Strato verschiedene Logfiles inklusive Ihrer
              IP-Adressen. Weitere Informationen entnehmen Sie der
              Datenschutzerklärung von Strato:{" "}
              <a
                href="https://www.strato.de/datenschutz/"
                rel="noopener noreferrer"
                target="_blank"
                className="underline decoration-rot decoration-2 underline-offset-2 hover:text-rot"
              >
                https://www.strato.de/datenschutz/
              </a>
              .
            </p>
            <p>
              Die Verwendung von Strato erfolgt auf Grundlage von Art. 6 Abs.
              1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer
              möglichst zuverlässigen Darstellung unserer Website.
            </p>
            <H3>Auftragsverarbeitung</H3>
            <p>
              Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur
              Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt
              es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag,
              der gewährleistet, dass dieser die personenbezogenen Daten
              unserer Websitebesucher nur nach unseren Weisungen und unter
              Einhaltung der DSGVO verarbeitet.
            </p>

            <H2>3. Allgemeine Hinweise und Pflichtinformationen</H2>
            <H3>Datenschutz</H3>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
              Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
              vertraulich und entsprechend den gesetzlichen
              Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            <p>
              Wenn Sie diese Website benutzen, werden verschiedene
              personenbezogene Daten erhoben. Personenbezogene Daten sind
              Daten, mit denen Sie persönlich identifiziert werden können. Die
              vorliegende Datenschutzerklärung erläutert, welche Daten wir
              erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu
              welchem Zweck das geschieht.
            </p>
            <p>
              Wir weisen darauf hin, dass die Datenübertragung im Internet
              (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitslücken
              aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff
              durch Dritte ist nicht möglich.
            </p>
            <H3>Hinweis zur verantwortlichen Stelle</H3>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser
              Website ist:
            </p>
            <p>
              {contactData.company}
              <br />
              {contactData.street}
              <br />
              {contactData.zip} {contactData.city}
              <br />
              Telefon: {contactData.phone}
              <br />
              E-Mail: {contactData.email}
            </p>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische
              Person, die allein oder gemeinsam mit anderen über die Zwecke
              und Mittel der Verarbeitung von personenbezogenen Daten
              (z.&nbsp;B. Namen, E-Mail-Adressen o.&nbsp;Ä.) entscheidet.
            </p>
            <H3>Speicherdauer</H3>
            <p>
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere
              Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen
              Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.
              Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine
              Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten
              gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe
              für die Speicherung Ihrer personenbezogenen Daten haben
              (z.&nbsp;B. steuer- oder handelsrechtliche
              Aufbewahrungsfristen); im letztgenannten Fall erfolgt die
              Löschung nach Fortfall dieser Gründe.
            </p>
            <H3>
              Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung
              auf dieser Website
            </H3>
            <p>
              Sofern Sie in die Datenverarbeitung eingewilligt haben,
              verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von
              Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO,
              sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO
              verarbeitet werden. Sind Ihre Daten zur Vertragserfüllung oder
              zur Durchführung vorvertraglicher Maßnahmen erforderlich,
              verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit.
              b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese
              zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind,
              auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die
              Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
              Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die
              jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den
              folgenden Absätzen dieser Datenschutzerklärung informiert.
            </p>
            <H3>Empfänger von personenbezogenen Daten</H3>
            <p>
              Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit
              verschiedenen externen Stellen zusammen. Dabei ist teilweise
              auch eine Übermittlung von personenbezogenen Daten an diese
              externen Stellen erforderlich. Wir geben personenbezogene Daten
              nur dann an externe Stellen weiter, wenn dies im Rahmen einer
              Vertragserfüllung erforderlich ist, wenn wir gesetzlich hierzu
              verpflichtet sind (z.&nbsp;B. Weitergabe von Daten an
              Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6
              Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine
              sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim
              Einsatz von Auftragsverarbeitern geben wir personenbezogene
              Daten unserer Kunden nur auf Grundlage eines gültigen Vertrags
              über Auftragsverarbeitung weiter.
            </p>
            <H3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</H3>
            <p>
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer
              ausdrücklichen Einwilligung möglich. Sie können eine bereits
              erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit
              der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom
              Widerruf unberührt.
            </p>
            <H3>
              Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen
              sowie gegen Direktwerbung (Art. 21 DSGVO)
            </H3>
            <p className="uppercase">
              Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit.
              e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus
              Gründen, die sich aus Ihrer besonderen Situation ergeben, gegen
              die Verarbeitung Ihrer personenbezogenen Daten Widerspruch
              einzulegen; dies gilt auch für ein auf diese Bestimmungen
              gestütztes Profiling. Die jeweilige Rechtsgrundlage, auf der
              eine Verarbeitung beruht, entnehmen Sie dieser
              Datenschutzerklärung. Wenn Sie Widerspruch einlegen, werden wir
              Ihre betroffenen personenbezogenen Daten nicht mehr verarbeiten,
              es sei denn, wir können zwingende schutzwürdige Gründe für die
              Verarbeitung nachweisen, die Ihre Interessen, Rechte und
              Freiheiten überwiegen oder die Verarbeitung dient der
              Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen
              (Widerspruch nach Art. 21 Abs. 1 DSGVO).
            </p>
            <p className="uppercase">
              Werden Ihre personenbezogenen Daten verarbeitet, um
              Direktwerbung zu betreiben, so haben Sie das Recht, jederzeit
              Widerspruch gegen die Verarbeitung Sie betreffender
              personenbezogener Daten zum Zwecke derartiger Werbung
              einzulegen; dies gilt auch für das Profiling, soweit es mit
              solcher Direktwerbung in Verbindung steht. Wenn Sie
              widersprechen, werden Ihre personenbezogenen Daten anschließend
              nicht mehr zum Zwecke der Direktwerbung verwendet (Widerspruch
              nach Art. 21 Abs. 2 DSGVO).
            </p>
            <H3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</H3>
            <p>
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein
              Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem
              Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres
              Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das
              Beschwerderecht besteht unbeschadet anderweitiger
              verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
            </p>
            <H3>Recht auf Datenübertragbarkeit</H3>
            <p>
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer
              Einwilligung oder in Erfüllung eines Vertrags automatisiert
              verarbeiten, an sich oder an einen Dritten in einem gängigen,
              maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die
              direkte Übertragung der Daten an einen anderen Verantwortlichen
              verlangen, erfolgt dies nur, soweit es technisch machbar ist.
            </p>
            <H3>Auskunft, Berichtigung und Löschung</H3>
            <p>
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen
              jederzeit das Recht auf unentgeltliche Auskunft über Ihre
              gespeicherten personenbezogenen Daten, deren Herkunft und
              Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht
              auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu
              weiteren Fragen zum Thema personenbezogene Daten können Sie sich
              jederzeit an uns wenden.
            </p>
            <H3>Recht auf Einschränkung der Verarbeitung</H3>
            <p>
              Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer
              personenbezogenen Daten zu verlangen. Hierzu können Sie sich
              jederzeit an uns wenden. Das Recht auf Einschränkung der
              Verarbeitung besteht in folgenden Fällen:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten
                personenbezogenen Daten bestreiten, benötigen wir in der Regel
                Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben
                Sie das Recht, die Einschränkung der Verarbeitung Ihrer
                personenbezogenen Daten zu verlangen.
              </li>
              <li>
                Wenn die Verarbeitung Ihrer personenbezogenen Daten
                unrechtmäßig geschah/geschieht, können Sie statt der Löschung
                die Einschränkung der Datenverarbeitung verlangen.
              </li>
              <li>
                Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen,
                Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung
                von Rechtsansprüchen benötigen, haben Sie das Recht, statt der
                Löschung die Einschränkung der Verarbeitung Ihrer
                personenbezogenen Daten zu verlangen.
              </li>
              <li>
                Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt
                haben, muss eine Abwägung zwischen Ihren und unseren
                Interessen vorgenommen werden. Solange noch nicht feststeht,
                wessen Interessen überwiegen, haben Sie das Recht, die
                Einschränkung der Verarbeitung Ihrer personenbezogenen Daten
                zu verlangen.
              </li>
            </ul>
            <p>
              Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten
              eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung
              abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung,
              Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz
              der Rechte einer anderen natürlichen oder juristischen Person
              oder aus Gründen eines wichtigen öffentlichen Interesses der
              Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
            </p>
            <H3>SSL- bzw. TLS-Verschlüsselung</H3>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der
              Übertragung vertraulicher Inhalte, wie zum Beispiel Anfragen,
              die Sie an uns als Seitenbetreiber senden, eine SSL- bzw.
              TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie
              daran, dass die Adresszeile des Browsers von „http://“ auf
              „https://“ wechselt und an dem Schloss-Symbol in Ihrer
              Browserzeile. Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert
              ist, können die Daten, die Sie an uns übermitteln, nicht von
              Dritten mitgelesen werden.
            </p>

            <H2>4. Datenerfassung auf dieser Website</H2>
            <H3>Cookies</H3>
            <p>
              Diese Website verwendet keine Cookies zu Analyse-, Tracking-
              oder Werbezwecken und bindet keine Dienste ein, die solche
              Cookies setzen. Aus diesem Grund wird kein Cookie-Banner
              angezeigt.
            </p>
            <H3>Kontaktformular</H3>
            <p>
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen,
              werden Ihre Angaben aus dem Anfrageformular inklusive der von
              Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der
              Anfrage und für den Fall von Anschlussfragen bei uns
              gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung
              weiter.
            </p>
            <p>
              Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6
              Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines
              Vertrags zusammenhängt oder zur Durchführung vorvertraglicher
              Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die
              Verarbeitung auf unserem berechtigten Interesse an der
              effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6
              Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1
              lit. a DSGVO), sofern diese abgefragt wurde; die Einwilligung
              ist jederzeit widerrufbar.
            </p>
            <p>
              Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben
              bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung
              zur Speicherung widerrufen oder der Zweck für die
              Datenspeicherung entfällt (z.&nbsp;B. nach abgeschlossener
              Bearbeitung Ihrer Anfrage). Zwingende gesetzliche Bestimmungen –
              insbesondere Aufbewahrungsfristen – bleiben unberührt.
            </p>
            <H3>Anfrage per E-Mail oder Telefon</H3>
            <p>
              Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre
              Anfrage inklusive aller daraus hervorgehenden personenbezogenen
              Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens
              bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht
              ohne Ihre Einwilligung weiter. Die Rechtsgrundlagen entsprechen
              denen des vorstehenden Abschnitts „Kontaktformular“.
            </p>
            <H3>Schriftarten und externe Inhalte</H3>
            <p>
              Die auf dieser Website verwendeten Schriftarten sind lokal
              eingebunden. Beim Besuch dieser Website werden keine
              Verbindungen zu Schriften-Diensten oder anderen externen
              Inhalte-Anbietern aufgebaut.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
