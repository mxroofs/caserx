import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { seedCases, CaseData } from "@/data/cases";
import { reasoningChecksByCase, ReasoningCheck } from "@/data/reasoningChecks";
import { ChevronDown, CheckCircle2, XCircle, ArrowRight, RotateCcw, Lock, AlertTriangle, Sparkles, Coins, FileText } from "lucide-react";
import { shuffleOptions } from "@/lib/shuffleOptions";
import { setRoundActive } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { setStudySnapshot } from "@/stores/studySessionStore";

const MIN_CHARS = 75;
const STORAGE_KEY = "study-mode-currency";

const getStoredCurrency = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) : 50;
  } catch { return 100; }
};

const StudyMode = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [locked, setLocked] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [currency, setCurrency] = useState(getStoredCurrency);
  const [deltaText, setDeltaText] = useState<string | null>(null);

  const isInRound = selectedId !== null || locked;
  useEffect(() => {
    setRoundActive(isInRound && !finished);
    return () => setRoundActive(false);
  }, [isInRound, finished]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(currency));
  }, [currency]);

  const totalCases = seedCases.length;
  const currentCase: CaseData = seedCases[currentIndex];
  const isSelected = selectedId !== null;
  const isAnswered = locked;
  const isCorrect = selectedId === currentCase.correctOptionId;
  const checks = reasoningChecksByCase[currentCase.id] ?? [];

  const { options: shuffledOptions, correctDisplayLabel } = useMemo(
    () => shuffleOptions(currentCase, "study"),
    [currentCase]
  );

  const reasoningResults = useMemo(() => {
    if (!locked) return null;
    const lower = explanation.toLowerCase();
    const hits: ReasoningCheck[] = [];
    const misses: ReasoningCheck[] = [];
    checks.forEach((c) => {
      const found = c.keywords.some((kw) => lower.includes(kw.toLowerCase()));
      if (found) hits.push(c);
      else misses.push(c);
    });
    const score = Math.min(hits.length, 4);

    const hitLabels = hits.map((h) => h.label.toLowerCase()).join(" ");
    const missLabels = misses.map((m) => m.label.toLowerCase()).join(" ");
    const hitKws = hits.flatMap((h) => h.keywords).join(" ").toLowerCase();
    const missKws = misses.flatMap((m) => m.keywords).join(" ").toLowerCase();
    const allHit = hitLabels + " " + hitKws;
    const allMiss = missLabels + " " + missKws;

    let prioritySignal = "";
    const cvHit = /cardiovascular|heart failure|hfref|hfpef|cv benefit|ascvd/.test(allHit);
    const glycemicHit = /a1c|glucose|hyperglycemia|glycemic/.test(allHit);
    const cvRenalMiss = /cardiovascular|heart failure|renal|kidney|ckd|cv benefit/.test(allMiss);
    const safetyMiss = /contraindic|risk|avoid|retention|fracture|hypoglycemia|uti|lactic/.test(allMiss);

    if (cvHit) {
      prioritySignal = "You prioritized cardiovascular outcomes";
    } else if (glycemicHit && cvRenalMiss) {
      prioritySignal = "You prioritized glycemic control over long-term outcomes";
    }
    if (safetyMiss) {
      prioritySignal = prioritySignal
        ? prioritySignal + " — safety considerations were deprioritized"
        : "Safety considerations were deprioritized";
    }

    return { hits, misses, lowQuality: hits.length < 2, score, prioritySignal };
  }, [locked, explanation, checks]);

  const handleAutoFill = () => {
    if (locked || !selectedId) return;
    const selected = currentCase.options.find((o) => o.id === selectedId);
    const factor = currentCase.comorbidities[0] || "the patient's clinical profile";
    const risk = currentCase.avoidList.length > 0
      ? currentCase.avoidList[0].split("–")[0].trim()
      : "agents with unfavorable side-effect profiles";
    setExplanation(
      `I chose ${selected?.label} because of ${factor} and to avoid ${risk}. This agent addresses the primary clinical concern while minimizing adverse effects for this patient.`
    );
  };

  const handleSelect = useCallback(
    (id: string) => {
      if (locked) return;
      setSelectedId(id);
    },
    [locked]
  );

  const handleLock = () => {
    if (!selectedId || explanation.length < MIN_CHARS) return;
    setLocked(true);
    const correct = selectedId === currentCase.correctOptionId;
    setResults((prev) => [...prev, correct]);

    setTimeout(() => {
      const lower = explanation.toLowerCase();
      const caseChecks = reasoningChecksByCase[currentCase.id] ?? [];
      const hitCount = Math.min(caseChecks.filter(c => c.keywords.some(kw => lower.includes(kw.toLowerCase()))).length, 4);
      let delta = correct ? 2 : -4;
      const reasoningBonus = hitCount <= 1 ? 0 : hitCount === 2 ? 1 : 2;
      delta += reasoningBonus;
      if (hitCount === 0) delta -= 1;
      setCurrency(prev => Math.max(0, prev + delta));
      const sign = delta >= 0 ? "+" : "";
      setDeltaText(`${sign}${delta} this round`);
    }, 0);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalCases) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedId(null);
      setExplanation("");
      setLocked(false);
      setShowGuidelines(false);
      setShowReasoning(false);
      setShowAnalysis(false);
      setResults((prev) => prev);
      setDeltaText(null);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedId(null);
    setExplanation("");
    setLocked(false);
    setShowGuidelines(false);
    setShowReasoning(false);
    setShowAnalysis(false);
    setResults([]);
    setFinished(false);
  };

  const correctCount = results.filter(Boolean).length;
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / totalCases) * 100;
  const correctOption = currentCase.options.find((o) => o.id === currentCase.correctOptionId);

  if (finished) {
    const pct = Math.round((correctCount / totalCases) * 100);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-6 p-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Session Complete</h2>
            <div className="text-6xl font-extrabold text-primary">{pct}%</div>
            <p className="text-muted-foreground">
              {correctCount} / {totalCases} correct
            </p>
            <div className="space-y-3 pt-2">
              <button
                onClick={handleRestart}
                className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
              >
                <RotateCcw className="h-5 w-5" /> Restart
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground transition hover:brightness-110"
              >
                Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="pl-16 sm:pl-20">
            <h1 className="text-sm font-bold text-foreground tracking-wide">Study Mode</h1>
          </div>
          <div className="flex items-center gap-1.5 pr-16 sm:pr-20">
            <Coins className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-sm font-bold text-foreground">{currency}</span>
            {deltaText && (
              <span className={`text-[10px] font-semibold ml-1 ${deltaText.startsWith("+") ? "text-success" : deltaText.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
                {deltaText}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Case {currentIndex + 1} of {totalCases}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Patient card — boxed */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground leading-snug tracking-tight">{currentCase.patient_stem_short}</h2>
                {currentCase.backgroundFlag && (
                  <span className="text-sm text-muted-foreground ml-3 shrink-0">
                    {currentCase.backgroundFlag} {currentCase.backgroundCountry}
                  </span>
                )}
              </div>

              {/* Labs — inline pills */}
              <div className="flex flex-wrap gap-2">
                <LabPill label="A1C" value={currentCase.metrics.a1c} />
                <LabPill label="eGFR" value={currentCase.metrics.egfr} />
                <LabPill label="BMI" value={currentCase.metrics.bmi} />
              </div>

              {/* Clinical details */}
              <div className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground/70">Hx: </span>
                {currentCase.comorbidities.join(" · ")}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed -mt-1">
                <span className="font-medium text-foreground/70">Meds: </span>
                {currentCase.current_meds.join(", ")}
              </div>
            </CardContent>
          </Card>

          {/* Question */}
          <h3 className="text-center text-base font-bold text-foreground tracking-tight">
            Best next medication?
          </h3>

          {/* Answer options — card buttons */}
          <div className="space-y-2">
            {shuffledOptions.map((opt) => {
              let style = "border-border hover:border-primary/40 hover:bg-primary/5";
              if (isAnswered) {
                if (opt.originalId === currentCase.correctOptionId) {
                  style = "border-success/40 bg-success/5";
                } else if (opt.originalId === selectedId) {
                  style = "border-destructive/40 bg-destructive/5";
                } else {
                  style = "border-border opacity-50";
                }
              } else if (opt.originalId === selectedId) {
                style = "border-primary bg-primary/8 ring-1 ring-primary/20";
              }
              return (
                <button
                  key={opt.originalId}
                  onClick={() => handleSelect(opt.originalId)}
                  disabled={locked}
                  className={`w-full rounded-lg border py-3 px-4 text-left text-sm transition-all ${style} ${!locked ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="font-semibold mr-1.5 text-muted-foreground">{opt.displayLabel}.</span>
                  <span className="font-medium text-foreground">{opt.label}</span>
                  {isAnswered && opt.originalId === currentCase.correctOptionId && (
                    <CheckCircle2 className="inline ml-2 h-3.5 w-3.5 text-success" />
                  )}
                  {isAnswered && opt.originalId === selectedId && opt.originalId !== currentCase.correctOptionId && (
                    <XCircle className="inline ml-2 h-3.5 w-3.5 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation step */}
          {isSelected && !locked && (
            <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardContent className="p-4 space-y-3">
                <label className="text-sm font-semibold text-foreground">Explain your reasoning</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Reference the drug's mechanism, patient-specific goals, and key risks…"
                  className="w-full min-h-[110px] rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y border border-border"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${explanation.length >= MIN_CHARS ? "text-success" : "text-muted-foreground"}`}>
                      {explanation.length}/{MIN_CHARS} min
                    </span>
                    <button
                      onClick={handleAutoFill}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-fill
                    </button>
                  </div>
                  <button
                    onClick={handleLock}
                    disabled={explanation.length < MIN_CHARS}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground flex items-center gap-1.5 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Lock className="h-3.5 w-3.5" /> Submit
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post-answer feedback */}
          {isAnswered && (
            <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardContent className="p-4 space-y-4">
                {/* Result indicator */}
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-sm font-bold text-success">Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-bold text-destructive">
                        Incorrect — {correctDisplayLabel}. {correctOption?.label}
                      </span>
                    </>
                  )}
                </div>

                {isCorrect && reasoningResults && reasoningResults.score === 0 && (
                  <p className="text-xs text-center text-warning italic">Correct, but reasoning lacked depth.</p>
                )}

                {/* Clinical Rationale */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary/80">Clinical Rationale</h4>
                  <ul className="space-y-1.5">
                    {currentCase.whyCorrect.slice(0, 3).map((w, i) => (
                      <li key={i} className="text-sm text-foreground/90 leading-relaxed pl-3 relative before:content-['–'] before:absolute before:left-0 before:text-muted-foreground">{w}</li>
                    ))}
                  </ul>
                  {!isCorrect && selectedId && (
                    <p className="text-sm text-destructive/80 mt-2 pl-3 border-l-2 border-destructive/20">
                      {currentCase.incorrectRationale?.[selectedId] || "This option lacks the specific clinical benefit needed for this patient's profile."}
                    </p>
                  )}
                </div>

                {/* Reasoning quality */}
                {reasoningResults && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Reasoning</span>
                    <span className={`text-xs font-bold ${
                      reasoningResults.score <= 1 ? "text-destructive/80" :
                      reasoningResults.score === 2 ? "text-warning/80" :
                      "text-success/80"
                    }`}>
                      {reasoningResults.score}/4
                    </span>
                    {reasoningResults.prioritySignal && (
                      <span className="text-xs text-muted-foreground italic">— {reasoningResults.prioritySignal}</span>
                    )}
                  </div>
                )}

                <div className="h-px bg-border" />

                {/* Collapsible: Your Reasoning */}
                <CollapsibleSection
                  title="Your Reasoning"
                  open={showReasoning}
                  onToggle={() => setShowReasoning(!showReasoning)}
                >
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{explanation}</p>
                </CollapsibleSection>

                {/* Collapsible: Reasoning Analysis */}
                {reasoningResults && (
                  <CollapsibleSection
                    title="Reasoning Analysis"
                    open={showAnalysis}
                    onToggle={() => setShowAnalysis(!showAnalysis)}
                  >
                    <div className="space-y-3">
                      {reasoningResults.lowQuality && (
                        <div className="flex items-start gap-2 text-xs text-warning/80">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>Low-quality explanation — reference specific mechanisms, risks, and patient factors.</span>
                        </div>
                      )}
                      {reasoningResults.hits.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-success/80">Considered</p>
                          {reasoningResults.hits.map((h, i) => (
                            <p key={i} className="text-sm text-foreground/80 pl-3">– {h.label}: {h.hitFeedback}</p>
                          ))}
                        </div>
                      )}
                      {reasoningResults.misses.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-destructive/80">Overlooked</p>
                          {reasoningResults.misses.map((m, i) => (
                            <p key={i} className="text-sm text-muted-foreground pl-3">– {m.label}: {m.missFeedback}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Avoid list */}
                {currentCase.avoidList.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-destructive/70">Avoid</h4>
                    {currentCase.avoidList.map((a, i) => (
                      <p key={i} className="text-sm text-muted-foreground pl-3">– {a}</p>
                    ))}
                  </div>
                )}

                <div className="h-px bg-border" />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleNext}
                    className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    {currentIndex + 1 < totalCases ? (
                      <>Next Case <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      "Finish Session"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setStudySnapshot({
                        caseData: currentCase,
                        caseIndex: currentIndex,
                        totalCases,
                        selectedId: selectedId!,
                        isCorrect,
                        explanation,
                        correctDisplayLabel,
                        reasoningScore: reasoningResults?.score ?? 0,
                        prioritySignal: reasoningResults?.prioritySignal ?? "",
                        hits: reasoningResults?.hits.map(h => ({ label: h.label, hitFeedback: h.hitFeedback })) ?? [],
                        misses: reasoningResults?.misses.map(m => ({ label: m.label, missFeedback: m.missFeedback })) ?? [],
                      });
                      navigate("/study/breakdown");
                    }}
                    className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground flex items-center gap-1.5 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    <FileText className="h-4 w-4" /> Breakdown
                  </button>
                </div>

                {/* Guidelines toggle */}
                <CollapsibleSection
                  title="Guidelines"
                  open={showGuidelines}
                  onToggle={() => setShowGuidelines(!showGuidelines)}
                >
                  <div className="space-y-1">
                    {currentCase.guidelines.map((g, i) => (
                      <p key={i} className="text-sm text-muted-foreground">– {g}</p>
                    ))}
                  </div>
                </CollapsibleSection>
              </CardContent>
            </Card>
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
};

/* ── Reusable components ── */

const LabPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground">{value}</span>
  </div>
);

const CollapsibleSection = ({ title, open, onToggle, children }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div>
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      {title}
    </button>
    {open && (
      <div className="mt-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
        {children}
      </div>
    )}
  </div>
);

export default StudyMode;
