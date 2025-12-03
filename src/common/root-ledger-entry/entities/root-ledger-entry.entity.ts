import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
} from 'sequelize-typescript';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { EntryType, ReferenceType } from '../enums/root-ledger-entry.enums';
import type { IRootLedgerMetadata } from '../interface/root-ledger-entry.interface';
import { RootWallet } from 'src/common/root-wallet/entities/root-wallet.entity';

@Table({
  tableName: 'root_ledger_entries',
  underscored: true,
  timestamps: false,
})
export class RootLedgerEntry extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => RootCommissionEarning)
  @Column({
    type: DataType.UUID,
    field: 'commission_earning_id',
    allowNull: true,
  })
  commissionEarningId: string;

  @ForeignKey(() => RootWallet)
  @Column({
    type: DataType.UUID,
    field: 'wallet_id',
    allowNull: false,
  })
  walletId: string;

  @Column({
    type: DataType.ENUM('DEBIT', 'CREDIT'),
    field: 'entry_type',
    allowNull: false,
  })
  entryType: EntryType;

  @Column({
    type: DataType.ENUM(
      'TRANSACTION',
      'COMMISSION',
      'REFUND',
      'ADJUSTMENT',
      'BONUS',
      'CHARGE',
      'FEE',
      'TAX',
      'PAYOUT',
      'COLLECTION',
    ),
    field: 'reference_type',
    allowNull: false,
  })
  referenceType: ReferenceType;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    validate: {
      min: 1,
    },
  })
  amount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'running_balance',
    allowNull: false,
  })
  runningBalance: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000],
    },
  })
  narration: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: IRootLedgerMetadata;

  @Default(Date.now)
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  // Associations
  @BelongsTo(() => RootWallet)
  wallet: RootWallet;

  @BelongsTo(() => RootCommissionEarning)
  commissionEarning: RootCommissionEarning;

  // Hooks
  @BeforeCreate
  static validateAmountAndBalance(instance: RootLedgerEntry) {
    if (instance.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
  }
}
