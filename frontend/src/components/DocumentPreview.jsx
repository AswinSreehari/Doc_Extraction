// src/components/DocumentPreview.jsx
import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/client";
import path from "path";

function formatBytes(bytes) {
  if (bytes === 0 || bytes === undefined || bytes === null) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}

/**
 * DocumentPreview
 * - Fetches the canonical PDF from the backend as a blob and renders it in an <iframe>.
 * - Shows extracted text or table preview when available (same layout as before).
 * - Provides a Download PDF button that downloads the blob (works even when fetched via JS).
 *
 * Note: If fetch to /documents/:id/pdf fails due to CORS, the component will try to open the
 * direct URL in a new tab as a fallback (this requires the browser to have access to that URL).
 */
export default function DocumentPreview({ document: doc }) {
  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-slate-300/70 rounded-2xl bg-slate-100/80 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 12h10M4 16h6" />
            </svg>
          </div>
          <p className="text-xs font-medium tracking-wide">
            Select a document on the left to preview its content.
          </p>
        </div>
      </div>
    );
  }

  const {
    id,
    originalFileName,
    mimeType,
    size,
    isTable,
    tableRows,
    extractedText,
  } = doc;

  const pdfApiUrl = `${API_BASE_URL}/documents/${id}/pdf`;
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const iframeRef = useRef(null);

  // Fetch PDF as blob and create object URL. Clean up previous URL on change/unmount.
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function fetchPdfBlob() {
      if (!id) return;
      setLoadingPdf(true);
      setPdfBlobUrl(null);

      try {
        const res = await fetch(pdfApiUrl, {
          method: "GET",
          // credentials: 'include' // uncomment if your endpoint requires cookies
        });

        if (!res.ok) {
          // fallback: try to open direct url in new tab if fetch blocked by CORS or server error
          console.warn(`PDF fetch failed (${res.status}). Falling back to direct URL open.`);
          window.open(pdfApiUrl, "_blank");
          return;
        }

        const blob = await res.blob();

        // Ensure it's a PDF blob
        if (blob.type && !blob.type.includes("pdf")) {
          console.warn("Fetched blob is not 'application/pdf' — blob.type:", blob.type);
          // still proceed but note it
        }

        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPdfBlobUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        console.error("Error fetching PDF for preview:", err);
        // try fallback to opening the direct URL (this may still fail for CORS)
        try {
          window.open(pdfApiUrl, "_blank");
        } catch (e) {
          // ignore
        }
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    }

    fetchPdfBlob();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pdfApiUrl]);

  const handleDownload = async () => {
    // If we have the blob url already, download from it; otherwise, fallback to fetching.
    try {
      if (pdfBlobUrl) {
        const link = document.createElement("a");
        link.href = pdfBlobUrl;
        const baseName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "document";
        link.download = `${baseName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      // fallback: fetch and download
      const res = await fetch(pdfApiUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "document";
      link.download = `${baseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file. You can try opening the PDF in a new tab.");
      // try open in new tab
      try {
        window.open(pdfApiUrl, "_blank");
      } catch (e) {}
    }
  };

  // Build the UI
  return (
    <div
      className="h-full flex flex-col w-full max-w-full rounded-2xl border border-slate-800/70 bg-slate-950/95 text-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.65)] overflow-hidden backdrop-blur"
    >
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-blue-500/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-slate-900/80 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_18px_rgba(45,212,191,0.55)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-300"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.6"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5h7.5m-9 3h10.5m-12 3h13.5m-12 3h10.5m-9 3h7.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-wide text-slate-50">
              Preview
            </h2>
            <p className="text-[11px] text-slate-300/80 truncate">
              {originalFileName || 'Untitled'}{' '}·{' '}
              {size !== undefined && size !== null ? formatBytes(size) : '—'}
              {/* · {mimeType || 'unknown'} */}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
  {/* PDF Download Button */}
  <button
    type="button"
    onClick={handleDownload}
    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide
               bg-slate-900/90 border border-emerald-300/70 text-emerald-100
               shadow-[0_0_18px_rgba(52,211,153,0.55)]
               hover:bg-emerald-500/20 hover:border-emerald-300 hover:text-emerald-50
               transition-colors"
  >
    <span>Download PDF</span>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11.25m0 0L8.25 12m3.75 3.75L15.75 12M5.25 18.75h13.5" />
    </svg>
  </button>

  {/* JSON Download Button */}
  <a
  href={`${API_BASE_URL}/documents/${doc.id}/json`}
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide
             bg-slate-900/90 border border-blue-300/70 text-blue-100
             shadow-[0_0_18px_rgba(147,197,253,0.55)]
             hover:bg-blue-500/20 hover:border-blue-300 hover:text-blue-50
             transition-colors"
  download={`${doc.originalFileName || 'document'}.json`}
>
  <span>Download JSON</span>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11.25m0 0L8.25 12m3.75 3.75L15.75 12M5.25 18.75h13.5" />
  </svg>
</a>

    
</div>

      </div>

      {/* BODY */}
      <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* If PDF blob URL available, show iframe */}
        {loadingPdf && (
          <div className="w-full text-center text-sm text-slate-300">Loading visual preview…</div>
        )}

        {!loadingPdf && pdfBlobUrl && (
          <div className="w-full h-[98vh] bg-white rounded-md overflow-hidden" style={{ minHeight: 400 }}>
            <iframe
              ref={iframeRef}
              title="Document PDF preview"
              src={pdfBlobUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        )}

        {/* If PDF not available, show a fallback message + extracted content */}
        {!loadingPdf && !pdfBlobUrl && (
  <div className="space-y-4">
    <div className="text-xs text-slate-400">Visual preview not available — showing extracted content below.</div>

    {/* TABLE PREVIEW */}
    {isTable && Array.isArray(tableRows) && tableRows.length > 0 && (
      <div className="border border-slate-700/80 rounded-xl bg-slate-900/70 shadow-xl">
        ...
      </div>
    )}

    {/* TEXT PREVIEW */}
    {!isTable && (
      <div className="border h-[80vh] no-scrollbar border-slate-700/80 rounded-xl bg-slate-900/70 shadow-xl overflow-auto">
        <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
          <div />
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Read-only</span>
        </div>

        <pre className="text-[13px] leading-relaxed h-full text-slate-100/90 no-scrollbar bg-slate-950/40 font-mono p-4 rounded-b-xl overflow-y-auto overflow-x-auto whitespace-pre break-words max-w-full [tab-size:2]">
          {extractedText || "(No text extracted)"}
        </pre>
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
}
