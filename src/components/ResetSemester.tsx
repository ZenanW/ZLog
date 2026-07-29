"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { btnDanger, btnSecondary } from "@/lib/ui";

interface ResetSemesterProps {
  onReset: () => Promise<boolean>;
}

export default function ResetSemester({ onReset }: ResetSemesterProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    setError(false);
    const ok = await onReset();
    setBusy(false);
    if (ok) {
      setOpen(false);
    } else {
      setError(true);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost flex items-center gap-1.5 p-2 text-xs btn-danger-ghost"
        title="New semester reset — clear all courses and exams"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh Semester</span>
      </button>

      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "var(--overlay-bg)" }}
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="panel w-full max-w-sm p-5"
              style={{ background: "var(--detail-bg)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "var(--alert)" }} />
                <h2 className="font-display text-lg" style={{ color: "var(--foreground)" }}>
                  Start a new semester?
                </h2>
              </div>

              <p className="mb-1 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                This permanently deletes <strong>all subjects, lectures, uploaded PDFs (including
                their AI analyses), exams, topics, and practice tests</strong>.
              </p>
              <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                This cannot be undone.
              </p>

              {error && (
                <p className="mb-3 text-xs" style={{ color: "var(--alert)" }}>Reset failed — please try again.</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className={btnDanger}
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {busy ? "Clearing..." : "Delete everything"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
