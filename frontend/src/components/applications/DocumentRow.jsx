import { useRef, useState } from 'react';
import { FileText, Upload, AlertCircle, Eye, Trash2, Layers, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ValidationStatus } from './ValidationStatus';
export function DocumentRow({ document, applicationId, onUpload, onRemove, onRecheck, isUploading = false, busy = false, report }) {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { documentId, name, description, originalName, usedInApprovals = [], size, acceptedFormats = ['PDF'] } = document;
  const isUploaded = !!document.storedName;
  const issues = report?.issues.filter(i => i.documentId === documentId && i.severity !== 'info') || document.validation?.issues.filter(i => i.severity !== 'info') || [];
  const status = isUploading ? 'processing' : issues.some(i => i.severity === 'warning') && document.validation?.status === 'valid' ? 'warning' : document.validation?.status || (isUploaded ? 'uploaded' : 'not_uploaded');
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      if (!file.size) throw new Error('The file is empty. Choose a non-empty document.');
      if (file.size > 10 * 1024 * 1024) throw new Error('File exceeds the 10 MB limit.');
      await onUpload(documentId, file);
    } catch (error) { setErrorMsg(error.message || 'Upload failed'); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  return <Card id={`document-${documentId}`} tabIndex={-1} className={`doc-row-card validation-doc validation-${status} ${isUploaded ? 'doc-uploaded' : 'doc-missing'}`}>
    <div className="doc-row-left"><div className="doc-type-icon"><FileText size={21}/></div><div className="doc-info"><div className="doc-title-row"><h4>{name}</h4>{usedInApprovals.length > 1 && <span className="reuse-badge" title={usedInApprovals.join(', ')}><Layers size={11}/>Used in {usedInApprovals.length} approvals</span>}</div><p className="doc-desc">{description}</p><small className="accepted-formats">{acceptedFormats.join(', ')} · Up to 10 MB</small>{isUploaded && <p className="doc-file-info">{originalName} · {Math.round(size / 1024)} KB</p>}</div></div>
    <div className="doc-row-right"><ValidationStatus status={status}/><div className="doc-actions"><input className="sr-only" type="file" ref={fileInputRef} onChange={handleFileChange} accept={acceptedFormats.map(f => `.${f.toLowerCase()}`).join(',')} disabled={busy || isUploading} aria-label={`Upload ${name}`}/><Button type="button" variant={isUploaded ? 'outline' : 'default'} disabled={busy || isUploading} onClick={() => fileInputRef.current?.click()}><Upload size={14}/>{isUploading ? 'Checking...' : isUploaded ? 'Replace Document' : 'Upload'}</Button>{isUploaded && <><Button asChild variant="outline"><a href={`/api/applications/${encodeURIComponent(applicationId)}/documents/${documentId}/file`} target="_blank" rel="noreferrer" aria-label={`View ${name}`}><Eye size={14}/>View</a></Button><Button type="button" variant="ghost" size="icon" disabled={busy || isUploading} aria-label={`Re-check ${name}`} onClick={() => onRecheck(documentId)}><RefreshCw size={16}/></Button><Button type="button" variant="ghost" size="icon" disabled={busy || isUploading} aria-label={`Remove ${name}`} onClick={() => onRemove(documentId)}><Trash2 size={16}/></Button></>}</div></div>
    {issues.length > 0 && <div className="doc-issue-preview"><AlertCircle size={15}/><span>{issues[0].title}{issues[0].detectedValue && `: ${issues[0].detectedValue}`}</span></div>}
    {errorMsg && <p className="doc-error-text" role="alert"><AlertCircle size={14}/>{errorMsg}</p>}
  </Card>;
}
