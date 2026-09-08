import multer from 'multer';
import { StorageService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../services/storageService.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, StorageService.getUploadDir());
  },
  filename: (_req, file, cb) => {
    const storedName = StorageService.generateStoredName(file.originalname);
    cb(null, storedName);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, JPEG`), false);
  }
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
}).single('file');

export function handleUpload(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 10 MB limit',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
}
