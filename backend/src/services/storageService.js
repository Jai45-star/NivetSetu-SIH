import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  static getUploadDir() {
    return UPLOAD_DIR;
  }

  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/\.{2,}/g, '_')
      .slice(0, 100);
  }

  static generateStoredName(originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    const safeBase = this.sanitizeFilename(path.basename(originalFilename, ext));
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}-${uniqueSuffix}-${safeBase}${ext}`;
  }

  static getFilePath(storedName) {
    if (typeof storedName !== 'string' || !storedName || storedName !== path.basename(storedName) || /[\\/:]/.test(storedName) || storedName.includes('..')) throw new Error('Invalid stored filename');
    const fullPath = path.resolve(UPLOAD_DIR, storedName);
    if (path.dirname(fullPath) !== UPLOAD_DIR) throw new Error('Invalid storage path');
    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isSymbolicLink()) throw new Error('Invalid storage file');
    return fullPath;
  }

  static fileExists(storedName) {
    const fullPath = this.getFilePath(storedName);
    return fs.existsSync(fullPath);
  }

  static fingerprint(storedName) {
    const stat = fs.lstatSync(this.getFilePath(storedName));
    if (!stat.isFile()) throw new Error('Invalid storage file');
    return `${storedName}:${stat.size}:${stat.mtimeMs}`;
  }

  static deleteFile(storedName) {
    try {
      const fullPath = this.getFilePath(storedName);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    } catch (err) {
      console.error(`[StorageService] Failed to delete file ${storedName}:`, err.message);
    }
    return false;
  }

  static validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (file.size === 0) {
      throw new Error('File is empty (0 bytes)');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB`);
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, JPEG`);
    }
    return true;
  }
}
