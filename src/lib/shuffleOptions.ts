import { CaseData } from "@/data/cases";

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export interface ShuffledOption {
  originalId: string;
  label: string;
  displayLabel: string; // A, B, C...
}

export function shuffleOptions(
  caseData: CaseData,
  mode: string
): { options: ShuffledOption[]; correctDisplayLabel: string } {
  const seed = hashString(`${caseData.id}-${mode}`);
  const rng = mulberry32(seed);

  const indices = caseData.options.map((_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffled = indices.map((idx, pos) => ({
    originalId: caseData.options[idx].id,
    label: caseData.options[idx].label,
    displayLabel: LABELS[pos],
  }));

  const correctDisplayLabel =
    shuffled.find((o) => o.originalId === caseData.correctOptionId)?.displayLabel ?? "?";

  return { options: shuffled, correctDisplayLabel };
}
