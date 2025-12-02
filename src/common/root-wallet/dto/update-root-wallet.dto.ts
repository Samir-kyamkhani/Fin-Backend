import { PartialType } from '@nestjs/mapped-types';
import { CreateRootWalletDto } from './create-root-wallet.dto';

export class UpdateRootWalletDto extends PartialType(CreateRootWalletDto) {}
