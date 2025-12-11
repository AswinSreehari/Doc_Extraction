// src/App.jsx
import { useEffect, useState } from 'react';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import DocumentPreview from './components/DocumentPreview';
import { fetchDocuments, fetchDocumentById, API_BASE_URL } from './api/client';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  // 🔍 Search term
  const [searchTerm, setSearchTerm] = useState('');

  // 🔽 Extension filter ("all" = no filter)
  const [extensionFilter, setExtensionFilter] = useState('all');

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      setError('');
      const res = await fetchDocuments(); // expected shape: { count, items }
      const items = res.items || [];
      setDocuments(items);

      // If nothing is selected yet but we have docs, select the first one
      if (!selectedId && items.length > 0) {
        handleSelectDocument(items[0].id);
      } else {
        // If we still have selectedId, try to refresh its details
        if (selectedId) {
          const stillExists = items.find((d) => d.id === selectedId);
          if (!stillExists && items.length > 0) {
            // previously selected was removed — select first
            handleSelectDocument(items[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSelectDocument = async (id) => {
    try {
      setSelectedId(id);
      setLoadingDetail(true);
      setError('');
      const doc = await fetchDocumentById(id);
      setSelectedDoc(doc);
    } catch (err) {
      console.error(err);
      setError('Failed to load document details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUploadSuccess = () => {
    // After upload, refresh the document list (and auto-select first item)
    loadDocuments();
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: get extension for a document
  const getExtension = (doc) => {
    if (doc.originalFileName && doc.originalFileName.includes('.')) {
      return doc.originalFileName.split('.').pop().toLowerCase();
    }
    if (doc.mimeType) {
      return doc.mimeType.split('/').pop().toLowerCase();
    }
    return 'unknown';
  };

  // Available extensions for dropdown
  const availableExtensions = Array.from(
    new Set(documents.map((doc) => getExtension(doc)))
  )
    .filter((ext) => ext && ext !== 'unknown')
    .sort();

  // Normalize search term
  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Filter documents by search AND extension
  const filteredDocuments = documents.filter((doc) => {
    // 1) Search by file name
    if (normalizedSearch) {
      const name = doc.originalFileName || '';
      if (!name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }
    }

    // 2) Filter by extension
    if (extensionFilter !== 'all') {
      const ext = getExtension(doc);
      if (ext !== extensionFilter) {
        return false;
      }
    }

    return true;
  });

  // NEW: number of filtered results
  const resultsCount = filteredDocuments.length;

  // NEW: clear filters helper
  const clearFilters = () => {
    setSearchTerm('');
    setExtensionFilter('all');
  };

  // -----------------------
  // Delete functionality
  // -----------------------
  const handleDelete = async (id, opts = {}) => {
  try {
    const docToDelete = documents.find((d) => d.id === id);
    const name = docToDelete?.originalFileName || 'this file';

    // If parent is called from DocumentList and it passed skipConfirm, skip showing native confirm.
    // If opts.skipConfirm is falsey and you still want a native confirm as a fallback, you can use it.
    if (!opts.skipConfirm) {
      const ok = window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
      if (!ok) return;
    }

    // Call backend DELETE using API_BASE_URL helper
    setLoadingDocs(true);
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`Delete failed (${res.status}) ${text ? '- ' + text : ''}`);
    }

    // Update state (remove the document)
    const updatedDocs = documents.filter((d) => d.id !== id);
    setDocuments(updatedDocs);

    // If the deleted doc was selected, clear selection and pick a new one
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedDoc(null);
      if (updatedDocs.length > 0) {
        handleSelectDocument(updatedDocs[0].id);
      }
    }

    setLoadingDocs(false);
  } catch (err) {
    console.error('Delete error:', err);
    setError(err.message || 'Failed to delete document');
    setLoadingDocs(false);
    loadDocuments();
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="p-4 mx-auto h-full flex flex-col px-4 py-6 gap-4">
        {/* Main 2-column layout */}
        <div className="flex gap-5 flex-1 min-h-0">
          {/* LEFT SIDE: upload + search/filter + grouped list */}
          <div className="w-1/2 flex flex-col gap-3 min-h-0">
            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {/* Error message */}
            {error && (
              <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-1.5">
                {error}
              </p>
            )}

            {/* Search + filter card */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3 space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Search documents
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by file name..."
                  className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 
                             px-3 py-1.5 text-[12px] text-slate-100
                             placeholder:text-slate-500
                             focus:outline-none focus:ring-1 focus:ring-emerald-400/80 focus:border-emerald-400/80"
                />
                {searchTerm && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Showing results for{' '}
                    <span className="text-emerald-300">"{searchTerm}"</span>
                  </p>
                )}
              </div>

              {/* Filter by extension */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-300">
                  Type
                </label>
                <select
                  value={extensionFilter}
                  onChange={(e) => setExtensionFilter(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-900/80 border border-slate-700/80 
                             px-2 py-1 text-[11px] text-slate-100
                             focus:outline-none focus:ring-1 focus:ring-emerald-400/80 focus:border-emerald-400/80"
                >
                  <option value="all">All types</option>
                  {availableExtensions.map((ext) => (
                    <option key={ext} value={ext}>
                      {ext.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* NEW: results count + clear */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 mt-2">
                <span className="text-[10px] text-slate-500">
                  {resultsCount === 0
                    ? 'No matching documents'
                    : `${resultsCount} document${resultsCount === 1 ? '' : 's'}`}
                </span>
                {(searchTerm || extensionFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[10px] text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Document list (using filteredDocuments) */}
            {loadingDocs ? (
              <div className="mt-2 flex-1 flex items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 text-sm text-slate-300">
                Loading documents...
              </div>
            ) : (
              <DocumentList
                documents={filteredDocuments.map((d) => ({
                  ...d,
                  mimeType: d.mimeType || 'unknown',
                }))}
                onSelect={handleSelectDocument}
                selectedId={selectedId}
                onDelete={handleDelete} // <-- pass delete handler to DocumentList
              />
            )}
          </div>

          {/* RIGHT SIDE: content preview + download button in header */}
          <div className="flex-1 min-w-0">
            {loadingDetail ? (
              <div className="h-full flex items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70 text-sm text-slate-300 shadow-[0_18px_45px_rgba(15,23,42,0.65)]">
                Loading document details...
              </div>
            ) : (
              <DocumentPreview document={selectedDoc} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
