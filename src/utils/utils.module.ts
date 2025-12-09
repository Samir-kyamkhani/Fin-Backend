import { Module } from '@nestjs/common';
import { HierarchyService } from './hierarchy/hierarchy.service'
import { HelperService } from './helper/helper.service'
import { CryptoService } from './crypto/crypto.service'
import { S3Service } from './s3/s3.service'
import { SendCredentialsEmailService } from './send-credentials-email/send-credentials-email.service'

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
