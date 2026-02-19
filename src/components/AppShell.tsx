import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, Sun, Moon } from "lucide-react";
import ExitConfirmDialog from "@/components/ExitConfirmDialog";
import { useTheme } from "@/hooks/useTheme";

// Global ref so pages can flag "round in progress"
let _roundActive = false;
export const setRoundActive = (v: boolean) => { _roundActive = v; };
export const isRoundActive = () => _roundActive;

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleHomeClick = () => {
    if (isHome) return;
    if (_roundActive) {
      setShowExitDialog(true);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Global top bar */}
      {!isHome && (
        <button
          onClick={handleHomeClick}
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 active:scale-[0.96] max-sm:px-1.5 max-sm:py-1.5"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
      )}

      {/* Theme toggle — global, all pages */}
      <button
        onClick={toggleTheme}
        className="fixed z-50 flex items-center justify-center rounded-xl p-2.5 transition active:scale-[0.98] top-0.5 right-3 text-muted-foreground hover:text-foreground hover:bg-secondary/80 max-sm:top-auto max-sm:right-auto max-sm:bottom-4 max-sm:left-4 max-sm:rounded-xl max-sm:backdrop-blur-md max-sm:shadow-lg max-sm:shadow-black/30 max-sm:border max-sm:text-foreground dark:max-sm:bg-black/35 dark:max-sm:border-white/15 max-sm:bg-white/70 max-sm:border-black/10 max-sm:hover:bg-white/80 dark:max-sm:hover:bg-black/45"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      <Outlet />

      {/* Global Insuwin attribution */}
      <span className="fixed bottom-3 right-3 z-40 rounded-full border border-border/40 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 select-none backdrop-blur-sm pointer-events-none">
        An Insuwin platform
      </span>

      <ExitConfirmDialog
        open={showExitDialog}
        onCancel={() => setShowExitDialog(false)}
        onConfirm={() => {
          setShowExitDialog(false);
          navigate("/");
        }}
      />
    </>
  );
};

export default AppShell;
