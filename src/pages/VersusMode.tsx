import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { seedCases, CaseData } from "@/data/cases";
import { getGuidelinesForCase } from "@/data/guidelineReferences";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Swords, Timer, Trophy, ChevronDown, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import { shuffleOptions } from "@/lib/shuffleOptions";
import { setRoundActive } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const TURN_SECONDS = 60;


type Phase = "ready" | "playing" | "handoff" | "results";
type Confidence = "low" | "medium" | "high";

interface PlayerState {
  score: number;
  answered: number;
  caseIndex: number;
}

const CONFIDENCE_POINTS: Record<Confidence, { correct: number; incorrect: number }> = {
  low: { correct: 0, incorrect: 0 },
  medium: { correct: 1, incorrect: -1 },
  high: { correct: 2, incorrect: -2 },
};

const getStoredNames = (): [string, string] => {
  try {
    const a = localStorage.getItem("versus_nameA") || "";
    const b = localStorage.getItem("versus_nameB") || "";
    return [a, b];
  } catch { return ["", ""]; }
};


const VersusMode = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("ready");
  const [activePlayer, setActivePlayer] = useState<0 | 1>(0);
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>([
    { score: 0, answered: 0, caseIndex: 0 },
    { score: 0, answered: 0, caseIndex: 0 },
  ]);
  const [nameA, setNameA] = useState(() => getStoredNames()[0]);
  const [nameB, setNameB] = useState(() => getStoredNames()[1]);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [showScoring, setShowScoring] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [roundResult, setRoundResult] = useState<{ confidence: Confidence; correct: boolean; delta: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiFiredRef = useRef(false);

  // Fire confetti on results screen — single short burst
  useEffect(() => {
    if (phase === "results" && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({
        particleCount: 80,
        spread: 360,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.45 },
        zIndex: 40,
        disableForReducedMotion: true,
        ticks: 60,
        gravity: 1.4,
        scalar: 0.7,
        decay: 0.92,
      });
    }
    if (phase === "ready") {
      confettiFiredRef.current = false;
    }
  }, [phase]);
  const displayName = (idx: 0 | 1) => {
    const raw = idx === 0 ? nameA : nameB;
    return raw.trim() || (idx === 0 ? "Player A" : "Player B");
  };

  const currentPlayer = players[activePlayer];
  const currentCase: CaseData = seedCases[currentPlayer.caseIndex % seedCases.length];

  const { options: shuffledOptions, correctDisplayLabel } = useMemo(
    () => shuffleOptions(currentCase, "versus"),
    [currentCase]
  );

  // Persist names
  useEffect(() => { try { localStorage.setItem("versus_nameA", nameA); } catch {} }, [nameA]);
  useEffect(() => { try { localStorage.setItem("versus_nameB", nameB); } catch {} }, [nameB]);
  // Signal round-active
  useEffect(() => {
    setRoundActive(phase === "playing");
    return () => setRoundActive(false);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (activePlayer === 0) {
            setPhase("handoff");
          } else {
            setPhase("results");
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, activePlayer]);


  const handleStart = () => {
    setPhase("playing");
    setTimeLeft(TURN_SECONDS);
  };

  const handleSelect = useCallback(
    (id: string) => {
      if (revealed) return;
      setSelectedId(id);
      // Do NOT reset confidence when selecting a medication
    },
    [revealed]
  );

  const advanceToNext = useCallback(() => {
    setPlayers((prev) => {
      const next = [...prev] as [PlayerState, PlayerState];
      next[activePlayer] = {
        ...next[activePlayer],
        caseIndex: next[activePlayer].caseIndex + 1,
      };
      return next;
    });
    setSelectedId(null);
    setConfidence("medium");
    setRevealed(false);
    setRoundResult(null);
  }, [activePlayer]);

  const handleConfirm = () => {
    if (!selectedId || !confidence) return;
    setRevealed(true);
    const correct = selectedId === currentCase.correctOptionId;
    const delta = correct ? CONFIDENCE_POINTS[confidence].correct : CONFIDENCE_POINTS[confidence].incorrect;
    setRoundResult({ confidence, correct, delta });
    setPlayers((prev) => {
      const next = [...prev] as [PlayerState, PlayerState];
      next[activePlayer] = {
        ...next[activePlayer],
        score: next[activePlayer].score + delta,
        answered: next[activePlayer].answered + 1,
      };
      return next;
    });
  };

  const handleNextCase = () => {
    advanceToNext();
  };

  const handleStartPlayerB = () => {
    setActivePlayer(1);
    setSelectedId(null);
    setConfidence("medium");
    setRevealed(false);
    setRoundResult(null);
    setTimeLeft(TURN_SECONDS);
    setPhase("playing");
  };

  const handleRestart = () => {
    setPhase("ready");
    setActivePlayer(0);
    setPlayers([
      { score: 0, answered: 0, caseIndex: 0 },
      { score: 0, answered: 0, caseIndex: 0 },
    ]);
    setSelectedId(null);
    setConfidence("medium");
    setRevealed(false);
    setRoundResult(null);
    setTimeLeft(TURN_SECONDS);
  };

  const timerPct = (timeLeft / TURN_SECONDS) * 100;
  const timerColor = timeLeft <= 10 ? "text-destructive" : timeLeft <= 20 ? "text-warning" : "text-muted-foreground";

  // ── Ready screen ──
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="space-y-3">
              <Swords className="h-8 w-8 text-primary mx-auto" />
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Versus Mode</h1>
              <p className="text-sm text-muted-foreground">
                Two players, {TURN_SECONDS}s each. Highest score wins.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Players</label>
              <Input
                placeholder="Player A"
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="h-10 text-sm"
                maxLength={20}
              />
              <Input
                placeholder="Player B"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="h-10 text-sm"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              Start Game
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Handoff screen ──
  if (phase === "handoff") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Time's up</h2>
              <p className="text-muted-foreground">
                {displayName(0)}: <span className="font-bold text-foreground">{players[0].score}</span> pts ({players[0].answered} answered)
              </p>
            </div>
            <div className="space-y-3 py-2">
              <Swords className="h-6 w-6 text-primary mx-auto" />
              <p className="text-lg font-bold text-foreground">{displayName(1)}'s turn</p>
              <p className="text-sm text-muted-foreground">{TURN_SECONDS} seconds</p>
            </div>
            <button
              onClick={handleStartPlayerB}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-5 w-5" /> {displayName(1)} — Ready
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Results screen ──
  if (phase === "results") {
    const [a, b] = players;
    const winner = a.score > b.score ? displayName(0) : b.score > a.score ? displayName(1) : null;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="relative z-50 w-full max-w-sm">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="space-y-2">
              <Trophy className="h-8 w-8 text-primary mx-auto" />
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                {winner ? `${winner} wins` : "It's a tie"}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard label={displayName(0)} score={a.score} answered={a.answered} highlight={a.score >= b.score} />
              <ScoreCard label={displayName(1)} score={b.score} answered={b.answered} highlight={b.score >= a.score} />
            </div>
            <button
              onClick={handleRestart}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
            >
              <RotateCcw className="h-5 w-5" /> Play Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Playing phase ──
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {/* Left: timer — extra left padding on mobile to clear fixed Home button */}
          <div className="flex items-center gap-1.5 w-16 flex-shrink-0 pl-8 sm:pl-0">
            <Timer className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${timerColor}`} />
            <span className={`text-sm font-bold tabular-nums whitespace-nowrap leading-none ${timerColor}`}>{timeLeft}s</span>
          </div>
          {/* Center: title */}
          <h1 className="text-sm font-bold text-foreground text-center">
            {displayName(activePlayer)}'s turn
          </h1>
          {/* Right: points */}
          <div className="flex items-center w-16 justify-end">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="font-bold text-foreground">{currentPlayer.score}</span> pts
            </span>
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? "bg-destructive/70" : timeLeft <= 20 ? "bg-warning/70" : "bg-primary/50"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4">
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
              <div className="flex flex-wrap gap-2">
                <LabPill label="A1C" value={currentCase.metrics.a1c} />
                <LabPill label="eGFR" value={currentCase.metrics.egfr} />
                <LabPill label="BMI" value={currentCase.metrics.bmi} />
              </div>
              <p className="text-sm text-muted-foreground">
                {currentCase.comorbidities.join(" · ")} — {currentCase.current_meds.join(", ")}
              </p>
            </CardContent>
          </Card>

          {/* Confidence */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Confidence</p>
            <div className="flex items-center justify-center gap-3">
              {(["low", "medium", "high"] as Confidence[]).map((level) => {
                const selected = confidence === level;
                const isLocked = revealed;
                return (
                  <button
                    key={level}
                    onClick={() => !isLocked && setConfidence(level)}
                    disabled={isLocked}
                    className={`rounded-full border px-5 py-1.5 text-xs font-bold capitalize transition ${
                      selected
                        ? "border-primary bg-primary/15 text-primary"
                        : isLocked
                        ? "border-border text-muted-foreground/40 cursor-default"
                        : "border-border text-muted-foreground hover:text-foreground cursor-pointer"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* How scoring works */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => setShowScoring(!showScoring)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition"
            >
              {showScoring ? "Hide scoring" : "How scoring works"}
              <ChevronDown className={`h-3 w-3 transition-transform ${showScoring ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showScoring && (
            <div className="text-[10px] text-muted-foreground text-center space-y-0.5 animate-in fade-in duration-150">
              <p>✓ High +2 · Med +1 · Low +0</p>
              <p>✗ High −2 · Med −1 · Low 0</p>
            </div>
          )}

          {/* Question */}
          <h3 className="text-center text-base font-bold text-foreground tracking-tight">Best next medication?</h3>

          {/* Options — card buttons */}
          <div className="space-y-2">
            {shuffledOptions.map((opt) => {
              const disabled = revealed;
              let style = "border-border hover:border-primary/40 hover:bg-primary/5";
              if (revealed) {
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
                  disabled={disabled}
                  className={`w-full rounded-lg border py-3 px-4 text-left text-sm transition-all ${style} ${!disabled ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="font-semibold mr-1.5 text-muted-foreground">{opt.displayLabel}.</span>
                  <span className="font-medium text-foreground">{opt.label}</span>
                  {revealed && opt.originalId === currentCase.correctOptionId && (
                    <CheckCircle2 className="inline ml-2 h-3.5 w-3.5 text-success" />
                  )}
                  {revealed && opt.originalId === selectedId && opt.originalId !== currentCase.correctOptionId && (
                    <XCircle className="inline ml-2 h-3.5 w-3.5 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm */}
          {selectedId && !revealed && (
            <button
              onClick={handleConfirm}
              className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              Confirm
            </button>
          )}

          {/* Feedback */}
          {revealed && roundResult && (
            <Card className="animate-in fade-in duration-200">
              <CardContent className="p-4 space-y-3">
                {/* Result indicator */}
                <div className="flex items-center justify-center gap-2">
                  {roundResult.correct ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-sm font-bold text-success">Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-bold text-destructive">Incorrect — {correctDisplayLabel}</span>
                    </>
                  )}
                </div>

                {/* Clinical rationale — compact */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary/80">
                    Why {currentCase.options.find(o => o.id === currentCase.correctOptionId)?.label}?
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{currentCase.whyCorrect[0]}</p>
                  {!roundResult.correct && selectedId && (
                    <p className="text-sm text-destructive/70 pl-3 border-l-2 border-destructive/20">
                      {currentCase.incorrectRationale?.[selectedId] || "This option lacks the specific benefit needed here."}
                    </p>
                  )}
                </div>

                <p className={`text-center text-xs font-semibold ${roundResult.delta > 0 ? "text-success/80" : roundResult.delta < 0 ? "text-destructive/80" : "text-muted-foreground"}`}>
                  <span className="capitalize">{roundResult.confidence}</span> · {roundResult.delta > 0 ? "+" : ""}{roundResult.delta}
                </p>

                {/* Guideline References */}
                {(() => {
                  const guidelines = getGuidelinesForCase(currentCase.id);
                  return guidelines.length > 0 ? (
                    <div className="border-t border-border/50 pt-3 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                        <FileText className="h-3 w-3" /> Guideline References
                      </p>
                      {guidelines.slice(0, 3).map((g, i) => (
                        <div key={i} className="text-xs text-foreground/70 pl-3 leading-relaxed">
                          {g.text}
                          <span className="text-[10px] text-muted-foreground/60 ml-1">— {g.source} ({g.year})</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Next */}
                <div className="border-t border-border/50 pt-3">
                  <button
                    onClick={handleNextCase}
                    className="w-full rounded-xl py-3 bg-primary font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

/* ── Shared components ── */

const LabPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground">{value}</span>
  </div>
);

const ScoreCard = ({ label, score, answered, highlight }: { label: string; score: number; answered: number; highlight: boolean }) => (
  <div className={`rounded-xl border p-5 space-y-1 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-3xl font-extrabold text-foreground">{score}</p>
    <p className="text-xs text-muted-foreground">{answered} answered</p>
  </div>
);

export default VersusMode;
