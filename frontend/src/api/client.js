export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
// src/api/client.js
export async function uploadDocuments(files) {
  // files: array of File objects
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file); // append multiple entries with the same field name
  });

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
    // DO NOT set Content-Type header; browser will set multipart/form-data boundary
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Upload failed: ${res.status}`);
  }

  const json = await res.json();
  return json;
}


export async function fetchDocuments() {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) {
    throw new Error('Failed to fetch documents');
  }
  return res.json(); // { count, items: [...] }
}

export async function fetchDocumentById(id) {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch document');
  }
  return res.json(); // full details
}
