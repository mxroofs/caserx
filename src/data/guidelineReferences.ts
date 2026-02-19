export interface GuidelineBullet {
  text: string;
  source: string;
  year: number;
}

/** Tags used to map bullets to cases based on comorbidities/context */
type Tag = "HF" | "CKD" | "ASCVD" | "obesity" | "hypoglycemia" | "insulin_needed" | "general";

const bulletsByTag: Record<Tag, GuidelineBullet[]> = {
  HF: [
    { text: "SGLT2 inhibitors reduce HF hospitalization and slow CKD progression; benefits are independent of glycemic control.", source: "Canadian Cardiovascular Society", year: 2022 },
    { text: "Initiate SGLT2 inhibitor in HF regardless of baseline A1C.", source: "ADA Standards of Care", year: 2026 },
    { text: "Avoid TZDs in heart failure due to fluid retention.", source: "ADA Standards of Care", year: 2026 },
    { text: "Saxagliptin is associated with increased HF hospitalization.", source: "Canadian Cardiovascular Society", year: 2022 },
  ],
  CKD: [
    { text: "SGLT2 inhibitors slow CKD progression; benefits are independent of glycemic control.", source: "Canadian Cardiovascular Society", year: 2022 },
    { text: "Initiate SGLT2 inhibitor in CKD regardless of baseline A1C.", source: "ADA Standards of Care", year: 2026 },
    { text: "DPP-4 inhibitors lack proven cardiovascular benefit but are safe across CKD stages.", source: "ADA Standards of Care", year: 2026 },
    { text: "Metformin is first-line unless contraindicated (avoid when eGFR < 30).", source: "Diabetes Canada", year: 2024 },
  ],
  ASCVD: [
    { text: "GLP-1 RA or SGLT2 inhibitor recommended for ASCVD regardless of A1C.", source: "Diabetes Canada", year: 2024 },
    { text: "Prioritize therapies with proven CV benefit and weight loss.", source: "AACE Algorithm", year: 2023 },
    { text: "DPP-4 inhibitors lack proven cardiovascular benefit.", source: "ADA Standards of Care", year: 2026 },
  ],
  obesity: [
    { text: "Prioritize therapies with CV benefit and weight loss in obesity.", source: "AACE Algorithm", year: 2023 },
    { text: "Prefer GLP-1 RAs in obesity, NAFLD, and PCOS.", source: "AACE Algorithm", year: 2023 },
    { text: "If A1C >1.5% above target, initiate combination therapy.", source: "Diabetes Canada", year: 2024 },
  ],
  hypoglycemia: [
    { text: "Avoid sulfonylureas when hypoglycemia risk is high.", source: "AACE Algorithm", year: 2023 },
    { text: "DPP-4 inhibitors have low hypoglycemia risk and require no renal adjustment (linagliptin).", source: "ADA Standards of Care", year: 2026 },
    { text: "Metformin is first-line unless contraindicated.", source: "Diabetes Canada", year: 2024 },
  ],
  insulin_needed: [
    { text: "If A1C >1.5% above target, initiate combination therapy.", source: "Diabetes Canada", year: 2024 },
    { text: "Prioritize therapies with CV benefit and weight loss.", source: "AACE Algorithm", year: 2023 },
    { text: "Metformin is first-line unless contraindicated.", source: "Diabetes Canada", year: 2024 },
  ],
  general: [
    { text: "Metformin is first-line unless contraindicated.", source: "Diabetes Canada", year: 2024 },
    { text: "GLP-1 RA or SGLT2 inhibitor recommended for ASCVD, HF, or CKD regardless of A1C.", source: "Diabetes Canada", year: 2024 },
    { text: "Prioritize therapies with CV benefit and weight loss.", source: "AACE Algorithm", year: 2023 },
  ],
};

/** Map each case ID to its relevant tags */
const caseTagMap: Record<number, Tag[]> = {
  1:  ["HF"],
  2:  ["ASCVD"],
  3:  ["CKD", "hypoglycemia"],
  4:  ["obesity"],
  5:  ["CKD"],
  6:  ["insulin_needed"],
  7:  ["hypoglycemia"],
  8:  ["obesity"],
  9:  ["HF", "CKD"],
  10: ["general"],
};

/** Returns 2–4 unique, deduplicated guideline bullets for a given case ID */
export function getGuidelinesForCase(caseId: number): GuidelineBullet[] {
  const tags = caseTagMap[caseId] ?? ["general"];
  const seen = new Set<string>();
  const result: GuidelineBullet[] = [];

  for (const tag of tags) {
    for (const bullet of bulletsByTag[tag] ?? []) {
      if (!seen.has(bullet.text) && result.length < 4) {
        seen.add(bullet.text);
        result.push(bullet);
      }
    }
  }

  // Pad with general if under 2
  if (result.length < 2) {
    for (const bullet of bulletsByTag.general) {
      if (!seen.has(bullet.text) && result.length < 3) {
        seen.add(bullet.text);
        result.push(bullet);
      }
    }
  }

  return result;
}
