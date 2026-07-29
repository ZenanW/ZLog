"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, ExternalLink, Trash2, Loader2, Sparkles } from "lucide-react";
import { LecturePdf, PdfKind } from "@/lib/types";
import { btnIcon, btnIconDanger, btnSecondary, filterActive, filterInactive, microLabel, priorityChip } from "@/lib/ui";

interface LecturePdfsProps {
  lectureId: string;
  idToken: string | null;
  onPdfsChange?: (pdfs: LecturePdf[]) => void;
}

const kindLabels: Record<PdfKind, string> = {
  lecture_slides: "Slides",
  tutorial_sheet: "Tutorial",
};

const MAX_SIZE = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function friendlyError(message: string): string {
  if (/pdf_documents/.test(message) && /schema cache|does not exist/i.test(message)) {
    return "Database table missing — run scripts/migrations/001_pdf_documents.sql in the Supabase SQL editor.";
  }
  return message;
}

export default function LecturePdfs({ lectureId, idToken, onPdfsChange }: LecturePdfsProps) {
  const [pdfs, setPdfs] = useState<LecturePdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<PdfKind>("lecture_slides");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onPdfsChange?.(pdfs);
  }, [pdfs, onPdfsChange]);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/pdfs?lectureId=${encodeURIComponent(lectureId)}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to load PDFs");
        return res.json();
      })
      .then((data: LecturePdf[]) => {
        if (!cancelled) setPdfs(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(friendlyError(err.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lectureId, idToken]);

  const handleFileSelected = async (file: File) => {
    if (!idToken) return;
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File exceeds the 20MB limit.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("lectureId", lectureId);
      form.append("kind", kind);
      const res = await fetch("/api/pdfs", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed");
      setPdfs((p) => [...p, body as LecturePdf]);
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const openPdf = async (pdf: LecturePdf) => {
    if (!idToken) return;
    setError(null);
    try {
      const res = await fetch(`/api/pdfs/sign?id=${encodeURIComponent(pdf.id)}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not open PDF");
      window.open(body.url, "_blank", "noopener");
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Could not open PDF"));
    }
  };

  const deletePdf = async (pdf: LecturePdf) => {
    if (!idToken) return;
    setError(null);
    const prev = pdfs;
    setPdfs((p) => p.filter((x) => x.id !== pdf.id));
    try {
      const res = await fetch(`/api/pdfs?id=${encodeURIComponent(pdf.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setPdfs(prev);
      setError("Delete failed.");
    }
  };

  const analyzePdf = async (pdf: LecturePdf) => {
    if (!idToken || analyzing.has(pdf.id)) return;
    setError(null);
    setAnalyzing((s) => new Set(s).add(pdf.id));
    try {
      const res = await fetch("/api/pdfs/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: pdf.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Analysis failed");
      setPdfs((p) => p.map((x) => (x.id === pdf.id ? (body as LecturePdf) : x)));
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Analysis failed"));
    } finally {
      setAnalyzing((s) => {
        const next = new Set(s);
        next.delete(pdf.id);
        return next;
      });
    }
  };

  return (
    <div>
      <label className={`${microLabel} mb-1 flex items-center gap-1`}>
        <FileText className="h-3 w-3" /> PDFs
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(Object.keys(kindLabels) as PdfKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`border px-2.5 py-1.5 text-xs font-medium transition-all ${
                kind === k ? filterActive : filterInactive
              }`}
            >
              {kindLabels[k]}
            </button>
          ))}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !idToken}
          className={btnSecondary}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : `Upload ${kindLabels[kind]} PDF`}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFileSelected(file);
          }}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--alert)" }}>{error}</p>
      )}

      {loading ? (
        <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading PDFs...</p>
      ) : pdfs.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {pdfs.map((pdf) => {
            const isAnalyzing = analyzing.has(pdf.id);
            return (
              <div key={pdf.id} className="panel px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--foreground)" }} title={pdf.name}>
                    {pdf.name}
                  </span>
                  <span className="badge badge-quiet shrink-0">{kindLabels[pdf.kind]}</span>
                  <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {formatSize(pdf.size)}
                  </span>
                  <button
                    onClick={() => analyzePdf(pdf)}
                    disabled={isAnalyzing}
                    className={btnIcon}
                    title={pdf.analyzedAt ? "Re-analyze with AI" : "Analyze with AI"}
                  >
                    {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openPdf(pdf)} className={btnIcon} title="Open PDF">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deletePdf(pdf)} className={btnIconDanger} title="Delete PDF">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isAnalyzing && !pdf.analyzedAt && (
                  <p className="mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    Analyzing with Claude — this can take up to a minute for large PDFs...
                  </p>
                )}

                {pdf.analyzedAt && pdf.summary && (
                  <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {pdf.priorityRecommendation && (
                        <span className={`px-2 py-0.5 text-[10px] font-medium capitalize ${priorityChip(pdf.priorityRecommendation, true)}`}>
                          {pdf.priorityRecommendation} priority
                        </span>
                      )}
                      {pdf.difficulty !== null && (
                        <span className="chip px-2 py-0.5 text-[10px] font-medium">
                          Difficulty {pdf.difficulty}/7
                        </span>
                      )}
                    </div>
                    <p className="font-display text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>{pdf.summary}</p>
                    {pdf.priorityReason && (
                      <p className="text-[11px] italic leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {pdf.priorityReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          No PDFs yet. Upload lecture slides or a tutorial sheet, then analyze with AI.
        </p>
      )}
    </div>
  );
}
