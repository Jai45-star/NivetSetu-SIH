import { useRef, useState } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, Eye, Trash2, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function DocumentRow({
  document,
  applicationId,
  onUpload,
  onRemove,
  isUploading = false,
}) {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    documentId,
    name,
    description,
    status = 'missing',
    originalName,
    usedInApprovals = [],
    size,
  } = document;

  const isUploaded = status === 'uploaded' || status === 'valid';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File exceeds 10 MB limit');
      }
      await onUpload(documentId, file);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formattedSize = size ? `(${(size / 1024).toFixed(0)} KB)` : '';

  return (
    <Card className={`doc-row-card ${isUploaded ? 'doc-uploaded' : 'doc-missing'}`}>
      <div className="doc-row-left">
        <div className={`doc-type-icon ${isUploaded ? 'icon-uploaded' : 'icon-missing'}`}>
          <FileText size={20} />
        </div>

        <div className="doc-info">
          <div className="doc-title-row">
            <h4>{name}</h4>
            {usedInApprovals.length > 1 && (
              <span className="reuse-badge" title={usedInApprovals.join(', ')}>
                <Layers size={11} /> Used in {usedInApprovals.length} approvals
              </span>
            )}
          </div>

          <p className="doc-desc">{description || 'Required statutory document'}</p>

          {isUploaded && originalName && (
            <p className="doc-file-info">
              <CheckCircle2 size={12} className="text-success" />
              <span>{originalName} {formattedSize}</span>
            </p>
          )}

          {errorMsg && (
            <p className="doc-error-text">
              <AlertCircle size={12} /> {errorMsg}
            </p>
          )}
        </div>
      </div>

      <div className="doc-row-right">
        <div className="doc-status-pill">
          {isUploaded ? (
            <span className="status-pill-uploaded">
              <CheckCircle2 size={13} /> Uploaded
            </span>
          ) : (
            <span className="status-pill-missing">
              <AlertCircle size={13} /> Missing
            </span>
          )}
        </div>

        <div className="doc-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            style={{ display: 'none' }}
            aria-label={`Upload ${name}`}
          />

          {!isUploaded ? (
            <Button
              type="button"
              variant="default"
              size="default"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Upload
            </Button>
          ) : (
            <div className="uploaded-actions">
              <Button
                asChild
                variant="outline"
                size="default"
              >
                <a
                  href={`/api/applications/${applicationId}/documents/${documentId}/file`}
                  target="_blank"
                  rel="noreferrer"
                  title="View uploaded document"
                >
                  <Eye size={14} /> View
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(documentId)}
                title="Remove file"
                aria-label={`Remove ${name}`}
              >
                <Trash2 size={16} className="text-danger" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
