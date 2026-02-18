export interface ReasoningCheck {
  label: string;
  keywords: string[];
  missFeedback: string;
  hitFeedback: string;
}

/**
 * Reasoning checks indexed by case id.
 */
export const reasoningChecksByCase: Record<number, ReasoningCheck[]> = {
  1: [
    { label: "Heart failure consideration", keywords: ["heart failure", "hfref", "hf"], hitFeedback: "You identified heart failure as a key factor.", missFeedback: "Consider how heart failure influences drug choice." },
    { label: "SGLT2i mechanism", keywords: ["sglt2", "sodium-glucose", "empagliflozin"], hitFeedback: "You referenced the SGLT2 inhibitor class.", missFeedback: "Mention the drug class and its mechanism." },
    { label: "Fluid retention risk", keywords: ["fluid", "retention", "pioglitazone", "contraindicated"], hitFeedback: "You flagged fluid retention risk.", missFeedback: "Pioglitazone causes fluid retention — important to note." },
    { label: "CV benefit", keywords: ["cardiovascular", "cv benefit", "emperor", "cardio"], hitFeedback: "You noted cardiovascular benefits.", missFeedback: "SGLT2i have proven CV outcome benefits in HFrEF." },
  ],
  2: [
    { label: "ASCVD history", keywords: ["ascvd", "cardiovascular", "mi", "myocardial"], hitFeedback: "You identified ASCVD as the driver.", missFeedback: "Prior MI / ASCVD should guide drug selection." },
    { label: "GLP-1 RA class", keywords: ["glp-1", "glp1", "semaglutide", "incretin"], hitFeedback: "You referenced GLP-1 receptor agonists.", missFeedback: "GLP-1 RAs are preferred with established ASCVD." },
    { label: "Weight benefit", keywords: ["weight", "bmi", "obesity"], hitFeedback: "You considered weight management.", missFeedback: "Weight loss is an added benefit with BMI 31." },
  ],
  3: [
    { label: "Renal function", keywords: ["ckd", "renal", "egfr", "kidney"], hitFeedback: "You identified CKD as the key constraint.", missFeedback: "eGFR 28 severely limits drug choices." },
    { label: "No renal adjustment", keywords: ["no adjustment", "hepatic", "linagliptin", "dpp-4"], hitFeedback: "You noted linagliptin needs no renal dose change.", missFeedback: "Linagliptin is unique among DPP-4i — hepatic elimination." },
    { label: "Metformin contraindication", keywords: ["metformin", "lactic acidosis", "contraindicated"], hitFeedback: "You flagged metformin risk at low eGFR.", missFeedback: "Metformin is contraindicated when eGFR < 30." },
  ],
  4: [
    { label: "Obesity focus", keywords: ["obesity", "weight", "bmi"], hitFeedback: "You prioritized weight management.", missFeedback: "BMI 42 makes weight-lowering agents critical." },
    { label: "Dual agonist", keywords: ["tirzepatide", "dual", "gip", "glp"], hitFeedback: "You identified the dual agonist mechanism.", missFeedback: "Tirzepatide's dual GIP/GLP-1 action provides superior weight loss." },
    { label: "Sleep apnea improvement", keywords: ["sleep apnea", "osa", "apnea"], hitFeedback: "You linked weight loss to OSA improvement.", missFeedback: "Weight reduction can improve obstructive sleep apnea." },
  ],
  5: [
    { label: "Albuminuria / DKD", keywords: ["albumin", "dkd", "diabetic kidney", "proteinuria"], hitFeedback: "You identified diabetic kidney disease.", missFeedback: "Albuminuria is a key indication for SGLT2i." },
    { label: "SGLT2i renal protection", keywords: ["sglt2", "dapa-ckd", "renal protection", "dapagliflozin"], hitFeedback: "You referenced SGLT2i kidney benefits.", missFeedback: "DAPA-CKD showed SGLT2i slow CKD progression." },
    { label: "Blood pressure benefit", keywords: ["blood pressure", "hypertension", "bp"], hitFeedback: "You noted BP-lowering benefit.", missFeedback: "SGLT2i also reduce blood pressure — relevant here." },
  ],
  6: [
    { label: "Severe hyperglycemia", keywords: ["a1c 10", "symptomatic", "polyuria", "severe"], hitFeedback: "You recognized the severity of hyperglycemia.", missFeedback: "A1C ≥ 10% with symptoms warrants insulin." },
    { label: "Insulin indication", keywords: ["insulin", "basal", "bolus", "glargine"], hitFeedback: "You identified insulin as necessary.", missFeedback: "Oral agents alone are insufficient at this A1C level." },
    { label: "Oral agent limitation", keywords: ["oral", "insufficient", "inadequate", "not enough"], hitFeedback: "You noted oral agents are inadequate here.", missFeedback: "Consider why oral monotherapy fails at A1C ≥ 10%." },
  ],
  7: [
    { label: "Hypoglycemia risk", keywords: ["hypoglycemia", "hypo", "low blood sugar"], hitFeedback: "You addressed the hypoglycemia concern.", missFeedback: "Recurrent hypoglycemia is the primary problem to solve." },
    { label: "Sulfonylurea removal", keywords: ["sulfonylurea", "glimepiride", "replace", "switch", "remove"], hitFeedback: "You identified the sulfonylurea as the culprit.", missFeedback: "Glimepiride is causing the hypoglycemia — it should be replaced." },
    { label: "Frailty / elderly", keywords: ["frail", "elderly", "older", "age"], hitFeedback: "You considered frailty in your reasoning.", missFeedback: "Frailty requires less aggressive glycemic targets." },
  ],
  8: [
    { label: "NAFLD consideration", keywords: ["nafld", "liver", "steatosis", "fatty liver"], hitFeedback: "You considered NAFLD in drug choice.", missFeedback: "NAFLD benefits from weight loss — relevant for drug selection." },
    { label: "GLP-1 RA benefits", keywords: ["glp-1", "glp1", "liraglutide", "incretin"], hitFeedback: "You referenced GLP-1 RA class benefits.", missFeedback: "GLP-1 RAs provide weight loss and hepatic benefits." },
    { label: "PCOS relevance", keywords: ["pcos", "polycystic"], hitFeedback: "You linked PCOS to weight management.", missFeedback: "PCOS improves with weight reduction strategies." },
  ],
  9: [
    { label: "HFpEF", keywords: ["hfpef", "heart failure", "preserved", "hf"], hitFeedback: "You identified HFpEF as a factor.", missFeedback: "HFpEF benefits from SGLT2i (EMPEROR-Preserved)." },
    { label: "CKD co-management", keywords: ["ckd", "renal", "kidney", "egfr"], hitFeedback: "You noted the CKD co-management need.", missFeedback: "CKD Stage 3b adds cardiorenal protection value to SGLT2i." },
    { label: "Dual protection", keywords: ["dual", "cardiorenal", "both", "heart and kidney"], hitFeedback: "You recognized dual cardiorenal benefit.", missFeedback: "SGLT2i uniquely protect both heart and kidneys." },
  ],
  10: [
    { label: "UTI risk avoidance", keywords: ["uti", "urinary", "infection", "genital"], hitFeedback: "You flagged UTI risk with SGLT2i.", missFeedback: "Recurrent UTIs make SGLT2i risky — important consideration." },
    { label: "Fracture risk", keywords: ["fracture", "bone", "osteoporosis"], hitFeedback: "You considered fracture/osteoporosis risk.", missFeedback: "Canagliflozin and pioglitazone increase fracture risk." },
    { label: "GLP-1 RA as alternative", keywords: ["glp-1", "glp1", "dulaglutide", "incretin"], hitFeedback: "You chose GLP-1 RA to avoid these risks.", missFeedback: "GLP-1 RAs avoid both UTI and fracture concerns." },
  ],
};
