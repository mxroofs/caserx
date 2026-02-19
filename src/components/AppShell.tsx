import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home } from "lucide-react";
import ExitConfirmDialog from "@/components/ExitConfirmDialog";

/**
 * Global app chrome — persistent top-left Home button on every page.
 * Uses a context-free approach: pages that need confirm-on-exit
 * register via the global ref below.
 */

// Global ref so pages can flag "round in progress"
let _roundActive = false;
export const setRoundActive = (v: boolean) => { _roundActive = v; };
export const isRoundActive = () => _roundActive;

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [showExitDialog, setShowExitDialog] = useState(false);

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
      {/* Global persistent Home button */}
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

      <Outlet />

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
