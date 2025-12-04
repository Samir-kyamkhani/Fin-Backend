import { Injectable } from '@nestjs/common';
import { CreateRootLedgerEntryDto } from '../dto/create-root-ledger-entry.dto.js';
import { UpdateRootLedgerEntryDto } from '../dto/update-root-ledger-entry.dto.js';

@Injectable()
export class RootLedgerEntryService {
  create(createRootLedgerEntryDto: CreateRootLedgerEntryDto) {
    return 'This action adds a new rootLedgerEntry';
  }

  findAll() {
    return `This action returns all rootLedgerEntry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rootLedgerEntry`;
  }

  update(id: number, updateRootLedgerEntryDto: UpdateRootLedgerEntryDto) {
    return `This action updates a #${id} rootLedgerEntry`;
  }

  remove(id: number) {
    return `This action removes a #${id} rootLedgerEntry`;
  }
}
