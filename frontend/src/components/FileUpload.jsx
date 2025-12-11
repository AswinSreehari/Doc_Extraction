// src/components/FileUpload.jsx
import { useState } from "react";
import { uploadDocuments } from "../api/client";

export default function FileUpload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]); // now an array
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [perFileStatus, setPerFileStatus] = useState([]); // [{name, status}]

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPerFileStatus(selected.map(f => ({ name: f.name, status: "Ready" })));
    setStatus("");
  };

  // DRAG & DROP HANDLERS (support multiple)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) {
      setFiles(dropped);
      setPerFileStatus(dropped.map(f => ({ name: f.name, status: "Ready" })));
      setStatus("");
    }
  };

  const removeFile = (index) => {
    const next = files.slice();
    next.splice(index, 1);
    setFiles(next);
    setPerFileStatus(next.map(f => ({ name: f.name, status: "Ready" })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      setStatus("⚠️ Please select at least one file.");
      return;
    }

    setLoading(true);
    setStatus("⏳ Uploading and processing...");
    setPerFileStatus(files.map(f => ({ name: f.name, status: "Uploading..." })));

    try {
      const response = await uploadDocuments(files); // calls API client
      // response expected: { message: 'Files processed', results: [ { success, message, document? }, ... ] }

      if (!response || !Array.isArray(response.results)) {
        throw new Error("Unexpected server response");
      }

      // Build per-file statuses from response order (server processes files in same order)
      const updatedStatuses = response.results.map((r, i) => {
        if (r.success) {
          return { name: files[i]?.name || r.originalFileName || `file-${i+1}`, status: "✔️ Done" };
        } else {
          return { name: files[i]?.name || r.originalFileName || `file-${i+1}`, status: `❌ ${r.message || "Failed"}` };
        }
      });

      setPerFileStatus(updatedStatuses);
      setStatus(response.message || "Files processed");

      if (onUploadSuccess) {
        // pass documents array for successful files
        const docs = response.results
          .map((r, i) => ({ ...r, inputName: files[i]?.name }))
          .filter(r => r.success)
          .map(r => r.document);
        onUploadSuccess(docs);
      }

      // clear selected files
      setFiles([]);
      // if there's a native form reset (not needed), else ensure file input cleared
      e.target.reset?.();
    } catch (err) {
      console.error(err);
      setStatus(`❌ ${err.message || "Upload failed"}`);
      setPerFileStatus(files.map(f => ({ name: f.name, status: `❌ ${err.message || "Failed"}` })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-lg text-slate-70">
      <h2 className="text-lg font-semibold tracking-wide text-slate-100 mb-1">
        Upload Documents
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DROPZONE */}
        <label className="block cursor-pointer group">
          <span className="sr-only">Choose files</span>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center px-5 py-8
              rounded-xl border-2 border-dashed transition-all duration-200 shadow-inner
              ${
                isDragging
                  ? "border-emerald-400 bg-slate-900/40"
                  : "border-slate-700/70 bg-slate-900/50"
              }
            `}
          >
            <div
              className={`h-10 w-10 flex items-center justify-center rounded-full border shadow transition
                ${
                  isDragging
                    ? "border-emerald-400 bg-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                    : "border-slate-700/60 bg-slate-900/70"
                }
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 transition ${isDragging ? "text-emerald-300" : "text-slate-300"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.4}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 9L12 4.5 7.5 9M12 4.5V15" />
              </svg>
            </div>

            <span className={`text-sm font-medium mt-3 transition ${isDragging ? "text-emerald-300" : "text-slate-200"}`}>
              {files.length ? `${files.length} file(s) selected` : isDragging ? "Drop here…" : "Click to choose files"}
            </span>

            <span className={`text-[10px] mt-1 transition ${isDragging ? "text-slate-300" : "text-slate-500"}`}>
              or drag and drop
            </span>

            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.ppt,.pptx,.csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </label>

        {/* Selected file list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, idx) => (
              <div key={f.name + idx} className="flex items-center justify-between bg-slate-900/40 p-2 rounded">
                <div className="text-sm truncate">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-[11px] text-slate-400">{(f.size/1024).toFixed(1)} KB</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-[12px] text-slate-300">{perFileStatus[idx]?.status}</div>
                  <button type="button" onClick={() => removeFile(idx)} className="text-xs text-red-400 px-2 py-1 rounded hover:bg-slate-800">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={!files.length || loading}
          className="w-full inline-flex items-center justify-center px-4 py-2
                     rounded-full text-[12px] font-semibold tracking-wide
                     bg-emerald-600 hover:bg-emerald-500
                     disabled:bg-slate-700 disabled:text-slate-500
                     shadow-[0_0_18px_rgba(52,211,153,0.4)]
                     transition-all duration-200"
        >
          {loading ? "Processing..." : "Upload & Convert"}
        </button>
      </form>

      {/* STATUS */}
      {status && (
        <p className="mt-3 text-[11px] whitespace-pre-line text-slate-300 bg-slate-900/60 border border-slate-800/70 rounded-lg p-2 leading-relaxed">
          {status}
        </p>
      )}
    </div>
  );
}
