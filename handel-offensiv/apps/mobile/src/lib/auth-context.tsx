/**
 * Auth-/Session-Provider.
 *
 * Hält die Supabase-Session (supabase.auth.onAuthStateChange) und lädt
 * dazu das eigene Profil sowie die Cohort-Mitgliedschaften (Teilnehmer).
 * can() aus @handel-offensiv/domain ist nur UX-Gate – verbindlich ist RLS.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { CohortMemberRow, ProfileRow } from "@handel-offensiv/types";
import { supabase } from "./supabase";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface SessionState {
  status: AuthStatus;
  /** Supabase-Session (nur bei signedIn gesetzt) */
  session: Session | null;
  /** Eigenes Profil (profiles-Row); kann kurz nach Login noch null sein */
  profile: ProfileRow | null;
  /** Aktive Cohort-Mitgliedschaften (Teilnehmerrolle) */
  cohortMemberships: CohortMemberRow[];
  /** Erste aktive Cohort (Standardfall: genau eine) */
  activeCohortId: string | null;
  /** Profil + Mitgliedschaften neu laden (z. B. nach Profil-Änderung) */
  refreshProfile: () => Promise<void>;
  /** Abmelden (Session + lokale Token werden entfernt) */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<SessionState | null>(null);

interface ProfileData {
  profile: ProfileRow | null;
  cohortMemberships: CohortMemberRow[];
}

async function loadProfileData(profileId: string): Promise<ProfileData> {
  // Fehler hier bewusst "leise": Screens zeigen eigene, verständliche
  // Fehler-/Offline-Zustände; niemals technische Codes an Nutzer geben.
  const [profileRes, membersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase
      .from("cohort_members")
      .select("*")
      .eq("profile_id", profileId)
      .eq("status", "active"),
  ]);

  return {
    profile: (profileRes.data as ProfileRow | null) ?? null,
    cohortMemberships: (membersRes.data as CohortMemberRow[] | null) ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    profile: null,
    cohortMemberships: [],
  });
  // Schutz gegen veraltete Antworten (schneller Login/Logout-Wechsel)
  const loadSeq = useRef(0);

  const applySession = useCallback(async (next: Session | null) => {
    const seq = ++loadSeq.current;
    setSession(next);
    if (!next) {
      setProfileData({ profile: null, cohortMemberships: [] });
      setStatus("signedOut");
      return;
    }
    setStatus("signedIn");
    try {
      const data = await loadProfileData(next.user.id);
      if (loadSeq.current === seq) setProfileData(data);
    } catch {
      // Offline o. Ä.: signedIn bleibt bestehen, Screens handhaben Ladefehler
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void applySession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void applySession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;
    const seq = ++loadSeq.current;
    try {
      const data = await loadProfileData(userId);
      if (loadSeq.current === seq) setProfileData(data);
    } catch {
      // s. o. – Screens zeigen verständliche Fehlerzustände
    }
  }, [session?.user.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      status,
      session,
      profile: profileData.profile,
      cohortMemberships: profileData.cohortMemberships,
      activeCohortId: profileData.cohortMemberships[0]?.cohort_id ?? null,
      refreshProfile,
      signOut,
    }),
    [status, session, profileData, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook: aktueller Session-/Auth-Zustand. Nur innerhalb von <AuthProvider>. */
export function useSession(): SessionState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession muss innerhalb von <AuthProvider> verwendet werden.");
  }
  return ctx;
}
