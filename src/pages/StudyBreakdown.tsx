import { useNavigate } from "react-router-dom";
import { getStudySnapshot } from "@/stores/studySessionStore";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, ChevronDown, ShieldAlert, Lightbulb, ChevronsUpDown } from "lucide-react";
import { useState, useCallback } from "react";

const StudyBreakdown = () => {
  const navigate = useNavigate();
  const snapshot = getStudySnapshot();

  // Track which sections are open — top 3 open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    correctWhy: true,
    whySuboptimal: true,
    prioritize: true,
    safety: true,
    reasoning: true,
    guidelines: true,
  });

  const allKeys = ["correctWhy", "whySuboptimal", "prioritize", "safety", "reasoning", "guidelines"];
  const allOpen = allKeys.every((k) => openSections[k]);

  const toggleAll = useCallback(() => {
    const target = !allOpen;
    const next: Record<string, boolean> = {};
    allKeys.forEach((k) => (next[k] = target));
    setOpenSections(next);
  }, [allOpen]);

  const toggle = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (!snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <p className="text-muted-foreground">No case data available.</p>
            <button
              onClick={() => navigate("/study")}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Back to Study Mode
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { caseData, caseIndex, totalCases, selectedId, isCorrect, explanation, correctDisplayLabel, reasoningScore, prioritySignal, hits, misses } = snapshot;
  const correctOption = caseData.options.find((o) => o.id === caseData.correctOptionId);
  const selectedOption = caseData.options.find((o) => o.id === selectedId);

  // Derive clinical focus areas
  const focusAreas: string[] = [];
  const comorbStr = caseData.comorbidities.join(" ").toLowerCase();
  if (/heart failure|hfref|hfpef/.test(comorbStr)) focusAreas.push("Prioritize cardiorenal protection over pure glycemic lowering.");
  if (/ascvd|mi|cardiovascular/.test(comorbStr)) focusAreas.push("Prioritize cardiovascular risk reduction (MACE benefit).");
  if (/ckd|kidney/.test(comorbStr) || parseInt(caseData.metrics.egfr) < 45) focusAreas.push("Renal safety and kidney-protective agents take priority.");
  if (parseInt(caseData.metrics.bmi) >= 30) focusAreas.push("Weight management is a key therapeutic goal.");
  if (/hypoglycemia/.test(comorbStr) || /frail/.test(comorbStr)) focusAreas.push("Minimizing hypoglycemia risk is essential in this patient.");
  if (parseFloat(caseData.metrics.a1c) >= 10) focusAreas.push("Glycemic urgency — rapid control needed (consider insulin).");
  if (focusAreas.length === 0) focusAreas.push("Balance glycemic efficacy with side-effect profile for this patient.");

  // Safety / contraindication signals
  const safetyNotes: string[] = [];
  caseData.avoidList.forEach((a) => safetyNotes.push(a));
  if (parseInt(caseData.metrics.egfr) < 30) safetyNotes.push("eGFR < 30: Metformin contraindicated; many agents need dose adjustment.");
  if (/heart failure/.test(comorbStr)) safetyNotes.push("Thiazolidinediones (TZDs) are contraindicated in heart failure (fluid retention).");

  // Clinical takeaway
  let takeaway = "";
  if (/heart failure/.test(comorbStr)) takeaway = "In T2DM with heart failure, SGLT2 inhibitors are first-line add-on — they reduce HF hospitalization regardless of glycemic effect.";
  else if (/ascvd/.test(comorbStr)) takeaway = "Established ASCVD in T2DM calls for GLP-1 RA or SGLT2i — choose agents with proven MACE reduction.";
  else if (/ckd|kidney/.test(comorbStr)) takeaway = "In CKD, match agents to eGFR cutoffs — and prioritize kidney-protective drugs when albuminuria is present.";
  else if (parseInt(caseData.metrics.bmi) >= 35) takeaway = "With severe obesity, weight-lowering agents (GLP-1 RA, dual agonists) offer the greatest net clinical benefit.";
  else if (parseFloat(caseData.metrics.a1c) >= 10) takeaway = "A1C ≥ 10% with symptoms = insulin first. Oral agents alone cannot close this gap quickly enough.";
  else if (/hypoglycemia/.test(comorbStr)) takeaway = "When hypoglycemia is the problem, removing the offending agent matters more than adding a new one.";
  else takeaway = "Always let comorbidities — not A1C alone — drive medication choice in T2DM.";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between relative max-sm:min-h-[44px]">
          {/* Left lane */}
          <div className="max-sm:min-w-[96px] flex items-center justify-start">
            <button
              onClick={() => navigate("/study")}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 active:scale-[0.96]"
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Back to Case</span>
            </button>
          </div>
          {/* Center title — absolutely centered on mobile */}
          <h1 className="text-sm font-bold text-foreground tracking-wide max-sm:absolute max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:top-1/2 max-sm:-translate-y-1/2 max-sm:max-w-[52%] max-sm:truncate max-sm:text-center max-sm:pointer-events-none">
            Case {caseIndex + 1} of {totalCases} — Detailed Breakdown
          </h1>
          {/* Right lane */}
          <div className="max-sm:min-w-[96px] flex items-center justify-end">
            <button
              onClick={toggleAll}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 active:scale-[0.96] whitespace-nowrap"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0" />
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
          {/* Patient summary */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">{caseData.patient_stem_short}</h2>
                {caseData.backgroundFlag && (
                  <span className="text-sm text-muted-foreground">{caseData.backgroundFlag} {caseData.backgroundCountry}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill label="A1C" value={caseData.metrics.a1c} />
                <Pill label="eGFR" value={caseData.metrics.egfr} />
                <Pill label="BMI" value={caseData.metrics.bmi} />
              </div>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground/70">Hx:</span> {caseData.comorbidities.join(" · ")}</p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground/70">Meds:</span> {caseData.current_meds.join(", ")}</p>
            </CardContent>
          </Card>

          {/* Your answer */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                {isCorrect ? (
                  <><CheckCircle2 className="h-5 w-5 text-success" /><span className="text-sm font-bold text-success">Correct</span></>
                ) : (
                  <><XCircle className="h-5 w-5 text-destructive" /><span className="text-sm font-bold text-destructive">Incorrect — you chose {selectedOption?.label}</span></>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Correct answer: <span className="font-semibold text-foreground">{correctDisplayLabel}. {correctOption?.label}</span>
              </p>
            </CardContent>
          </Card>

          {/* Correct Answer & Why */}
          <Section title="Correct Answer & Why" sectionKey="correctWhy" open={openSections.correctWhy} onToggle={toggle}>
            <ul className="space-y-2">
              {caseData.whyCorrect.map((w, i) => (
                <li key={i} className="text-sm text-foreground/90 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary/60">{w}</li>
              ))}
            </ul>
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient-Specific Factors</p>
              <ul className="space-y-1">
                <li className="text-sm text-muted-foreground pl-4">A1C {caseData.metrics.a1c} — {parseFloat(caseData.metrics.a1c) >= 9 ? "significant glycemic gap to close" : "moderate glycemic improvement needed"}</li>
                <li className="text-sm text-muted-foreground pl-4">eGFR {caseData.metrics.egfr} — {parseInt(caseData.metrics.egfr) < 30 ? "severely reduced; limits most agents" : parseInt(caseData.metrics.egfr) < 60 ? "moderately reduced; check drug clearance" : "preserved renal function"}</li>
                <li className="text-sm text-muted-foreground pl-4">BMI {caseData.metrics.bmi} — {parseInt(caseData.metrics.bmi) >= 30 ? "obesity present; favor weight-lowering agents" : "weight is not the primary driver"}</li>
              </ul>
            </div>
          </Section>

          {/* Why your choice was wrong */}
          {!isCorrect && selectedId && (
            <Section title={`Why ${selectedOption?.label} Is Suboptimal`} sectionKey="whySuboptimal" open={openSections.whySuboptimal} onToggle={toggle}>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {caseData.incorrectRationale?.[selectedId] || "This option lacks the specific clinical benefit needed for this patient's comorbidity profile."}
              </p>
            </Section>
          )}

          {/* What to prioritize */}
          <Section title="What You Should Prioritize" sectionKey="prioritize" open={openSections.prioritize} onToggle={toggle}>
            <ul className="space-y-1.5">
              {focusAreas.map((f, i) => (
                <li key={i} className="text-sm text-foreground/90 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-primary/50">{f}</li>
              ))}
            </ul>
          </Section>

          {/* Safety / contraindications */}
          {safetyNotes.length > 0 && (
            <Section title="Safety & Contraindications" sectionKey="safety" open={openSections.safety} onToggle={toggle} icon={<ShieldAlert className="h-4 w-4 text-destructive/70" />}>
              <ul className="space-y-1.5">
                {safetyNotes.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/90 pl-4 relative before:content-['⚠'] before:absolute before:left-0 before:text-destructive/50">{s}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Your reasoning + analysis */}
          {explanation && (
            <Section title="Your Reasoning" sectionKey="reasoning" open={openSections.reasoning} onToggle={toggle}>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{explanation}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className={`text-xs font-bold ${reasoningScore <= 1 ? "text-destructive/80" : reasoningScore === 2 ? "text-warning/80" : "text-success/80"}`}>
                  {reasoningScore}/4
                </span>
                {prioritySignal && <span className="text-xs text-muted-foreground italic">— {prioritySignal}</span>}
              </div>
              {hits.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs font-semibold text-success/80">Considered</p>
                  {hits.map((h, i) => <p key={i} className="text-sm text-foreground/80 pl-3">– {h.label}: {h.hitFeedback}</p>)}
                </div>
              )}
              {misses.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs font-semibold text-destructive/80">Overlooked</p>
                  {misses.map((m, i) => <p key={i} className="text-sm text-muted-foreground pl-3">– {m.label}: {m.missFeedback}</p>)}
                </div>
              )}
            </Section>
          )}

          {/* Clinical takeaway */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-1">Clinical Takeaway</h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{takeaway}</p>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          {caseData.guidelines.length > 0 && (
            <Section title="Guideline References" sectionKey="guidelines" open={openSections.guidelines} onToggle={toggle}>
              {caseData.guidelines.map((g, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-3">– {g}</p>
              ))}
            </Section>
          )}

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
};

/* ── Helpers ── */

const Pill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground">{value}</span>
  </div>
);

const Section = ({ title, sectionKey, icon, open, onToggle, children }: { title: string; sectionKey: string; icon?: React.ReactNode; open: boolean; onToggle: (key: string) => void; children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-5">
      <button onClick={() => onToggle(sectionKey)} className="flex items-center gap-2 w-full text-left">
        {icon}
        <h3 className="text-sm font-bold text-foreground flex-1">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </CardContent>
  </Card>
);

export default StudyBreakdown;
