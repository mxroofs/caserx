import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { seedCases, CaseData } from "@/data/cases";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Swords, Timer, Trophy } from "lucide-react";

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

const VersusMode = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("ready");
  const [activePlayer, setActivePlayer] = useState<0 | 1>(0);
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>([
    { score: 0, answered: 0, caseIndex: 0 },
    { score: 0, answered: 0, caseIndex: 0 },
  ]);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [roundResult, setRoundResult] = useState<{ confidence: Confidence; correct: boolean; delta: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPlayer = players[activePlayer];
  const currentCase: CaseData = seedCases[currentPlayer.caseIndex % seedCases.length];

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
      if (revealed || !confidence) return;
      setSelectedId(id);
    },
    [revealed, confidence]
  );

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
    setPlayers((prev) => {
      const next = [...prev] as [PlayerState, PlayerState];
      next[activePlayer] = {
        ...next[activePlayer],
        caseIndex: next[activePlayer].caseIndex + 1,
      };
      return next;
    });
    setSelectedId(null);
    setConfidence(null);
    setRevealed(false);
    setRoundResult(null);
  };

  const handleStartPlayerB = () => {
    setActivePlayer(1);
    setSelectedId(null);
    setConfidence(null);
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
    setConfidence(null);
    setRevealed(false);
    setRoundResult(null);
    setTimeLeft(TURN_SECONDS);
  };

  const timerPct = (timeLeft / TURN_SECONDS) * 100;
  const timerColor = timeLeft <= 10 ? "text-destructive" : timeLeft <= 20 ? "text-warning" : "text-foreground";

  // ── Ready screen ──
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Swords className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Versus Mode</h1>
            <p className="text-sm text-muted-foreground">
              Two players, {TURN_SECONDS}s each. Most correct answers wins.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleStart}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
            >
              Start Game
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground transition hover:brightness-110"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Handoff screen ──
  if (phase === "handoff") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-foreground">Time's up!</h2>
            <p className="text-muted-foreground">
              Player A scored <span className="font-bold text-primary">{players[0].score}</span> / {players[0].answered}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6 space-y-3">
            <Swords className="h-8 w-8 text-primary mx-auto" />
            <h3 className="text-lg font-bold text-foreground">Pass the device to Player B</h3>
            <p className="text-sm text-muted-foreground">Player B gets {TURN_SECONDS} seconds.</p>
          </div>
          <button
            onClick={handleStartPlayerB}
            className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-5 w-5" /> Player B — Go!
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  if (phase === "results") {
    const [a, b] = players;
    const winner = a.score > b.score ? "Player A" : b.score > a.score ? "Player B" : null;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="space-y-2">
            <Trophy className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-extrabold text-foreground">
              {winner ? `Winner: ${winner}!` : "It's a Tie!"}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ScoreCard label="Player A" score={a.score} answered={a.answered} highlight={a.score >= b.score} />
            <ScoreCard label="Player B" score={b.score} answered={b.answered} highlight={b.score >= a.score} />
          </div>
          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
            >
              <RotateCcw className="h-5 w-5" /> Play Again
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

  // ── Playing phase ──
  // playing phase

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {activePlayer === 0 ? "Player A" : "Player B"}'s turn
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              Score: <span className="text-foreground">{currentPlayer.score}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <Timer className={`h-4 w-4 ${timerColor}`} />
              <span className={`text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
            </div>
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? "bg-destructive" : timeLeft <= 20 ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4">
          {/* Condensed patient card */}
          <div className="rounded-2xl bg-card border border-border px-4 py-4 space-y-3">
            <h2 className="text-base font-semibold text-foreground">{currentCase.patient_stem_short}</h2>
            <div className="grid grid-cols-3 gap-2">
              <MiniChip label="A1C" value={currentCase.metrics.a1c} />
              <MiniChip label="eGFR" value={currentCase.metrics.egfr} />
              <MiniChip label="BMI" value={currentCase.metrics.bmi} />
            </div>
            <p className="text-xs text-muted-foreground">
              {currentCase.comorbidities.join(" · ")} — on {currentCase.current_meds.join(", ")}
            </p>
          </div>

          {/* Confidence selector */}
          <div className="space-y-1">
            <p className="text-center text-xs font-semibold text-muted-foreground">Your confidence?</p>
            <div className="flex justify-center gap-2">
              {(["low", "medium", "high"] as Confidence[]).map((level) => {
                const selected = confidence === level;
                const locked = selectedId !== null;
                return (
                  <button
                    key={level}
                    onClick={() => !locked && setConfidence(level)}
                    disabled={locked}
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition active:scale-[0.96] border ${
                      selected
                        ? "bg-primary/15 text-primary border-primary/50"
                        : locked
                        ? "bg-secondary/50 text-muted-foreground border-border opacity-50 cursor-default"
                        : "bg-secondary text-secondary-foreground border-border cursor-pointer hover:brightness-110"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question */}
          <p className="text-center text-sm font-semibold text-foreground">Best next medication?</p>

          {/* Options */}
          <div className="space-y-2">
            {currentCase.options.map((opt) => {
              const disabled = revealed || !confidence;
              let variant = disabled && !revealed
                ? "bg-secondary/50 text-muted-foreground border-border opacity-60"
                : "bg-secondary text-secondary-foreground border-border";
              if (revealed) {
                if (opt.id === currentCase.correctOptionId) {
                  variant = "bg-success/15 text-success border-success/40";
                } else if (opt.id === selectedId) {
                  variant = "bg-destructive/15 text-destructive border-destructive/40";
                } else {
                  variant = "bg-secondary/50 text-muted-foreground border-border opacity-60";
                }
              } else if (opt.id === selectedId) {
                variant = "bg-primary/15 text-primary border-primary/50";
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={disabled}
                  className={`w-full rounded-xl border py-2.5 px-4 text-left text-sm font-medium transition active:scale-[0.98] ${variant} ${!disabled ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="font-bold mr-2">{opt.id}.</span>
                  {opt.label}
                  {revealed && opt.id === currentCase.correctOptionId && (
                    <CheckCircle2 className="inline ml-2 h-4 w-4 text-success" />
                  )}
                  {revealed && opt.id === selectedId && opt.id !== currentCase.correctOptionId && (
                    <XCircle className="inline ml-2 h-4 w-4 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm / Next */}
          {selectedId && !revealed && (
            <button
              onClick={handleConfirm}
              className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
            >
              Confirm
            </button>
          )}
          {revealed && roundResult && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className={`rounded-xl p-2.5 text-center font-bold text-sm ${roundResult.correct ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {roundResult.correct ? "✓ Correct!" : `✗ Answer: ${currentCase.correctOptionId}`}
              </div>
              <p className={`text-center text-xs font-semibold ${roundResult.delta > 0 ? "text-success" : roundResult.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                Confidence: <span className="capitalize">{roundResult.confidence}</span> | Result: {roundResult.correct ? "Correct" : "Incorrect"} → {roundResult.delta > 0 ? "+" : ""}{roundResult.delta}
              </p>
              <button
                onClick={handleNextCase}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const MiniChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary/12 border border-primary/20 px-2 py-1.5 text-center">
    <span className="block text-[9px] font-bold uppercase tracking-widest text-primary/80">{label}</span>
    <p className="text-sm font-extrabold text-foreground">{value}</p>
  </div>
);

const ScoreCard = ({ label, score, answered, highlight }: { label: string; score: number; answered: number; highlight: boolean }) => (
  <div className={`rounded-2xl border p-5 space-y-1 ${highlight ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-3xl font-extrabold text-foreground">{score}</p>
    <p className="text-xs text-muted-foreground">{answered} answered</p>
  </div>
);

export default VersusMode;
