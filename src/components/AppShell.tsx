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
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 active:scale-[0.96]"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
      )}

      {/* Theme toggle — global, all pages */}
      <button
        onClick={toggleTheme}
        className="fixed top-1.5 right-3 z-50 flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 active:scale-[0.96]"
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
