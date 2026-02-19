/** Lightweight global store for study session state — used by the Breakdown page. */

import { CaseData } from "@/data/cases";

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
