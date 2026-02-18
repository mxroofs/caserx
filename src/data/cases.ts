export interface CaseData {
  id: number;
  patient_stem_short: string;
  metrics: { a1c: string; egfr: string; bmi: string };
  comorbidities: string[];
  current_meds: string[];
  options: { id: string; label: string }[];
  correctOptionId: string;
  whyCorrect: string[];
  avoidList: string[];
  guidelines: string[];
}

export const seedCases: CaseData[] = [
  {
    id: 1,
    patient_stem_short: "62 y/o male",
    metrics: { a1c: "8.2%", egfr: "75 mL/min", bmi: "34 kg/m²" },
    comorbidities: ["Heart failure (HFrEF)", "Hypertension"],
    current_meds: ["Metformin 1000 mg BID"],
    options: [
      { id: "A", label: "Empagliflozin" },
      { id: "B", label: "Glipizide" },
      { id: "C", label: "Pioglitazone" },
      { id: "D", label: "Sitagliptin" },
      { id: "E", label: "Insulin glargine" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "SGLT2 inhibitors reduce HF hospitalization (EMPEROR-Reduced trial).",
      "Empagliflozin has proven cardiovascular benefit in T2DM with HFrEF.",
      "Additional A1C lowering of ~0.5–0.8% with weight and BP reduction.",
    ],
    avoidList: [
      "Pioglitazone – contraindicated in heart failure (fluid retention).",
    ],
    guidelines: [
      "ADA 2024 Standards of Care §9: SGLT2i preferred with HFrEF.",
      "ESC 2023 Heart Failure Guidelines: Dapagliflozin/empagliflozin class I recommendation.",
    ],
  },
  {
    id: 2,
    patient_stem_short: "55 y/o female",
    metrics: { a1c: "9.1%", egfr: "90 mL/min", bmi: "31 kg/m²" },
    comorbidities: ["ASCVD (prior MI)", "Dyslipidemia"],
    current_meds: ["Metformin 1000 mg BID", "Atorvastatin 40 mg"],
    options: [
      { id: "A", label: "Semaglutide" },
      { id: "B", label: "Canagliflozin" },
      { id: "C", label: "Glimepiride" },
      { id: "D", label: "Saxagliptin" },
      { id: "E", label: "Acarbose" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "GLP-1 RAs reduce MACE in patients with established ASCVD (SUSTAIN-6).",
      "Semaglutide provides superior A1C reduction (~1.5%).",
      "Additional weight loss benefit (~5–10%) beneficial with BMI 31.",
    ],
    avoidList: [
      "Saxagliptin – associated with increased HF hospitalization (SAVOR-TIMI).",
    ],
    guidelines: [
      "ADA 2024 §9: GLP-1 RA preferred with established ASCVD.",
      "ACC/AHA 2023: GLP-1 RA class I for T2DM + ASCVD.",
    ],
  },
  {
    id: 3,
    patient_stem_short: "70 y/o male",
    metrics: { a1c: "7.8%", egfr: "28 mL/min", bmi: "27 kg/m²" },
    comorbidities: ["CKD Stage 4", "Hypertension"],
    current_meds: ["Insulin glargine 20 units", "Lisinopril 20 mg"],
    options: [
      { id: "A", label: "Metformin" },
      { id: "B", label: "Linagliptin" },
      { id: "C", label: "Canagliflozin" },
      { id: "D", label: "Exenatide" },
      { id: "E", label: "Glipizide" },
    ],
    correctOptionId: "B",
    whyCorrect: [
      "Linagliptin requires no renal dose adjustment (hepatic elimination).",
      "Safe in CKD Stage 4 (eGFR < 30) unlike most other agents.",
      "Modest A1C reduction (~0.5–0.7%) with low hypoglycemia risk.",
    ],
    avoidList: [
      "Metformin – contraindicated with eGFR < 30 (lactic acidosis risk).",
      "Canagliflozin – limited efficacy when eGFR < 30 for glycemic control.",
    ],
    guidelines: [
      "ADA 2024 §11: DPP-4i safe across CKD stages; linagliptin no adjustment.",
      "KDIGO 2022: Avoid metformin when eGFR < 30.",
    ],
  },
  {
    id: 4,
    patient_stem_short: "48 y/o female",
    metrics: { a1c: "7.5%", egfr: "95 mL/min", bmi: "42 kg/m²" },
    comorbidities: ["Obesity", "Obstructive sleep apnea"],
    current_meds: ["Metformin 1000 mg BID"],
    options: [
      { id: "A", label: "Tirzepatide" },
      { id: "B", label: "Glipizide" },
      { id: "C", label: "Pioglitazone" },
      { id: "D", label: "Insulin NPH" },
      { id: "E", label: "Sitagliptin" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "Tirzepatide (dual GIP/GLP-1 RA) provides greatest weight loss (~15–20%).",
      "SURPASS trials showed superior A1C reduction vs all comparators.",
      "Weight reduction can improve obstructive sleep apnea.",
    ],
    avoidList: [
      "Pioglitazone – weight gain contraproductive with BMI 42.",
      "Insulin NPH – weight gain and hypoglycemia risk; not first add-on here.",
    ],
    guidelines: [
      "ADA 2024 §8: Prioritize agents with weight loss when obesity is present.",
      "Endocrine Society 2023: GLP-1 RA/dual agonists first-line for T2DM + obesity.",
    ],
  },
  {
    id: 5,
    patient_stem_short: "65 y/o male",
    metrics: { a1c: "8.8%", egfr: "60 mL/min", bmi: "29 kg/m²" },
    comorbidities: ["Diabetic kidney disease (albuminuria)", "Hypertension"],
    current_meds: ["Metformin 500 mg BID", "Losartan 100 mg"],
    options: [
      { id: "A", label: "Dapagliflozin" },
      { id: "B", label: "Glimepiride" },
      { id: "C", label: "Sitagliptin" },
      { id: "D", label: "Pioglitazone" },
      { id: "E", label: "Insulin lispro" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "SGLT2i slow CKD progression and reduce albuminuria (DAPA-CKD trial).",
      "Dapagliflozin has dedicated kidney outcome data regardless of diabetes.",
      "Additional A1C, weight, and blood pressure benefits.",
    ],
    avoidList: [],
    guidelines: [
      "ADA 2024 §11: SGLT2i recommended for DKD with albuminuria.",
      "KDIGO 2022: SGLT2i first-line for CKD with albuminuria in T2DM.",
    ],
  },
  {
    id: 6,
    patient_stem_short: "58 y/o female",
    metrics: { a1c: "10.5%", egfr: "85 mL/min", bmi: "26 kg/m²" },
    comorbidities: ["Symptomatic hyperglycemia (polyuria, weight loss)"],
    current_meds: ["Metformin 1000 mg BID"],
    options: [
      { id: "A", label: "Sitagliptin" },
      { id: "B", label: "Insulin glargine + lispro" },
      { id: "C", label: "Pioglitazone" },
      { id: "D", label: "Canagliflozin" },
      { id: "E", label: "Glipizide" },
    ],
    correctOptionId: "B",
    whyCorrect: [
      "A1C ≥ 10% with symptoms → initiate insulin to rapidly control glucose.",
      "Basal-bolus (glargine + lispro) addresses fasting and prandial hyperglycemia.",
      "Oral agents alone unlikely to achieve adequate control at this A1C level.",
    ],
    avoidList: [],
    guidelines: [
      "ADA 2024 §9: Consider insulin if A1C ≥ 10% or symptomatic hyperglycemia.",
      "AACE 2023: Insulin recommended when A1C > 9% with symptoms.",
    ],
  },
  {
    id: 7,
    patient_stem_short: "72 y/o male",
    metrics: { a1c: "7.2%", egfr: "55 mL/min", bmi: "24 kg/m²" },
    comorbidities: ["Recurrent hypoglycemia", "Frailty"],
    current_meds: ["Glimepiride 4 mg", "Metformin 500 mg BID"],
    options: [
      { id: "A", label: "Add insulin glargine" },
      { id: "B", label: "Switch glimepiride to linagliptin" },
      { id: "C", label: "Add empagliflozin" },
      { id: "D", label: "Add pioglitazone" },
      { id: "E", label: "Increase glimepiride to 8 mg" },
    ],
    correctOptionId: "B",
    whyCorrect: [
      "Replace sulfonylurea (cause of hypoglycemia) with safer DPP-4i.",
      "Linagliptin: minimal hypoglycemia risk, no renal adjustment needed.",
      "A1C 7.2% in frail elderly — less intensive target appropriate (~7.5–8%).",
    ],
    avoidList: [
      "Increasing glimepiride – would worsen hypoglycemia in frail patient.",
    ],
    guidelines: [
      "ADA 2024 §13: Relaxed A1C targets in elderly/frail; avoid hypoglycemia.",
      "Beers Criteria: Avoid long-acting sulfonylureas in elderly.",
    ],
  },
  {
    id: 8,
    patient_stem_short: "45 y/o female",
    metrics: { a1c: "7.9%", egfr: "110 mL/min", bmi: "38 kg/m²" },
    comorbidities: ["PCOS", "NAFLD"],
    current_meds: ["Metformin 1000 mg BID"],
    options: [
      { id: "A", label: "Liraglutide" },
      { id: "B", label: "Glipizide" },
      { id: "C", label: "Insulin detemir" },
      { id: "D", label: "Acarbose" },
      { id: "E", label: "Rosiglitazone" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "GLP-1 RA provides weight loss beneficial for PCOS and NAFLD.",
      "Liraglutide has shown improvement in hepatic steatosis markers.",
      "Strong A1C reduction (~1.0–1.5%) without hypoglycemia risk.",
    ],
    avoidList: [
      "Rosiglitazone – limited use due to cardiovascular concerns.",
    ],
    guidelines: [
      "ADA 2024 §8: GLP-1 RA preferred when weight management is priority.",
      "AASLD 2023: Weight loss is primary intervention for NAFLD.",
    ],
  },
  {
    id: 9,
    patient_stem_short: "60 y/o male",
    metrics: { a1c: "8.5%", egfr: "45 mL/min", bmi: "30 kg/m²" },
    comorbidities: ["CKD Stage 3b", "Heart failure (HFpEF)"],
    current_meds: ["Metformin 500 mg BID", "Lisinopril 10 mg"],
    options: [
      { id: "A", label: "Empagliflozin" },
      { id: "B", label: "Pioglitazone" },
      { id: "C", label: "Glimepiride" },
      { id: "D", label: "Exenatide" },
      { id: "E", label: "Saxagliptin" },
    ],
    correctOptionId: "A",
    whyCorrect: [
      "SGLT2i benefits both HFpEF (EMPEROR-Preserved) and CKD progression.",
      "Empagliflozin effective for glycemic control down to eGFR 20.",
      "Dual cardiorenal protection makes it ideal for this combination.",
    ],
    avoidList: [
      "Pioglitazone – contraindicated in heart failure.",
      "Saxagliptin – HF risk signal (SAVOR-TIMI 53).",
    ],
    guidelines: [
      "ADA 2024 §9/11: SGLT2i for T2DM with HF and/or CKD.",
      "ESC 2023: SGLT2i class I for HFpEF regardless of diabetes status.",
    ],
  },
  {
    id: 10,
    patient_stem_short: "52 y/o female",
    metrics: { a1c: "8.0%", egfr: "100 mL/min", bmi: "33 kg/m²" },
    comorbidities: ["Recurrent UTIs", "Osteoporosis"],
    current_meds: ["Metformin 1000 mg BID"],
    options: [
      { id: "A", label: "Dapagliflozin" },
      { id: "B", label: "Dulaglutide" },
      { id: "C", label: "Canagliflozin" },
      { id: "D", label: "Pioglitazone" },
      { id: "E", label: "Glipizide" },
    ],
    correctOptionId: "B",
    whyCorrect: [
      "GLP-1 RA avoids genital/urinary infection risk seen with SGLT2i.",
      "Dulaglutide: weekly injection, strong A1C reduction, weight loss.",
      "No bone fracture risk (unlike canagliflozin and pioglitazone).",
    ],
    avoidList: [
      "Canagliflozin – fracture risk + UTI exacerbation.",
      "Pioglitazone – associated with increased fracture risk.",
    ],
    guidelines: [
      "ADA 2024 §9: Consider side-effect profile when choosing agent.",
      "FDA labeling: Canagliflozin carries bone fracture warning.",
    ],
  },
];
