import { PartialType } from '@nestjs/mapped-types';
import { CreateRootLedgerEntryDto } from './create-root-ledger-entry.dto.js';

export class UpdateRootLedgerEntryDto extends PartialType(CreateRootLedgerEntryDto) {}
