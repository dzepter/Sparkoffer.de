# Backup & Restore

Regel (Briefing §53): Vor dem Produktivstart muss der Restore-Prozess
einmal vollständig geprobt worden sein. Ein Backup, das nie
zurückgespielt wurde, ist keins.

## Was wird gesichert?

| Datenart | Ort | Mechanismus |
|---|---|---|
| Datenbank (alle Tabellen) | Supabase Postgres | Automatische tägliche Backups (Pro-Plan); zusätzlich eigene Dumps |
| Dateien (Lernunterlagen, Avatare) | Supabase Storage | Storage liegt in S3-kompatiblem Bucket; regelmäßige Spiegelung |
| Schema/Logik | Git | migrations/, functions/ sind vollständig im Repository |
| Secrets | Secret-Stores | dokumentierte Wiederanlage (ENVIRONMENT_SETUP.md) |

## Eigene Datenbank-Dumps (zusätzlich zu Supabase-Backups)

Wöchentlich (oder vor jeder Migration) per CLI:

```bash
npx supabase db dump --linked -f backup_$(date +%Y%m%d).sql          # Schema
npx supabase db dump --linked --data-only -f data_$(date +%Y%m%d).sql # Daten
```

Ablage verschlüsselt an einem zweiten Ort (nicht nur beim Hoster).
Aufbewahrung: 4 Wochen rollierend; personenbezogene Dumps unterliegen
denselben Löschfristen wie die Live-Daten.

## Storage-Sicherung

```bash
# Beispiel: Spiegelung der privaten Buckets mit einem S3-kompatiblen Tool
# (Zugangsdaten aus dem Supabase-Dashboard, Storage → S3-Zugriff)
rclone sync supabase-prod:learning-assets backup:handel-offensiv/learning-assets
rclone sync supabase-prod:avatars        backup:handel-offensiv/avatars
```

## Restore-Prozess (geprobt vor Produktivstart)

1. Neues, leeres Supabase-Projekt anlegen (oder Staging verwenden).
2. Schema herstellen: `npx supabase db push` (aus dem Git-Stand des Backups).
3. Daten einspielen: `psql "$DB_URL" -f data_YYYYMMDD.sql`
4. Storage zurückspielen (`rclone sync backup:… supabase-neu:…`).
5. Edge Functions deployen, Secrets setzen.
6. Smoke-Test: Login Demo-Nutzer, Lektion öffnet, Datei-Download funktioniert,
   Admin-Login und Auswertung sichtbar.
7. Ergebnis + Dauer im Betriebs-Log dokumentieren.

## Wiederanlauf-Ziele (mit Auftraggeber zu bestätigen)

- RPO (max. Datenverlust): 24 h (tägliche Backups) – reduzierbar über PITR.
- RTO (max. Ausfallzeit): wenige Stunden (Restore-Probe liefert realen Wert).

## Migrations-Sicherheitsnetz

- Jede Migration zuerst gegen Staging (`supabase db push` auf Staging-Ref).
- Vor Produktions-Migration: aktueller Dump (siehe oben).
- Migrationen sind vorwärts-only; Korrekturen erfolgen durch neue Migrationen,
  nicht durch Editieren alter Dateien.
