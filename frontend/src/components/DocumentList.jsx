// src/components/DocumentList.jsx
import React, { useState } from "react";
import { API_BASE_URL } from "../api/client";

/**
 * groups docs by extension or mime fallback
 */
function groupByExtension(documents) {
  const groups = {};
  documents.forEach((doc) => {
    let ext = "unknown";
    if (doc.originalFileName && doc.originalFileName.includes(".")) {
      ext = doc.originalFileName.split(".").pop().toLowerCase();
    } else if (doc.mimeType) {
      ext = doc.mimeType.split("/").pop().toLowerCase();
    }
    if (!groups[ext]) groups[ext] = [];
    groups[ext].push(doc);
  });
  return groups;
}

/**
 * DocumentList
 *
 * Props:
 * - documents: array of document objects
 * - onSelect: function(id) -> called when document clicked
 * - selectedId: currently selected document id
 * - onDelete: optional async function(id, opts) -> handle deletion in parent (recommended)
 */
export default function DocumentList({
  documents,
  onSelect,
  selectedId,
  onDelete,
}) {
  const [confirmId, setConfirmId] = useState(null); // id to confirm delete
  const [deleting, setDeleting] = useState(false); // deletion loading flag
  const [error, setError] = useState(null);

  if (!documents || documents.length === 0) {
    return (
      <div className="mt-4 text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/70 rounded-2xl px-4 py-3">
        No documents uploaded yet.
      </div>
    );
  }

  const grouped = groupByExtension(documents);
  const extensions = Object.keys(grouped).sort();

  const openConfirm = (id) => {
    setError(null);
    setConfirmId(id);
  };

  const closeConfirm = () => {
    if (!deleting) {
      setConfirmId(null);
      setError(null);
    }
  };

  /**
   * Called when user confirms delete in the custom modal.
   * If parent supplied `onDelete`, we call it with an opts object:
   *   onDelete(id, { skipConfirm: true })
   * The skipConfirm flag tells the parent not to show another confirm
   * (so that only the custom modal is used).
   *
   * If parent didn't supply onDelete, the component will call the
   * backend DELETE endpoint itself as a fallback and then reload the page
   * to sync UI. (You can change this behavior if you prefer.)
   */
  const handleDeleteConfirmed = async () => {
    if (!confirmId) return;
    setDeleting(true);
    setError(null);

    try {
      if (typeof onDelete === "function") {
        // Tell parent "we already confirmed" so it should NOT show a native confirm
        await onDelete(confirmId, { skipConfirm: true });
      } else {
        // Fallback: call backend DELETE endpoint directly (no extra confirm)
        const res = await fetch(`${API_BASE_URL}/documents/${confirmId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(
            `Delete failed (${res.status})${text ? `: ${text}` : ""}`
          );
        }

        // best-effort sync: if parent doesn't update state, reload to show changes
        // (This fallback keeps behavior predictable).
        window.location.reload();
      }

      // success -> close modal
      setConfirmId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className="flex-1 rounded-2xl border border-slate-800/70 bg-slate-950/90 p-4 
             shadow-[0_18px_45px_rgba(15,23,42,0.65)] 
             overflow-y-auto no-scrollbar mt-2 backdrop-blur-lg 
             max-h-[330px]"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold tracking-wide text-slate-100">
            Uploaded Documents
          </h3>
          <span className="text-[10px] text-slate-500">
            {documents.length} file{documents.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-4">
          {extensions.map((ext) => (
            <div key={ext}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {ext === "unknown" ? "Other" : `${ext} files`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {grouped[ext].length}
                </span>
              </div>

              <ul className="space-y-1.5">
                {grouped[ext].map((doc) => {
                  const isSelected = selectedId === doc.id;
                  return (
                    <li key={doc.id}>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => onSelect && onSelect(doc.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12px] border transition-all duration-150
                    ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-400/80 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                        : "bg-slate-900/70 border-slate-800/80 text-slate-100 hover:bg-slate-900 hover:border-slate-600/80 hover:shadow-[0_0_14px_rgba(15,23,42,0.75)]"
                    }`}
                        >
                          <div className="flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {doc.originalFileName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {doc.mimeType}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border border-slate-700/80 bg-slate-900/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                                <span className="text-[9px] uppercase tracking-[0.16em] text-slate-300">
                                  {doc.originalFileName &&
                                  doc.originalFileName.includes(".")
                                    ? doc.originalFileName
                                        .split(".")
                                        .pop()
                                        .toLowerCase()
                                    : "file"}
                                </span>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  // prevent the parent button's onClick (selection)
                                  e.stopPropagation();
                                  openConfirm(doc.id);
                                }}
                                title="Delete file"
                                className="inline-flex items-center justify-center p-1 rounded-md border border-transparent hover:bg-red-600/20 transition"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-rose-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 7h12M9 7v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7M10 7V4h4v3"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!deleting) closeConfirm();
            }}
          />

          {/* modal card */}
          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-[0_18px_45px_rgba(2,6,23,0.75)] p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-rose-500/10 cursor-pointer border border-rose-400/20 flex items-center justify-center"
                  onClick={closeConfirm}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-rose-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7L5 21M5 7l14 14"
                      />
                    </svg>
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-50">
                    Delete file
                  </h3>
                  <p className="text-[13px] text-slate-400 mt-1">
                    Are you sure you want to permanently delete this file?
                    This action cannot be undone.
                  </p>

                  {error && (
                    <p className="mt-3 text-xs text-rose-300">{error}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={deleting}
                  className="px-3 py-2 rounded-full text-[13px] bg-slate-800/60 border border-slate-700/70 text-slate-200 hover:bg-slate-800/80 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] bg-rose-600 hover:bg-rose-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.18)] transition disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete file"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
