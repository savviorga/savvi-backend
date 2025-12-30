// src/infrastructure/config/multer.config.ts
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { memoryStorage } from 'multer';

export const multerConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 10, // máximo 10 archivos
  },
  fileFilter: (req, file, callback) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Tipo de archivo no permitido'), false);
    }
  },
};
