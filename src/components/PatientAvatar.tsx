import { useState, useRef, useCallback, useMemo } from "react";
import { CaseData } from "@/data/cases";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ── Body-region mapping ── */
interface BodyHotspot {
  id: string;
  label: string;
  /** Array of patient facts — no treatment hints */
  facts: string[];
  /** SVG centre coords (viewBox 0 0 200 480) */
  cx: number;
  cy: number;
  region: string;
  color: string;
}

const REGION_COLORS: Record<string, string> = {
  head: "hsl(var(--primary))",
  chest: "hsl(var(--destructive))",
  abdomen: "hsl(210 60% 50%)",
  kidney: "hsl(30 80% 55%)",
  legs: "hsl(var(--muted-foreground))",
  bones: "hsl(280 40% 55%)",
  body: "hsl(var(--primary))",
  vascular: "hsl(0 65% 50%)",
  endocrine: "hsl(45 80% 50%)",
  urinary: "hsl(190 60% 45%)",
  eye: "hsl(220 60% 55%)",
  meds: "hsl(160 50% 45%)",
};

/** Build hotspots from patient data — facts only, no treatment hints */
function buildHotspots(c: CaseData): BodyHotspot[] {
  const spots: BodyHotspot[] = [];
  const joined = [...c.comorbidities, ...c.current_meds].join(" ").toLowerCase();
  const a1cVal = parseFloat(c.metrics.a1c);
  const egfrVal = parseFloat(c.metrics.egfr);
  const bmiVal = parseFloat(c.metrics.bmi);

  // ── ALWAYS-PRESENT HOTSPOTS ──

  // Brain / Demographics — always show age, sex, country
  const ageMatch = c.patient_stem_short.match(/(\d+)\s*y\/o\s*(male|female)/i);
  const age = ageMatch ? ageMatch[1] : "";
  const sex = ageMatch ? ageMatch[2] : "";
  const brainFacts: string[] = [
    `Age: ${age} years old`,
    `Sex: ${sex}`,
    ...(c.backgroundCountry ? [`Country: ${c.backgroundCountry}`] : []),
  ];
  if (/frailty|frail/.test(joined)) brainFacts.push("Documented frailty");
  if (/recurrent hypoglycemia|hypoglycemia/.test(joined)) brainFacts.push("Recurrent hypoglycemia episodes reported");
  if (/cognitive/.test(joined)) brainFacts.push("Cognitive concerns noted");
  spots.push({
    id: "brain",
    label: "Demographics",
    facts: brainFacts,
    cx: 100, cy: 42,
    region: "head",
    color: REGION_COLORS.head,
  });

  // Heart — always show BP status
  const heartFacts: string[] = [];
  if (/heart failure|hfref/.test(joined)) heartFacts.push("Heart failure with reduced ejection fraction (HFrEF)");
  if (/hfpef/.test(joined)) heartFacts.push("Heart failure with preserved ejection fraction (HFpEF)");
  if (/ascvd|prior mi/.test(joined)) heartFacts.push("Established atherosclerotic cardiovascular disease");
  if (/prior mi/.test(joined)) heartFacts.push("History of myocardial infarction");
  if (/hypertension/.test(joined)) heartFacts.push("Hypertension documented");
  if (heartFacts.length === 0) heartFacts.push("No documented cardiovascular disease");
  spots.push({
    id: "heart",
    label: "Heart & Cardiovascular",
    facts: heartFacts,
    cx: 108, cy: 148,
    region: "chest",
    color: REGION_COLORS.chest,
  });

  // Lungs / Airway
  if (/sleep apnea|osa|obstructive/.test(joined)) {
    spots.push({
      id: "lungs",
      label: "Lungs / Airway",
      facts: [
        "Obstructive sleep apnea (OSA) diagnosed",
        "Weight-related airway compromise",
        `Current BMI: ${c.metrics.bmi}`,
      ],
      cx: 82, cy: 135,
      region: "chest",
      color: REGION_COLORS.chest,
    });
  }

  // Eyes
  if (/retinopathy|vision|eye/.test(joined) || a1cVal >= 9.5) {
    const eyeFacts: string[] = [];
    if (/retinopathy/.test(joined)) eyeFacts.push("Diabetic retinopathy present");
    if (a1cVal >= 9.5) eyeFacts.push(`A1C ${c.metrics.a1c} — elevated risk for microvascular complications`);
    spots.push({
      id: "eyes",
      label: "Eyes",
      facts: eyeFacts,
      cx: 88, cy: 30,
      region: "eye",
      color: REGION_COLORS.eye,
    });
  }

  // Blood Vessels / Lipids
  if (/dyslipidemia|cholesterol|statin|atorvastatin|lipid/.test(joined)) {
    const vesselFacts: string[] = ["Dyslipidemia documented"];
    const statinMatch = joined.match(/atorvastatin\s*\d+\s*mg|rosuvastatin\s*\d+\s*mg/);
    if (statinMatch) vesselFacts.push(`Currently on ${statinMatch[0]}`);
    else if (/statin/.test(joined)) vesselFacts.push("On statin therapy");
    spots.push({
      id: "vessels",
      label: "Blood Vessels",
      facts: vesselFacts,
      cx: 58, cy: 155,
      region: "vascular",
      color: REGION_COLORS.vascular,
    });
  }

  // Liver
  if (/nafld|fatty liver|hepatic|steatosis/.test(joined)) {
    spots.push({
      id: "liver",
      label: "Liver",
      facts: [
        "Non-alcoholic fatty liver disease (NAFLD) diagnosed",
        "Hepatic steatosis present",
        `Current BMI: ${c.metrics.bmi}`,
      ],
      cx: 76, cy: 172,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Stomach / GI
  if (/nausea|gi intolerance|gastroparesis/.test(joined)) {
    spots.push({
      id: "stomach",
      label: "Stomach / GI",
      facts: [
        "GI intolerance or gastroparesis documented",
        "Nausea reported with current regimen",
      ],
      cx: 85, cy: 185,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Pancreas — always present
  const pancreasFacts: string[] = [
    `A1C: ${c.metrics.a1c}`,
    a1cVal >= 10 ? "Severely elevated — well above target" :
    a1cVal >= 9 ? "Significantly elevated — above target" :
    a1cVal >= 8 ? "Above target range" :
    a1cVal >= 7 ? "Near target range" :
    "At or below target",
  ];
  if (/symptomatic hyperglycemia|polyuria|weight loss/.test(joined)) {
    pancreasFacts.push("Symptomatic hyperglycemia: polyuria and/or unexplained weight loss");
  }
  if (/type 1|t1dm/.test(joined)) pancreasFacts.push("Type 1 diabetes");
  spots.push({
    id: "pancreas",
    label: "Pancreas / Glycemic",
    facts: pancreasFacts,
    cx: 118, cy: 192,
    region: "endocrine",
    color: REGION_COLORS.endocrine,
  });

  // Kidneys — always present
  const kidneyFacts: string[] = [
    `eGFR: ${c.metrics.egfr}`,
    egfrVal >= 90 ? "Normal kidney function" :
    egfrVal >= 60 ? "Mildly reduced kidney function (CKD Stage 2–3a)" :
    egfrVal >= 30 ? "Moderately reduced (CKD Stage 3b)" :
    egfrVal >= 15 ? "Severely reduced (CKD Stage 4)" :
    "Kidney failure (CKD Stage 5)",
  ];
  if (/albuminuria/.test(joined)) kidneyFacts.push("Albuminuria present");
  if (/dkd|diabetic kidney/.test(joined)) kidneyFacts.push("Diabetic kidney disease diagnosed");
  if (/ckd stage 4/.test(joined)) kidneyFacts.push("CKD Stage 4 confirmed");
  if (/ckd stage 3/.test(joined)) kidneyFacts.push("CKD Stage 3b confirmed");
  spots.push({
    id: "kidneys",
    label: "Kidneys",
    facts: kidneyFacts,
    cx: 68, cy: 200,
    region: "kidney",
    color: REGION_COLORS.kidney,
  });

  // Urinary
  if (/uti|urinary/.test(joined)) {
    spots.push({
      id: "urinary",
      label: "Urinary Tract",
      facts: [
        "Recurrent urinary tract infections documented",
        "History of genital/urinary infections",
      ],
      cx: 100, cy: 248,
      region: "urinary",
      color: REGION_COLORS.urinary,
    });
  }

  // Reproductive — PCOS
  if (/pcos|polycystic/.test(joined)) {
    spots.push({
      id: "reproductive",
      label: "Reproductive",
      facts: [
        "Polycystic ovary syndrome (PCOS) diagnosed",
        "Associated insulin resistance",
        "Hormonal imbalance present",
      ],
      cx: 100, cy: 232,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Body Composition — always present
  const bodyFacts: string[] = [
    `BMI: ${c.metrics.bmi}`,
    bmiVal >= 40 ? "Class III (severe) obesity" :
    bmiVal >= 35 ? "Class II obesity" :
    bmiVal >= 30 ? "Class I obesity" :
    bmiVal >= 25 ? "Overweight" :
    "Normal weight",
  ];
  if (/obesity/.test(joined)) bodyFacts.push("Obesity formally diagnosed");
  if (/sleep apnea/.test(joined)) bodyFacts.push("Weight contributing to obstructive sleep apnea");
  spots.push({
    id: "body",
    label: "Body Composition",
    facts: bodyFacts,
    cx: 140, cy: 210,
    region: "body",
    color: REGION_COLORS.body,
  });

  // Bones
  if (/osteoporosis|fracture|bone/.test(joined)) {
    spots.push({
      id: "bones",
      label: "Bones",
      facts: [
        "Osteoporosis diagnosed",
        "Elevated fracture risk",
        `Age: ${age}, Sex: ${sex}`,
      ],
      cx: 62, cy: 330,
      region: "bones",
      color: REGION_COLORS.bones,
    });
  }

  // Feet / Peripheral
  if (/neuropathy|peripheral|amputation|foot/.test(joined)) {
    spots.push({
      id: "feet",
      label: "Feet / Peripheral",
      facts: [
        "Peripheral neuropathy or vascular disease noted",
        "Foot examination findings documented",
      ],
      cx: 100, cy: 440,
      region: "legs",
      color: REGION_COLORS.legs,
    });
  }

  // Current Medications — always present, on the arm
  spots.push({
    id: "meds",
    label: "Current Medications",
    facts: c.current_meds.map(m => m),
    cx: 35, cy: 170,
    region: "meds",
    color: REGION_COLORS.meds,
  });

  return spots;
}

/* ── Anatomical SVG Body ── */
const AnatomicalBody = () => (
  <g>
    <defs>
      <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity={0.12} />
        <stop offset="100%" stopColor="currentColor" stopOpacity={0.06} />
      </linearGradient>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Head */}
    <ellipse cx={100} cy={40} rx={24} ry={28} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
    <path d="M80 48 Q80 68 100 72 Q120 68 120 48" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.8} />
    <ellipse cx={75} cy={40} rx={4} ry={8} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />
    <ellipse cx={125} cy={40} rx={4} ry={8} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />

    {/* Neck */}
    <path d="M90 66 L88 85 L112 85 L110 66" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />

    {/* Torso */}
    <path
      d="M88 85 Q60 88 48 100 L42 108 Q38 114 42 116 L55 112 Q58 108 62 105 L62 220 Q62 240 75 245 L80 248 L100 255 L120 248 L125 245 Q138 240 138 220 L138 105 Q142 108 145 112 L158 116 Q162 114 158 108 L152 100 Q140 88 112 85 Z"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.12} strokeWidth={1}
    />

    {/* Clavicle */}
    <path d="M72 92 Q85 96 100 94 Q115 96 128 92" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Ribs */}
    <path d="M75 115 Q100 120 125 115" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M73 125 Q100 131 127 125" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M72 135 Q100 142 128 135" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M74 145 Q100 150 126 145" fill="none" stroke="currentColor" strokeOpacity={0.04} strokeWidth={0.5} />

    {/* Navel */}
    <circle cx={100} cy={215} r={2} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />

    {/* Heart */}
    <path d="M102 135 Q108 128 114 132 Q118 136 114 145 L102 158 L90 145 Q86 136 90 132 Q96 128 102 135Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.7} />
    {/* Left lung */}
    <path d="M72 108 Q68 115 68 140 Q68 160 78 165 Q85 160 85 140 Q85 115 82 108 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.07} strokeWidth={0.6} />
    {/* Right lung */}
    <path d="M128 108 Q132 115 132 140 Q132 160 122 165 Q115 160 115 140 Q115 115 118 108 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.07} strokeWidth={0.6} />
    {/* Liver */}
    <path d="M72 168 Q68 172 70 180 Q74 188 90 188 Q95 185 92 178 Q88 170 80 168 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />
    {/* Stomach */}
    <path d="M88 178 Q82 185 84 195 Q88 200 95 198 Q100 192 96 185 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} />
    {/* Pancreas */}
    <path d="M105 190 Q115 188 125 192 Q130 195 125 198 Q115 200 105 196 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />
    {/* Left kidney */}
    <path d="M72 195 Q68 200 70 210 Q74 215 78 210 Q80 200 76 195 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />
    {/* Right kidney */}
    <path d="M128 195 Q132 200 130 210 Q126 215 122 210 Q120 200 124 195 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />
    {/* Bladder */}
    <ellipse cx={100} cy={245} rx={12} ry={8} fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} />

    {/* Arms */}
    <path d="M48 100 Q42 108 38 130 Q34 155 32 175 Q30 190 28 200 Q26 208 30 212 Q35 210 36 202 Q38 190 40 175 Q44 155 48 135 L52 112"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />
    <path d="M28 200 Q24 210 26 218 Q30 222 34 216 Q36 210 30 212" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />
    <path d="M152 100 Q158 108 162 130 Q166 155 168 175 Q170 190 172 200 Q174 208 170 212 Q165 210 164 202 Q162 190 160 175 Q156 155 152 135 L148 112"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />
    <path d="M172 200 Q176 210 174 218 Q170 222 166 216 Q164 210 170 212" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Pelvis */}
    <path d="M72 238 Q100 250 128 238" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.6} />

    {/* Legs */}
    <path d="M80 248 Q76 260 74 290 Q72 320 70 350 Q68 380 66 410 Q64 430 62 445 Q60 455 66 458 Q72 456 74 448 Q76 435 78 415 Q80 385 82 355 Q84 325 86 295 Q88 265 90 255"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />
    <path d="M62 445 Q55 452 52 456 Q54 462 62 462 Q70 460 74 448" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />
    <path d="M120 248 Q124 260 126 290 Q128 320 130 350 Q132 380 134 410 Q136 430 138 445 Q140 455 134 458 Q128 456 126 448 Q124 435 122 415 Q120 385 118 355 Q116 325 114 295 Q112 265 110 255"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />
    <path d="M138 445 Q145 452 148 456 Q146 462 138 462 Q130 460 126 448" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Kneecaps */}
    <ellipse cx={80} cy={350} rx={6} ry={5} fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <ellipse cx={120} cy={350} rx={6} ry={5} fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
  </g>
);

/* ── Main Component ── */
interface PatientAvatarProps {
  caseData: CaseData;
}

export const PatientAvatar = ({ caseData }: PatientAvatarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [activeSpot, setActiveSpot] = useState<string | null>(null);

  const hotspots = useMemo(() => buildHotspots(caseData), [caseData]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-hotspot]")) return;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setRotation((prev) => ({
        x: Math.max(-25, Math.min(25, prev.x - dy * 0.4)),
        y: prev.y + dx * 0.4,
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Patient Body Map
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          Drag to rotate · Click organs
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative select-none"
        style={{ perspective: "800px", width: "100%", maxWidth: 240 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="transition-transform duration-100"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <svg
            viewBox="0 0 200 480"
            className="w-full h-auto text-foreground"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <AnatomicalBody />

            {hotspots.map((spot) => (
              <Popover
                key={spot.id}
                open={activeSpot === spot.id}
                onOpenChange={(open) => setActiveSpot(open ? spot.id : null)}
              >
                <PopoverTrigger asChild>
                  <g
                    data-hotspot
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSpot((prev) => (prev === spot.id ? null : spot.id));
                    }}
                  >
                    <circle cx={spot.cx} cy={spot.cy} r={12} fill={spot.color} opacity={0.18}
                      className="animate-[pulse_2s_ease-in-out_infinite]" />
                    <circle cx={spot.cx} cy={spot.cy} r={8} fill={spot.color} opacity={0.35}
                      filter="url(#softGlow)" />
                    <circle cx={spot.cx} cy={spot.cy} r={6} fill={spot.color} opacity={0.9}
                      stroke="hsl(var(--background))" strokeWidth={1.5} />
                    <circle cx={spot.cx} cy={spot.cy} r={2} fill="hsl(var(--background))" opacity={0.9} />
                  </g>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="center"
                  sideOffset={12}
                  className="w-60 p-0 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b" style={{ backgroundColor: spot.color + "15" }}>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: spot.color }} />
                      <span className="font-semibold text-sm">{spot.label}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <ul className="space-y-1">
                      {spot.facts.map((fact, i) => (
                        <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </svg>
        </div>
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            onClick={() => setActiveSpot((prev) => (prev === spot.id ? null : spot.id))}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all border ${
              activeSpot === spot.id
                ? "border-primary bg-primary/10 text-primary scale-105"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: spot.color }} />
            {spot.label}
          </button>
        ))}
      </div>
    </div>
  );
};
