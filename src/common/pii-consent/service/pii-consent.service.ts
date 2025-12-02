import { Injectable } from '@nestjs/common';
import { CreatePiiConsentDto } from '../dto/create-pii-consent.dto';
import { UpdatePiiConsentDto } from '../dto/update-pii-consent.dto';

@Injectable()
export class PiiConsentService {
  create(createPiiConsentDto: CreatePiiConsentDto) {
    return 'This action adds a new piiConsent';
  }

  findAll() {
    return `This action returns all piiConsent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} piiConsent`;
  }

  update(id: number, updatePiiConsentDto: UpdatePiiConsentDto) {
    return `This action updates a #${id} piiConsent`;
  }

  remove(id: number) {
    return `This action removes a #${id} piiConsent`;
  }
}
