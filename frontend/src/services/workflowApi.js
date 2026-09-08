async function request(path, role = 'entrepreneur', body, method) {
  const response = await fetch(`/api/${path}`, { method: method || (body ? 'POST' : 'GET'), headers: { 'x-demo-role': role, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'The request failed. Please retry.');
  return result.data;
}
export const workflowApi = {
  tracking: id => request(`applications/${id}/tracking`),
  list: () => request('officer/applications', 'officer'),
  sla: () => request('officer/sla', 'officer'),
  analytics: () => request('officer/analytics', 'officer'),
  detail: id => request(`officer/applications/${id}`, 'officer'),
  action: (id, action, body = {}) => request(`officer/applications/${id}/${action}`, 'officer', body),
  respond: (id, body) => request(`applications/${id}/query-response`, 'entrepreneur', body),
  upload: (id, query, file) => { const body = new FormData(); body.append('queryId', query.queryId); body.append('documentId', query.documentId); body.append('file', file); return request(`applications/${id}/query-documents`, 'entrepreneur', body); },
  async viewFile(id, documentId) {
    const response = await fetch(`/api/officer/applications/${id}/documents/${documentId}/file`, { headers: { 'x-demo-role': 'officer' } });
    if (!response.ok) throw new Error('Document is unavailable.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};

