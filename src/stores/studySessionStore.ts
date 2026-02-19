/** Global store for study session state — persisted to localStorage. */

import { CaseData } from "@/data/cases";

/* ── Breakdown snapshot (unchanged interface) ── */
export interface StudySnapshot {
  caseData: CaseData;
  caseIndex: number;
  totalCases: number;
  selectedId: string;
  isCorrect: boolean;
  explanation: string;
  correctDisplayLabel: string;
  reasoningScore: number;
  prioritySignal: string;
  hits: { label: string; hitFeedback: string }[];
  misses: { label: string; missFeedback: string }[];
}

let _snapshot: StudySnapshot | null = null;
export const setStudySnapshot = (s: StudySnapshot) => { _snapshot = s; };
export const getStudySnapshot = () => _snapshot;
export const clearStudySnapshot = () => { _snapshot = null; };

/* ── Full session state (persisted across navigation) ── */
export interface StudySessionState {
  currentIndex: number;
  selectedId: string | null;
  explanation: string;
  locked: boolean;
  results: boolean[];
  finished: boolean;
  currency: number;
  deltaText: string | null;
  showGuidelines: boolean;
  showReasoning: boolean;
  showAnalysis: boolean;
}

const SESSION_KEY = "study-session-state";

const defaultSession = (): StudySessionState => ({
  currentIndex: 0,
  selectedId: null,
  explanation: "",
  locked: false,
  results: [],
  finished: false,
  currency: (() => {
    try {
      const v = localStorage.getItem("study-mode-currency");
      return v ? parseInt(v, 10) : 25;
    } catch { return 25; }
  })(),
  deltaText: null,
  showGuidelines: false,
  showReasoning: false,
  showAnalysis: false,
});

export const saveSession = (s: StudySessionState) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
};

export const loadSession = (): StudySessionState | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudySessionState;
  } catch { return null; }
};

export const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};
