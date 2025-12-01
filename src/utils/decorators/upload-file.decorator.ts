import {
  HttpStatus,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

interface UploadOptions {
  maxSize?: number;
  fileIsRequired?: boolean;
}

const createUploadsDir = () => {
  const dir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Uploads directory created at:', dir);
  }
  return dir;
};

const diskStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, createUploadsDir()),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

export function UseAnyFilesInterceptor() {
  return UseInterceptors(AnyFilesInterceptor({ storage: diskStorage }));
}

export function BuildFilesPipe(options: UploadOptions = {}) {
  const { maxSize = 5 * 1024 * 1024, fileIsRequired = true } = options;
  return new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize }).build({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    fileIsRequired,
  });
}

// uses
// @UseAnyFilesInterceptor()
//  @UploadedFiles(BuildFilesPipe({ maxSize: 10 * 1024 * 1024 })) files: Express.Multer.File[]
