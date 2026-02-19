import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExitConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ExitConfirmDialog = ({ open, onCancel, onConfirm }: ExitConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
    <DialogContent className="max-w-xs">
      <DialogHeader>
        <DialogTitle>Exit to Home?</DialogTitle>
        <DialogDescription>Your current round will end.</DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex flex-row items-center justify-center gap-3 sm:justify-end">
        <Button variant="secondary" onClick={onCancel} className="min-h-[40px] px-5">
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} className="min-h-[40px] px-5">
          Exit
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ExitConfirmDialog;
