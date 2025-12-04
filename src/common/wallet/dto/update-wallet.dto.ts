import { PartialType } from '@nestjs/mapped-types';
import { CreateWalletDto } from './create-wallet.dto.js';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {}
