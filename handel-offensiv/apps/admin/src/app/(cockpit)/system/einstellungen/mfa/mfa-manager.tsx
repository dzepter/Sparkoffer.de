"use client";

/**
 * TOTP-Verwaltung fuers eigene Konto via supabase.auth.mfa (anon key, Browser).
 *
 * Ablauf (Supabase MFA):
 *  1. enroll({factorType:'totp'})  -> Faktor "unverified" + otpauth-URI/Secret
 *  2. challenge({factorId})        -> Challenge-ID
 *  3. verify({factorId, challengeId, code}) -> Faktor "verified", Session AAL2
 *  Abschalten: unenroll({factorId})
 *
 * Die otpauth-URL wird bewusst als Text/Code angezeigt (§-Vorgabe) – sie laesst
 * sich in jede Authenticator-App einfuegen; das Secret zusaetzlich einzeln.
 */

import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Card, EmptyState, ErrorState, FormField, Input, LoadingState } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface FactorInfo {
  id: string;
  friendly_name?: string | null;
  status: "verified" | "unverified";
  created_at: string;
}

interface Enrollment {
  factorId: string;
  uri: string;
  secret: string;
}

type LoadState = "loading" | "error" | "ready";

const MFA_ERROR = "Die MFA-Aktion konnte nicht ausgeführt werden. Bitte versuchen Sie es erneut.";
const CODE_ERROR =
  "Der Code wurde nicht akzeptiert. Bitte prüfen Sie den aktuellen 6-stelligen Code Ihrer App und versuchen Sie es erneut.";

export function MfaManager() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [factors, setFactors] = useState<FactorInfo[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const refreshFactors = useCallback(async (): Promise<void> => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setLoadState("error");
      return;
    }
    setFactors((data.totp ?? []) as unknown as FactorInfo[]);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void refreshFactors();
  }, [refreshFactors]);

  async function startEnrollment(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Cockpit ${new Date().toISOString().slice(0, 10)}`,
      });
      // Defensive Extraktion (robust gegenueber Typ-Varianten von supabase-js)
      const totp = (data as { id: string; totp?: { uri: string; secret: string } } | null)?.totp;
      if (error || data === null || totp === undefined) {
        setMessage({ kind: "error", text: MFA_ERROR });
        return;
      }
      setEnrollment({ factorId: data.id, uri: totp.uri, secret: totp.secret });
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment(): Promise<void> {
    if (enrollment === null) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setMessage({ kind: "error", text: "Bitte geben Sie den 6-stelligen Code aus Ihrer App ein." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
      if (challenge.error || !challenge.data) {
        setMessage({ kind: "error", text: MFA_ERROR });
        return;
      }
      const verify = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verify.error) {
        setMessage({ kind: "error", text: CODE_ERROR });
        return;
      }
      setEnrollment(null);
      setCode("");
      setMessage({
        kind: "success",
        text: "Zwei-Faktor-Authentifizierung ist jetzt aktiv. Ab der nächsten Anmeldung wird zusätzlich der Code Ihrer App abgefragt.",
      });
      await refreshFactors();
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnrollment(): Promise<void> {
    if (enrollment === null) return;
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      // Unverifizierten Faktor wieder entfernen, damit kein Rest zurueckbleibt
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
      setEnrollment(null);
      setCode("");
      setMessage(null);
      await refreshFactors();
    } finally {
      setBusy(false);
    }
  }

  async function removeFactor(factorId: string): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        setMessage({ kind: "error", text: MFA_ERROR });
        return;
      }
      setMessage({
        kind: "success",
        text: "Der Faktor wurde entfernt. Die Anmeldung erfolgt wieder nur mit Passwort.",
      });
      await refreshFactors();
    } finally {
      setBusy(false);
    }
  }

  if (loadState === "loading") {
    return <LoadingState label="MFA-Faktoren werden geladen …" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message={ERROR_MESSAGES.load}
        action={
          <Button variant="secondary" onClick={() => void refreshFactors()}>
            Erneut versuchen
          </Button>
        }
      />
    );
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <div className="max-w-3xl space-y-6">
      {message !== null ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={
            message.kind === "error"
              ? "rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
              : "rounded border border-success/40 bg-success/5 px-4 py-3 text-sm text-success"
          }
        >
          {message.text}
        </p>
      ) : null}

      <Card
        title="Ihre Faktoren"
        action={
          verified.length > 0 ? <Badge tone="success">MFA aktiv</Badge> : <Badge>MFA inaktiv</Badge>
        }
      >
        {verified.length === 0 ? (
          <EmptyState
            title="Noch kein zweiter Faktor eingerichtet"
            description="Richten Sie unten einen TOTP-Faktor ein, um Ihr Konto zusätzlich abzusichern."
          />
        ) : (
          <ul className="divide-y divide-line/60">
            {verified.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-ink">{f.friendly_name ?? "Authenticator-App"}</p>
                  <p className="text-xs text-ink-soft">
                    Eingerichtet am {formatDateTime(f.created_at)}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => void removeFactor(f.id)}
                >
                  Faktor entfernen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {enrollment === null ? (
        <Card title="Neuen Faktor einrichten">
          <p className="text-sm text-ink-soft">
            Beim Start der Einrichtung erhalten Sie eine otpauth-Adresse und ein Secret. Beides
            fügen Sie in Ihre Authenticator-App ein und bestätigen anschließend mit dem
            6-stelligen Code der App.
          </p>
          <Button className="mt-4" disabled={busy} onClick={() => void startEnrollment()}>
            {busy ? "Wird vorbereitet …" : "Einrichtung starten"}
          </Button>
        </Card>
      ) : (
        <Card title="Einrichtung abschließen" action={<Badge tone="warning">Unbestätigt</Badge>}>
          <ol className="list-decimal space-y-4 pl-5 text-sm text-ink">
            <li>
              <p className="font-bold">
                Fügen Sie diese otpauth-Adresse in Ihre Authenticator-App ein:
              </p>
              <pre className="mt-2 overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-xs text-ink">
                {enrollment.uri}
              </pre>
              <p className="mt-2 text-ink-soft">
                Alternativ manuell mit diesem Secret (Typ: zeitbasiert / TOTP):
              </p>
              <pre className="mt-1 overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-sm tracking-widest text-ink">
                {enrollment.secret}
              </pre>
            </li>
            <li>
              <FormField
                htmlFor="mfa-code"
                label="6-stelliger Code aus der App"
                hint="Der Code wechselt alle 30 Sekunden."
                required
              >
                <Input
                  id="mfa-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="max-w-40 text-center font-mono text-lg tracking-widest"
                />
              </FormField>
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void verifyEnrollment()}>
              {busy ? "Wird geprüft …" : "Bestätigen und aktivieren"}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => void cancelEnrollment()}>
              Abbrechen
            </Button>
          </div>
        </Card>
      )}

      <Card title="Hinweis">
        <p className="text-sm text-ink-soft">
          MFA gilt nur für Ihr eigenes Konto. Eine verpflichtende MFA für alle Cockpit-Rollen ist
          als künftige Einstellung vorgesehen (siehe Einstellungen). Verlieren Sie den Zugriff auf
          Ihre Authenticator-App, kann die technische Administration den Faktor über die
          Supabase-Auth-Verwaltung zurücksetzen.
        </p>
      </Card>
    </div>
  );
}
