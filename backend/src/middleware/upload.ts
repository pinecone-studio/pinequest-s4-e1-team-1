import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /audio\//;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  },
});

export default upload;
