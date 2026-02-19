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
  detail: string;
  /** Clinical decision hint */
  clinicalHint: string;
  /** SVG centre coords (viewBox 0 0 200 500) */
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
};

/** Match patient comorbidities / metrics to body hotspots */
function buildHotspots(c: CaseData): BodyHotspot[] {
  const spots: BodyHotspot[] = [];
  const joined = [...c.comorbidities, ...c.current_meds].join(" ").toLowerCase();
  const a1cVal = parseFloat(c.metrics.a1c);
  const egfrVal = parseFloat(c.metrics.egfr);
  const bmiVal = parseFloat(c.metrics.bmi);

  // Brain — frailty, hypoglycemia, cognitive
  if (/frailty|hypoglycemia|recurrent|cognitive/.test(joined)) {
    spots.push({
      id: "brain",
      label: "Brain",
      detail: "Frailty and/or recurrent hypoglycemia — cognitive safety concern.",
      clinicalHint: "Avoid agents that increase hypoglycemia risk (sulfonylureas, insulin). Consider DPP-4i for safety.",
      cx: 100, cy: 42,
      region: "head",
      color: REGION_COLORS.head,
    });
  }

  // Eyes — retinopathy or high A1C
  if (/retinopathy|vision|eye/.test(joined) || a1cVal >= 9.5) {
    spots.push({
      id: "eyes",
      label: "Eyes",
      detail: `${a1cVal >= 9.5 ? `A1C ${c.metrics.a1c} — high risk for retinopathy progression.` : "Diabetic retinopathy present."}`,
      clinicalHint: "Rapid A1C lowering with semaglutide may transiently worsen retinopathy. Monitor closely.",
      cx: 88, cy: 35,
      region: "eye",
      color: REGION_COLORS.eye,
    });
  }

  // Heart — HF, ASCVD, hypertension
  if (/heart failure|hfref|hfpef|ascvd|hypertension|prior mi|cardiovascular/.test(joined)) {
    const details: string[] = [];
    if (/heart failure|hfref|hfpef/.test(joined)) details.push("Heart failure present");
    if (/ascvd|prior mi/.test(joined)) details.push("Established ASCVD");
    if (/hypertension/.test(joined)) details.push("Hypertension");
    spots.push({
      id: "heart",
      label: "Heart",
      detail: details.join(" · "),
      clinicalHint: /heart failure|hfref|hfpef/.test(joined)
        ? "SGLT2i (empagliflozin/dapagliflozin) reduce HF hospitalization. Avoid pioglitazone and saxagliptin."
        : "GLP-1 RA or SGLT2i recommended for proven cardiovascular benefit. Avoid TZDs in HF.",
      cx: 108, cy: 148,
      region: "chest",
      color: REGION_COLORS.chest,
    });
  }

  // Lungs / airway — sleep apnea
  if (/sleep apnea|osa|obstructive/.test(joined)) {
    spots.push({
      id: "lungs",
      label: "Lungs / Airway",
      detail: "Obstructive sleep apnea — weight-related airway compromise.",
      clinicalHint: "Weight loss with GLP-1 RA or tirzepatide can improve OSA severity. Avoid weight-gaining agents.",
      cx: 82, cy: 140,
      region: "chest",
      color: REGION_COLORS.chest,
    });
  }

  // Blood vessels — dyslipidemia, vascular
  if (/dyslipidemia|cholesterol|statin|atorvastatin|lipid/.test(joined)) {
    spots.push({
      id: "vessels",
      label: "Blood Vessels",
      detail: "Dyslipidemia — atherosclerotic risk factor.",
      clinicalHint: "GLP-1 RA preferred for MACE reduction in patients with multiple vascular risk factors.",
      cx: 60, cy: 155,
      region: "vascular",
      color: REGION_COLORS.vascular,
    });
  }

  // Stomach — GI tolerance
  if (/nausea|gi intolerance|gastroparesis/.test(joined)) {
    spots.push({
      id: "stomach",
      label: "Stomach",
      detail: "GI intolerance or gastroparesis risk.",
      clinicalHint: "GLP-1 RAs may worsen GI symptoms. Consider DPP-4i or SGLT2i as alternatives.",
      cx: 85, cy: 185,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Liver — NAFLD
  if (/nafld|fatty liver|hepatic|steatosis/.test(joined)) {
    spots.push({
      id: "liver",
      label: "Liver",
      detail: "Non-alcoholic fatty liver disease (NAFLD).",
      clinicalHint: "GLP-1 RAs (liraglutide, semaglutide) improve hepatic steatosis. Pioglitazone also beneficial for NASH but causes weight gain.",
      cx: 76, cy: 172,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Pancreas — always present for A1C
  spots.push({
    id: "pancreas",
    label: "Pancreas",
    detail: `A1C ${c.metrics.a1c}${a1cVal >= 10 ? " — severely elevated" : a1cVal >= 9 ? " — significantly elevated" : ""}.${/symptomatic|polyuria/.test(joined) ? " Symptomatic hyperglycemia." : ""}`,
    clinicalHint: a1cVal >= 10
      ? "A1C ≥ 10% with symptoms → insulin initiation recommended. Oral agents alone unlikely sufficient."
      : a1cVal >= 9
      ? "A1C ≥ 9% → consider dual therapy or injectable GLP-1 RA for robust reduction."
      : "Pancreatic beta-cell function declining. Choose agents that preserve function (GLP-1 RA, DPP-4i).",
    cx: 118, cy: 192,
    region: "endocrine",
    color: REGION_COLORS.endocrine,
  });

  // Kidneys — CKD, eGFR, DKD, albuminuria
  if (/ckd|kidney|albuminuria|dkd/.test(joined) || egfrVal < 60) {
    spots.push({
      id: "kidneys",
      label: "Kidneys",
      detail: `eGFR ${c.metrics.egfr}${/albuminuria/.test(joined) ? " · Albuminuria" : ""}${/ckd/.test(joined) ? " · CKD" : ""}`,
      clinicalHint: egfrVal < 30
        ? "eGFR < 30: Avoid metformin. Linagliptin (no renal adjustment) is safe. SGLT2i limited glycemic efficacy."
        : "SGLT2i (dapagliflozin) slows CKD progression. Check renal dosing for all agents.",
      cx: 68, cy: 200,
      region: "kidney",
      color: REGION_COLORS.kidney,
    });
  }

  // Urinary — UTIs
  if (/uti|urinary/.test(joined)) {
    spots.push({
      id: "urinary",
      label: "Urinary Tract",
      detail: "Recurrent UTIs — infection risk consideration.",
      clinicalHint: "SGLT2 inhibitors increase genital/urinary infection risk. Prefer GLP-1 RA or DPP-4i instead.",
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
      detail: "PCOS — insulin resistance and hormonal imbalance.",
      clinicalHint: "Weight loss improves PCOS outcomes. GLP-1 RA preferred for weight reduction + insulin sensitization.",
      cx: 100, cy: 230,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Body composition — obesity / BMI
  if (bmiVal >= 30 || /obesity|obese/.test(joined)) {
    spots.push({
      id: "body",
      label: "Body Composition",
      detail: `BMI ${c.metrics.bmi}${bmiVal >= 40 ? " — severe obesity" : bmiVal >= 35 ? " — class II obesity" : " — obesity"}.`,
      clinicalHint: "Prioritize weight-reducing agents: GLP-1 RA or tirzepatide. Avoid sulfonylureas, TZDs, and insulin if possible.",
      cx: 140, cy: 210,
      region: "body",
      color: REGION_COLORS.body,
    });
  }

  // Bones — osteoporosis / fracture
  if (/osteoporosis|fracture|bone/.test(joined)) {
    spots.push({
      id: "bones",
      label: "Bones",
      detail: "Osteoporosis — fracture risk elevated.",
      clinicalHint: "Avoid canagliflozin (fracture risk) and pioglitazone (bone density loss). GLP-1 RA is bone-neutral.",
      cx: 62, cy: 330,
      region: "bones",
      color: REGION_COLORS.bones,
    });
  }

  // Feet — peripheral neuropathy / vascular
  if (/neuropathy|peripheral|amputation|foot/.test(joined) || (bmiVal >= 30 && egfrVal < 60)) {
    spots.push({
      id: "feet",
      label: "Feet / Peripheral",
      detail: "Peripheral circulation and neuropathy risk.",
      clinicalHint: "Good glycemic control prevents neuropathy progression. Monitor for foot complications with SGLT2i use.",
      cx: 100, cy: 440,
      region: "legs",
      color: REGION_COLORS.legs,
    });
  }

  return spots;
}

/* ── Anatomical SVG Body ── */
const AnatomicalBody = () => (
  <g>
    {/* Skin / outer body with gradient */}
    <defs>
      <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity={0.12} />
        <stop offset="100%" stopColor="currentColor" stopOpacity={0.06} />
      </linearGradient>
      <linearGradient id="organGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity={0.08} />
        <stop offset="100%" stopColor="currentColor" stopOpacity={0.04} />
      </linearGradient>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Head — more rounded, realistic proportions */}
    <ellipse cx={100} cy={40} rx={24} ry={28} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
    {/* Jaw line */}
    <path d="M80 48 Q80 68 100 72 Q120 68 120 48" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.8} />
    {/* Ears */}
    <ellipse cx={75} cy={40} rx={4} ry={8} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />
    <ellipse cx={125} cy={40} rx={4} ry={8} fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />

    {/* Neck */}
    <path d="M90 66 L88 85 L112 85 L110 66" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8} />

    {/* Shoulders & torso — smooth anatomical shape */}
    <path
      d="M88 85 Q60 88 48 100 L42 108 Q38 114 42 116 L55 112 Q58 108 62 105 L62 220 Q62 240 75 245 L80 248 L100 255 L120 248 L125 245 Q138 240 138 220 L138 105 Q142 108 145 112 L158 116 Q162 114 158 108 L152 100 Q140 88 112 85 Z"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.12} strokeWidth={1}
    />

    {/* Clavicle lines */}
    <path d="M72 92 Q85 96 100 94 Q115 96 128 92" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Rib cage suggestion */}
    <path d="M75 115 Q100 120 125 115" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M73 125 Q100 131 127 125" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M72 135 Q100 142 128 135" fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={0.5} />
    <path d="M74 145 Q100 150 126 145" fill="none" stroke="currentColor" strokeOpacity={0.04} strokeWidth={0.5} />

    {/* Navel */}
    <circle cx={100} cy={215} r={2} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />

    {/* Internal organs — subtle outlines */}
    {/* Heart */}
    <path
      d="M102 135 Q108 128 114 132 Q118 136 114 145 L102 158 L90 145 Q86 136 90 132 Q96 128 102 135Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.7}
    />
    {/* Left lung */}
    <path
      d="M72 108 Q68 115 68 140 Q68 160 78 165 Q85 160 85 140 Q85 115 82 108 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.07} strokeWidth={0.6}
    />
    {/* Right lung */}
    <path
      d="M128 108 Q132 115 132 140 Q132 160 122 165 Q115 160 115 140 Q115 115 118 108 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.07} strokeWidth={0.6}
    />
    {/* Liver */}
    <path
      d="M72 168 Q68 172 70 180 Q74 188 90 188 Q95 185 92 178 Q88 170 80 168 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6}
    />
    {/* Stomach */}
    <path
      d="M88 178 Q82 185 84 195 Q88 200 95 198 Q100 192 96 185 Z"
      fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5}
    />
    {/* Pancreas */}
    <path
      d="M105 190 Q115 188 125 192 Q130 195 125 198 Q115 200 105 196 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
    />
    {/* Left kidney */}
    <path
      d="M72 195 Q68 200 70 210 Q74 215 78 210 Q80 200 76 195 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
    />
    {/* Right kidney */}
    <path
      d="M128 195 Q132 200 130 210 Q126 215 122 210 Q120 200 124 195 Z"
      fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
    />
    {/* Bladder */}
    <ellipse cx={100} cy={245} rx={12} ry={8} fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} />

    {/* Arms — anatomical curves */}
    <path
      d="M48 100 Q42 108 38 130 Q34 155 32 175 Q30 190 28 200 Q26 208 30 212 Q35 210 36 202 Q38 190 40 175 Q44 155 48 135 L52 112"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8}
    />
    {/* Left hand */}
    <path d="M28 200 Q24 210 26 218 Q30 222 34 216 Q36 210 30 212" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    <path
      d="M152 100 Q158 108 162 130 Q166 155 168 175 Q170 190 172 200 Q174 208 170 212 Q165 210 164 202 Q162 190 160 175 Q156 155 152 135 L148 112"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8}
    />
    {/* Right hand */}
    <path d="M172 200 Q176 210 174 218 Q170 222 166 216 Q164 210 170 212" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Pelvis line */}
    <path d="M72 238 Q100 250 128 238" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.6} />

    {/* Left leg */}
    <path
      d="M80 248 Q76 260 74 290 Q72 320 70 350 Q68 380 66 410 Q64 430 62 445 Q60 455 66 458 Q72 456 74 448 Q76 435 78 415 Q80 385 82 355 Q84 325 86 295 Q88 265 90 255"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8}
    />
    {/* Left foot */}
    <path d="M62 445 Q55 452 52 456 Q54 462 62 462 Q70 460 74 448" fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.6} />

    {/* Right leg */}
    <path
      d="M120 248 Q124 260 126 290 Q128 320 130 350 Q132 380 134 410 Q136 430 138 445 Q140 455 134 458 Q128 456 126 448 Q124 435 122 415 Q120 385 118 355 Q116 325 114 295 Q112 265 110 255"
      fill="url(#skinGrad)" stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.8}
    />
    {/* Right foot */}
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Patient Body Map
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          Drag to rotate · Click organs
        </span>
      </div>

      {/* 3D rotatable container */}
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

            {/* Hotspot markers */}
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
                    {/* Pulse ring */}
                    <circle
                      cx={spot.cx} cy={spot.cy} r={12}
                      fill={spot.color} opacity={0.18}
                      className="animate-[pulse_2s_ease-in-out_infinite]"
                    />
                    {/* Glow */}
                    <circle
                      cx={spot.cx} cy={spot.cy} r={8}
                      fill={spot.color} opacity={0.35}
                      filter="url(#softGlow)"
                    />
                    {/* Core */}
                    <circle
                      cx={spot.cx} cy={spot.cy} r={6}
                      fill={spot.color} opacity={0.9}
                      stroke="hsl(var(--background))" strokeWidth={1.5}
                    />
                    {/* Inner dot */}
                    <circle
                      cx={spot.cx} cy={spot.cy} r={2}
                      fill="hsl(var(--background))" opacity={0.9}
                    />
                  </g>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="center"
                  sideOffset={12}
                  className="w-64 p-0 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-3 py-2 border-b" style={{ backgroundColor: spot.color + "15" }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: spot.color }}
                      />
                      <span className="font-semibold text-sm">{spot.label}</span>
                    </div>
                  </div>
                  {/* Detail */}
                  <div className="px-3 py-2 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {spot.detail}
                    </p>
                    <div className="rounded-md bg-primary/5 border border-primary/10 px-2.5 py-2">
                      <p className="text-[11px] font-medium text-primary mb-0.5">
                        💊 Clinical Decision Hint
                      </p>
                      <p className="text-[11px] leading-relaxed text-foreground/80">
                        {spot.clinicalHint}
                      </p>
                    </div>
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
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1"
              style={{ backgroundColor: spot.color }}
            />
            {spot.label}
          </button>
        ))}
      </div>
    </div>
  );
};
