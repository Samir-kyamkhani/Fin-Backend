import { Module } from '@nestjs/common';
import { HierarchyService } from './hierarchy/hierarchy.service.js';
import { HelperService } from './helper/helper.service.js';
import { CryptoService } from './crypto/crypto.service.js';
import { S3Service } from './s3/s3.service.js';
import { SendCredentialsEmailService } from './send-credentials-email/send-credentials-email.service.js';

@Module({
  providers: [
    HelperService,
    CryptoService,
    HierarchyService,
    S3Service,
    SendCredentialsEmailService,
  ],
  exports: [
    HelperService,
    CryptoService,
    HierarchyService,
    S3Service,
    SendCredentialsEmailService,
  ],
})
export class UtilsModule {}
