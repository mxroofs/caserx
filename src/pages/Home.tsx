import { useNavigate } from "react-router-dom";
import { Activity, Swords } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-10">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Activity className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Diabetes Decision Trainer
          </h1>
          <p className="text-muted-foreground text-sm">
            Master T2DM pharmacotherapy — one case at a time.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/study")}
            className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
          >
            Study Mode
          </button>
          <button
              onClick={() => navigate("/versus")}
              className="w-full rounded-xl bg-secondary py-4 text-lg font-bold text-secondary-foreground flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.98]"
            >
              <Swords className="h-5 w-5" />
              Versus Mode
            </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
