import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto.js';
import { UpdateAuditLogDto } from '../dto/update-audit-log.dto.js';

@Injectable()
export class AuditLogService {
  create(createAuditLogDto: CreateAuditLogDto) {
    return 'This action adds a new auditLog';
  }

  findAll() {
    return `This action returns all auditLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auditLog`;
  }

  update(id: number, updateAuditLogDto: UpdateAuditLogDto) {
    return `This action updates a #${id} auditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLog`;
  }
}
