import { useState, useRef, useCallback, useMemo } from "react";
import { CaseData } from "@/data/cases";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Body-region mapping ── */
interface BodyHotspot {
  id: string;
  label: string;
  detail: string;
  /** SVG centre coords (viewBox 0 0 200 440) */
  cx: number;
  cy: number;
  region: "head" | "chest" | "abdomen" | "kidney" | "legs" | "bones" | "body";
  color: string;
}

const REGION_COLORS: Record<string, string> = {
  head: "hsl(var(--primary))",
  chest: "hsl(var(--destructive))",
  abdomen: "hsl(var(--warning))",
  kidney: "hsl(var(--accent-foreground))",
  legs: "hsl(var(--muted-foreground))",
  bones: "hsl(var(--secondary-foreground))",
  body: "hsl(var(--primary))",
};

/** Match patient comorbidities / metrics to body hotspots */
function buildHotspots(c: CaseData): BodyHotspot[] {
  const spots: BodyHotspot[] = [];
  const joined = [
    ...c.comorbidities,
    ...c.current_meds,
  ]
    .join(" ")
    .toLowerCase();

  // Heart — HF, ASCVD, hypertension
  if (/heart failure|hfref|hfpef|ascvd|hypertension|prior mi|cardiovascular/.test(joined)) {
    const details: string[] = [];
    if (/heart failure|hfref|hfpef/.test(joined)) details.push("Heart failure present");
    if (/ascvd|prior mi/.test(joined)) details.push("Established ASCVD");
    if (/hypertension/.test(joined)) details.push(`BP management ongoing`);
    spots.push({
      id: "heart",
      label: "Heart",
      detail: details.join(" · "),
      cx: 100,
      cy: 145,
      region: "chest",
      color: REGION_COLORS.chest,
    });
  }

  // Lungs / sleep apnea
  if (/sleep apnea|osa|obstructive/.test(joined)) {
    spots.push({
      id: "lungs",
      label: "Lungs / Airway",
      detail: "Obstructive sleep apnea — airway involvement",
      cx: 130,
      cy: 140,
      region: "chest",
      color: REGION_COLORS.chest,
    });
  }

  // Brain / neuro / frailty
  if (/frailty|hypoglycemia|recurrent/.test(joined)) {
    spots.push({
      id: "brain",
      label: "Brain / CNS",
      detail: "Frailty and/or recurrent hypoglycemia risk — cognitive safety concern",
      cx: 100,
      cy: 50,
      region: "head",
      color: REGION_COLORS.head,
    });
  }

  // Kidneys — CKD, eGFR, DKD, albuminuria
  const egfrVal = parseFloat(c.metrics.egfr);
  if (/ckd|kidney|albuminuria|dkd/.test(joined) || egfrVal < 60) {
    spots.push({
      id: "kidneys",
      label: "Kidneys",
      detail: `eGFR ${c.metrics.egfr}${/albuminuria/.test(joined) ? " · Albuminuria present" : ""}${/ckd/.test(joined) ? " · CKD diagnosed" : ""}`,
      cx: 70,
      cy: 195,
      region: "kidney",
      color: REGION_COLORS.kidney,
    });
  }

  // Liver — NAFLD
  if (/nafld|fatty liver|hepatic|steatosis/.test(joined)) {
    spots.push({
      id: "liver",
      label: "Liver",
      detail: "Non-alcoholic fatty liver disease (NAFLD)",
      cx: 75,
      cy: 170,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Pancreas — high A1C, symptomatic hyperglycemia
  const a1cVal = parseFloat(c.metrics.a1c);
  if (a1cVal >= 9 || /symptomatic hyperglycemia|polyuria/.test(joined)) {
    spots.push({
      id: "pancreas",
      label: "Pancreas",
      detail: `A1C ${c.metrics.a1c} — ${a1cVal >= 10 ? "severely" : "significantly"} elevated, insulin production impaired`,
      cx: 115,
      cy: 190,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Bones — osteoporosis
  if (/osteoporosis|fracture|bone/.test(joined)) {
    spots.push({
      id: "bones",
      label: "Bones",
      detail: "Osteoporosis — fracture risk elevated",
      cx: 65,
      cy: 310,
      region: "bones",
      color: REGION_COLORS.bones,
    });
  }

  // Body composition — obesity / BMI
  const bmiVal = parseFloat(c.metrics.bmi);
  if (bmiVal >= 30 || /obesity|obese|pcos/.test(joined)) {
    spots.push({
      id: "body",
      label: "Body Composition",
      detail: `BMI ${c.metrics.bmi}${/pcos/.test(joined) ? " · PCOS" : ""}${/obesity/.test(joined) ? " · Obesity" : ""}`,
      cx: 130,
      cy: 210,
      region: "body",
      color: REGION_COLORS.body,
    });
  }

  // Urinary — UTIs
  if (/uti|urinary/.test(joined)) {
    spots.push({
      id: "urinary",
      label: "Urinary Tract",
      detail: "Recurrent UTIs — SGLT2i may exacerbate",
      cx: 100,
      cy: 240,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  // Always add A1C as a general metabolic marker on the pancreas area if not already there
  if (!spots.find((s) => s.id === "pancreas")) {
    spots.push({
      id: "pancreas",
      label: "Pancreas / Metabolism",
      detail: `A1C ${c.metrics.a1c} — glycemic control target`,
      cx: 115,
      cy: 190,
      region: "abdomen",
      color: REGION_COLORS.abdomen,
    });
  }

  return spots;
}

/* ── SVG Human Silhouette ── */
const HumanSilhouette = () => (
  <g opacity={0.15}>
    {/* Head */}
    <circle cx={100} cy={45} r={28} fill="currentColor" />
    {/* Neck */}
    <rect x={92} y={73} width={16} height={14} rx={4} fill="currentColor" />
    {/* Torso */}
    <path
      d="M60 87 Q60 82 70 82 L130 82 Q140 82 140 87 L145 200 Q145 215 130 220 L70 220 Q55 215 55 200 Z"
      fill="currentColor"
    />
    {/* Left arm */}
    <path
      d="M60 90 Q45 92 38 110 L28 170 Q25 180 32 182 Q38 184 40 175 L55 120 L58 95"
      fill="currentColor"
    />
    {/* Right arm */}
    <path
      d="M140 90 Q155 92 162 110 L172 170 Q175 180 168 182 Q162 184 160 175 L145 120 L142 95"
      fill="currentColor"
    />
    {/* Left leg */}
    <path
      d="M72 218 L65 320 Q63 340 60 360 L55 400 Q53 412 62 414 Q70 414 72 402 L82 340 L88 220"
      fill="currentColor"
    />
    {/* Right leg */}
    <path
      d="M128 218 L135 320 Q137 340 140 360 L145 400 Q147 412 138 414 Q130 414 128 402 L118 340 L112 220"
      fill="currentColor"
    />
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
    // Don't start drag on hotspot buttons
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

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patient Map
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            Drag to rotate · Hover hotspots
          </span>
        </div>

        {/* 3D rotatable container */}
        <div
          ref={containerRef}
          className="relative select-none"
          style={{
            perspective: "800px",
            width: "100%",
            maxWidth: 220,
          }}
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
              viewBox="0 0 200 440"
              className="w-full h-auto text-foreground"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <HumanSilhouette />

              {/* Hotspot markers */}
              {hotspots.map((spot) => (
                <Tooltip key={spot.id} open={activeSpot === spot.id}>
                  <TooltipTrigger asChild>
                    <g
                      data-hotspot
                      onMouseEnter={() => setActiveSpot(spot.id)}
                      onMouseLeave={() => setActiveSpot(null)}
                      onClick={() =>
                        setActiveSpot((prev) =>
                          prev === spot.id ? null : spot.id
                        )
                      }
                      className="cursor-pointer"
                    >
                      {/* Pulse ring */}
                      <circle
                        cx={spot.cx}
                        cy={spot.cy}
                        r={14}
                        fill={spot.color}
                        opacity={0.15}
                        className="animate-[pulse_2s_ease-in-out_infinite]"
                      />
                      {/* Core dot */}
                      <circle
                        cx={spot.cx}
                        cy={spot.cy}
                        r={8}
                        fill={spot.color}
                        opacity={0.85}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                      {/* Icon dot */}
                      <circle
                        cx={spot.cx}
                        cy={spot.cy}
                        r={3}
                        fill="hsl(var(--background))"
                        opacity={0.9}
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-[200px] space-y-1"
                  >
                    <p className="font-bold text-xs">{spot.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {spot.detail}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </svg>
          </div>
        </div>

        {/* Legend chips */}
        <div className="flex flex-wrap justify-center gap-1.5 px-2">
          {hotspots.map((spot) => (
            <button
              key={spot.id}
              onMouseEnter={() => setActiveSpot(spot.id)}
              onMouseLeave={() => setActiveSpot(null)}
              onClick={() =>
                setActiveSpot((prev) => (prev === spot.id ? null : spot.id))
              }
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
    </TooltipProvider>
  );
};
