import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { seedCases, CaseData } from "@/data/cases";
import { reasoningChecksByCase, ReasoningCheck } from "@/data/reasoningChecks";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowRight, RotateCcw, Activity, Lock, AlertTriangle, Sparkles, Coins } from "lucide-react";
import { shuffleOptions } from "@/lib/shuffleOptions";
import { setRoundActive } from "@/components/AppShell";

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
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [currency, setCurrency] = useState(getStoredCurrency);
  const [deltaText, setDeltaText] = useState<string | null>(null);

  // Signal round-active to global shell
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
      setDeltaText(null);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedId(null);
    setExplanation("");
    setLocked(false);
    setShowGuidelines(false);
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
        <div className="w-full max-w-md text-center space-y-8">
          <div className="rounded-2xl bg-card p-8 space-y-4 border border-border">
            <h2 className="text-2xl font-extrabold text-foreground">Session Complete</h2>
            <div className="text-6xl font-extrabold text-primary">{pct}%</div>
            <p className="text-muted-foreground">
              {correctCount} / {totalCases} correct
            </p>
          </div>
          <div className="space-y-3">
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header — no local Home button */}
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2 pl-16 sm:pl-20">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Diabetes Decision Trainer</span>
          </div>
          <div className="flex flex-col items-end relative">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{currency}</span>
            </div>
            {deltaText && (
              <span className={`text-[10px] font-semibold ${deltaText.startsWith("+") ? "text-success" : deltaText.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
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
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{currentIndex + (isAnswered ? 1 : 0)}/{totalCases}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Patient card */}
          <div className="rounded-2xl bg-card border border-border px-5 py-5 space-y-0">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-foreground leading-snug">{currentCase.patient_stem_short}</h2>
              {currentCase.backgroundFlag && (
                <div className="flex flex-col items-center ml-2">
                  <span className="text-xl leading-none">{currentCase.backgroundFlag}</span>
                  <span className="text-[9px] text-muted-foreground">{currentCase.backgroundCountry}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <MetricChip label="A1C" value={currentCase.metrics.a1c} />
              <MetricChip label="eGFR" value={currentCase.metrics.egfr} />
              <MetricChip label="BMI" value={currentCase.metrics.bmi} />
            </div>

            <div className="border-t border-border/60 my-0 !mt-4" />

            <div className="pt-3 pb-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Comorbidities</h3>
              <ul className="space-y-1">
                {currentCase.comorbidities.map((c, i) => (
                  <li key={i} className="text-sm text-foreground/90 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">{c}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border/60" />

            <div className="pt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Medications</h3>
              <ul className="space-y-1">
                {currentCase.current_meds.map((m, i) => (
                  <li key={i} className="text-sm text-foreground/90 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">{m}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-sm font-semibold text-foreground">Select the best next medication.</p>

          {/* Answer options — shuffled */}
          <div className="space-y-2">
            {shuffledOptions.map((opt) => {
              let variant = "bg-secondary text-secondary-foreground border-border";
              if (isAnswered) {
                if (opt.originalId === currentCase.correctOptionId) {
                  variant = "bg-success/15 text-success border-success/40";
                } else if (opt.originalId === selectedId) {
                  variant = "bg-destructive/15 text-destructive border-destructive/40";
                } else {
                  variant = "bg-secondary/50 text-muted-foreground border-border opacity-60";
                }
              } else if (opt.originalId === selectedId) {
                variant = "bg-primary/15 text-primary border-primary/50";
              }
              return (
                <button
                  key={opt.originalId}
                  onClick={() => handleSelect(opt.originalId)}
                  disabled={locked}
                  className={`w-full rounded-xl border py-3 px-4 text-left text-sm font-medium transition active:scale-[0.98] ${variant} ${!locked ? "hover:border-primary/50 hover:bg-primary/5 cursor-pointer" : "cursor-default"}`}
                >
                  <span className="font-bold mr-2">{opt.displayLabel}.</span>
                  {opt.label}
                  {isAnswered && opt.originalId === currentCase.correctOptionId && (
                    <CheckCircle2 className="inline ml-2 h-4 w-4 text-success" />
                  )}
                  {isAnswered && opt.originalId === selectedId && opt.originalId !== currentCase.correctOptionId && (
                    <XCircle className="inline ml-2 h-4 w-4 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation step */}
          {isSelected && !locked && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Explain your choice (required)</h3>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain the drug's mechanism, what goal you're targeting for this patient, and key risks/contraindications…"
                  className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${explanation.length >= MIN_CHARS ? "text-success" : "text-muted-foreground"}`}>
                    {explanation.length}/{MIN_CHARS} characters min
                  </span>
                  <button
                    onClick={handleLock}
                    disabled={explanation.length < MIN_CHARS}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground flex items-center gap-2 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Lock className="h-4 w-4" /> Lock Answer
                  </button>
                </div>
                <button
                  onClick={handleAutoFill}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto-fill example reasoning
                </button>
              </div>
            </div>
          )}

          {/* Answer reveal */}
          {isAnswered && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`rounded-xl p-3 text-center font-bold text-sm ${isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {isCorrect ? "✓ Correct!" : `✗ Best Answer: ${correctDisplayLabel}. ${correctOption?.label}`}
              </div>

              {/* Clinical Rationale */}
              <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Clinical Rationale</h3>
                <ul className="space-y-1">
                  {currentCase.whyCorrect.slice(0, 3).map((w, i) => (
                    <li key={i} className="text-sm text-foreground">• {w}</li>
                  ))}
                </ul>
                {!isCorrect && selectedId && (
                  <div className="border-t border-border/60 pt-2 mt-2">
                    <p className="text-sm text-destructive">
                      ✗ {currentCase.incorrectRationale?.[selectedId] || "This option lacks the specific clinical benefit needed for this patient's profile."}
                    </p>
                  </div>
                )}
              </div>

              {isCorrect && reasoningResults && reasoningResults.score === 0 && (
                <p className="text-xs text-center text-warning font-medium italic">Correct answer, but shallow reasoning.</p>
              )}

              {reasoningResults && (
                <div className="rounded-xl bg-card border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reasoning quality</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      reasoningResults.score <= 1 ? "bg-destructive/15 text-destructive" :
                      reasoningResults.score === 2 ? "bg-warning/15 text-warning" :
                      "bg-success/15 text-success"
                    }`}>
                      {reasoningResults.score} / 4
                    </span>
                  </div>
                  {reasoningResults.prioritySignal && (
                    <p className="text-xs text-center text-muted-foreground italic">{reasoningResults.prioritySignal}</p>
                  )}
                </div>
              )}

              <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your reasoning</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{explanation}</p>
              </div>

              {reasoningResults && (
                <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reasoning analysis</h3>
                  {reasoningResults.lowQuality && (
                    <div className="flex items-center gap-2 rounded-lg bg-warning/15 border border-warning/30 px-3 py-2 text-xs font-medium text-warning">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Low-quality explanation — try to reference specific mechanisms, risks, and patient factors.
                    </div>
                  )}
                  {reasoningResults.hits.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-success mb-1">✓ You considered</p>
                      <ul className="space-y-0.5">
                        {reasoningResults.hits.map((h, i) => (
                          <li key={i} className="text-sm text-foreground">• {h.label} — {h.hitFeedback}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reasoningResults.misses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-destructive mb-1">✗ You overlooked</p>
                      <ul className="space-y-0.5">
                        {reasoningResults.misses.map((m, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {m.label} — {m.missFeedback}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Why {correctOption?.label}?</h3>
                <ul className="space-y-1">
                  {currentCase.whyCorrect.map((w, i) => (
                    <li key={i} className="text-sm text-foreground">• {w}</li>
                  ))}
                </ul>
              </div>

              {currentCase.avoidList.length > 0 && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">Avoid</h3>
                  <ul className="space-y-1">
                    {currentCase.avoidList.map((a, i) => (
                      <li key={i} className="text-sm text-foreground">• {a}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
              >
                {currentIndex + 1 < totalCases ? (
                  <>Next Case <ArrowRight className="h-4 w-4" /></>
                ) : (
                  "Finish Session"
                )}
              </button>

              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setShowGuidelines((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 text-sm font-semibold text-foreground"
                >
                  {showGuidelines ? "Hide guidelines" : "Show guidelines"}
                  {showGuidelines ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showGuidelines && (
                  <div className="px-4 py-3 space-y-1 bg-card animate-in fade-in slide-in-from-top-1 duration-200">
                    {currentCase.guidelines.map((g, i) => (
                      <p key={i} className="text-sm text-muted-foreground">• {g}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const MetricChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary/12 border border-primary/20 px-3 py-2 text-center">
    <span className="block text-[10px] font-bold uppercase tracking-widest text-primary/80">{label}</span>
    <p className="text-base font-extrabold text-foreground mt-0.5">{value}</p>
  </div>
);


export default StudyMode;
