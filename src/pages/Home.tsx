import { useNavigate } from "react-router-dom";
import { Activity, Swords, Brain, Gauge, Users } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Icon + Title */}
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Diabetes Decision
              <br />
              <span className="text-primary">Trainer</span>
            </h1>
            <p className="mx-auto max-w-sm text-base text-muted-foreground leading-relaxed">
              Practice T2DM medication decisions with realistic patient cases.
            </p>
          </div>

          {/* CTAs */}
          <div className="mx-auto flex max-w-xs flex-col gap-3">
            <button
              onClick={() => navigate("/study")}
              className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              Study Mode
            </button>
            <button
              onClick={() => navigate("/versus")}
              className="w-full rounded-xl border border-border bg-card py-4 text-lg font-bold text-foreground flex items-center justify-center gap-2 shadow-sm transition hover:bg-secondary active:scale-[0.98]"
            >
              <Swords className="h-5 w-5 text-primary" />
              Versus Mode
            </button>
          </div>

          {/* Mode chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-3 py-1">
              Study: Learn + feedback
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1">
              Versus: 2-player speed rounds
            </span>
          </div>
        </div>
      </main>

      {/* Feature cards */}
      <section className="border-t border-border bg-card/50 px-4 py-14">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-primary" />}
            title="Case-based learning"
            description="Clinical rationale and guideline references after every answer."
          />
          <FeatureCard
            icon={<Gauge className="h-6 w-6 text-primary" />}
            title="Confidence scoring"
            description="Risk/reward system — high confidence means higher stakes."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6 text-primary" />}
            title="Two-player hot-seat"
            description="Timed rounds on one device. Compete for the top score."
          />
        </div>
      </section>

      {/* Credibility strip */}
      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Designed for clinical reasoning practice — not medical advice.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Made for learning · v1.0
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3 shadow-sm">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Home;
