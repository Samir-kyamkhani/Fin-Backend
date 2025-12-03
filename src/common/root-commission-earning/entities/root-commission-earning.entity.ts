import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  PrimaryKey,
  BeforeCreate,
} from 'sequelize-typescript';
import { RootLedgerEntry } from 'src/common/root-ledger-entry/entities/root-ledger-entry.entity';
import { RootWallet } from 'src/common/root-wallet/entities/root-wallet.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { CommissionType } from '../enums/root-commission-earning.enums';
import type { RootCommissionEarningMetadata } from '../interface/root-commission-earning.interface';
@Table({
  tableName: 'root_commission_earnings',
  underscored: true,
  timestamps: false,
  indexes: [
    { name: 'idx_user_transaction_id', fields: ['user_transaction_id'] },
    { name: 'idx_root_id', fields: ['root_id'] },
    { name: 'idx_wallet_id', fields: ['wallet_id'] },
    { name: 'idx_from_user_id', fields: ['from_user_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class RootCommissionEarning extends Model<RootCommissionEarning> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.UUID,
    field: 'user_transaction_id',
    allowNull: false,
  })
  userTransactionId: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: 'root_id', allowNull: false })
  rootId: string;
  @ForeignKey(() => RootWallet)
  @Column({ type: DataType.UUID, field: 'wallet_id', allowNull: false })
  walletId: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'from_user_id', allowNull: false })
  fromUserId: string;
  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 0 } })
  amount: number;
  @Column({
    type: DataType.BIGINT,
    field: 'commission_amount',
    allowNull: false,
    validate: { min: 0 },
  })
  commissionAmount: number;
  @Column({
    type: DataType.ENUM('FLAT', 'PERCENTAGE'),
    field: 'commission_type',
    allowNull: false,
    validate: { isIn: [['FLAT', 'PERCENTAGE']] },
  })
  commissionType: CommissionType;
  @Column({
    type: DataType.BIGINT,
    field: 'tds_amount',
    allowNull: true,
    validate: { min: 0 },
  })
  tdsAmount: number | null;
  @Column({
    type: DataType.BIGINT,
    field: 'gst_amount',
    allowNull: true,
    validate: { min: 0 },
  })
  gstAmount: number | null;
  @Column({
    type: DataType.BIGINT,
    field: 'net_amount',
    allowNull: false,
    validate: { min: 0 },
  })
  netAmount: number;
  @Column({ type: DataType.JSON, allowNull: true, defaultValue: {} })
  metadata: RootCommissionEarningMetadata;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get totalDeductions(): number {
    return (this.tdsAmount || 0) + (this.gstAmount || 0);
  }
  get commissionRate(): number {
    return this.commissionType === CommissionType.FLAT
      ? this.commissionAmount
      : this.metadata?.commissionRate || 0;
  }
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get commissionAmountInRupees(): number {
    return this.commissionAmount / 100;
  }
  get tdsAmountInRupees(): number {
    return (this.tdsAmount || 0) / 100;
  }
  get gstAmountInRupees(): number {
    return (this.gstAmount || 0) / 100;
  }
  get netAmountInRupees(): number {
    return this.netAmount / 100;
  }
  get totalDeductionsInRupees(): number {
    return this.totalDeductions / 100;
  }

  // Associations
  @BelongsTo(() => Root, { foreignKey: 'root_id', as: 'root' }) root: Root;
  @BelongsTo(() => RootWallet, { foreignKey: 'wallet_id', as: 'wallet' })
  wallet: RootWallet;
  @BelongsTo(() => User, { foreignKey: 'from_user_id', as: 'fromUser' })
  fromUser: User;
  @BelongsTo(() => Transaction, {
    foreignKey: 'user_transaction_id',
    as: 'userTransaction',
  })
  userTransaction: Transaction;
  @HasMany(() => RootLedgerEntry, {
    foreignKey: 'commission_earning_id',
    as: 'rootLedgerEntries',
  })
  rootLedgerEntries: RootLedgerEntry[];

  // Hooks
  @BeforeCreate
  static validateAmounts(instance: RootCommissionEarning): void {
    if (instance.amount < 0) throw new Error('Amount cannot be negative');
    if (instance.commissionAmount < 0)
      throw new Error('Commission amount cannot be negative');
    if ((instance.tdsAmount || 0) < 0)
      throw new Error('TDS amount cannot be negative');
    if ((instance.gstAmount || 0) < 0)
      throw new Error('GST amount cannot be negative');
    if (instance.commissionAmount > instance.amount)
      throw new Error('Commission amount cannot exceed transaction amount');

    const netAmount =
      instance.commissionAmount -
      (instance.tdsAmount || 0) -
      (instance.gstAmount || 0);
    if (netAmount < 0) throw new Error('Net amount cannot be negative');
    if (instance.netAmount !== netAmount)
      throw new Error('Net amount calculation mismatch');
  }

  @BeforeCreate
  static setMetadataDefaults(instance: RootCommissionEarning): void {
    if (!instance.metadata)
      instance.metadata = {} as RootCommissionEarningMetadata;
    if (!instance.metadata.calculatedAt)
      instance.metadata.calculatedAt = new Date();
    if (
      instance.commissionType === CommissionType.PERCENTAGE &&
      instance.amount > 0
    ) {
      const rate = (instance.commissionAmount / instance.amount) * 100;
      instance.metadata.commissionRate = parseFloat(rate.toFixed(2));
    }
  }
}
