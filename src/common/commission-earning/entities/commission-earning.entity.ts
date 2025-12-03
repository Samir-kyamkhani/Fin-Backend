import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { User } from 'src/user/entities/user.entity';
import {
  CommissionStatus,
  CommissionType,
} from '../enums/commission-earning.enums';
import type { CommissionMetadata } from '../interface/commission-earning.interface';

@Table({
  tableName: 'commission_earnings',
  timestamps: false,
  underscored: true,
  indexes: [
    { name: 'idx_transaction_user', fields: ['transaction_id', 'user_id'] },
    { name: 'idx_user_created', fields: ['user_id', 'created_at'] },
    { name: 'idx_from_user_created', fields: ['from_user_id', 'created_at'] },
    { name: 'idx_status_created', fields: ['status', 'created_at'] },
    { name: 'idx_processed_at', fields: ['processed_at'] },
    { name: 'idx_cancelled_at', fields: ['cancelled_at'] },
  ],
})
export class CommissionEarning extends Model<CommissionEarning> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Transaction)
  @AllowNull(false)
  @Index('idx_transaction_id')
  @Column({ field: 'transaction_id', type: DataType.UUID })
  declare transactionId: string;
  @ForeignKey(() => User)
  @AllowNull(false)
  @Index('idx_user_id')
  @Column({ field: 'user_id', type: DataType.UUID })
  declare userId: string;
  @ForeignKey(() => User)
  @Index('idx_from_user_id')
  @Column({ field: 'from_user_id', type: DataType.UUID })
  declare fromUserId: string | null;
  @AllowNull(false)
  @Column({ type: DataType.BIGINT, validate: { min: 0 } })
  declare amount: number;
  @AllowNull(false)
  @Column({
    field: 'commission_amount',
    type: DataType.BIGINT,
    validate: { min: 0 },
  })
  declare commissionAmount: number;
  @Default(0)
  @Column({
    field: 'root_commission_amount',
    type: DataType.BIGINT,
    validate: { min: 0 },
  })
  declare rootCommissionAmount: number;
  @AllowNull(false)
  @Column({
    field: 'commission_type',
    type: DataType.ENUM(...Object.values(CommissionType)),
    validate: { isIn: [Object.values(CommissionType)] },
  })
  declare commissionType: CommissionType;
  @Column({ field: 'tds_amount', type: DataType.BIGINT, validate: { min: 0 } })
  declare tdsAmount: number | null;
  @Column({ field: 'gst_amount', type: DataType.BIGINT, validate: { min: 0 } })
  declare gstAmount: number | null;
  @AllowNull(false)
  @Column({ field: 'net_amount', type: DataType.BIGINT, validate: { min: 0 } })
  declare netAmount: number;
  @Default(CommissionStatus.PENDING)
  @Column({
    field: 'status',
    type: DataType.ENUM(...Object.values(CommissionStatus)),
    validate: { isIn: [Object.values(CommissionStatus)] },
  })
  declare status: CommissionStatus;
  @Column({ type: DataType.JSON, defaultValue: {} })
  declare metadata: CommissionMetadata;
  @Column({ field: 'processed_at', type: DataType.DATE })
  declare processedAt: Date | null;
  @Column({ field: 'cancelled_at', type: DataType.DATE })
  declare cancelledAt: Date | null;
  @Column({ field: 'failure_reason', type: DataType.TEXT })
  declare failureReason: string | null;
  @Default(DataType.NOW)
  @Index('idx_created_at')
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  // Virtual getters
  get totalAmount(): number {
    return this.commissionAmount + (this.rootCommissionAmount || 0);
  }
  get totalDeductions(): number {
    return (this.tdsAmount || 0) + (this.gstAmount || 0);
  }
  get commissionRate(): number {
    return this.commissionType === CommissionType.FLAT
      ? this.commissionAmount
      : this.metadata?.commissionRate || 0;
  }
  get isProcessed(): boolean {
    return this.status === CommissionStatus.PROCESSED;
  }
  get isPending(): boolean {
    return this.status === CommissionStatus.PENDING;
  }
  get isFailed(): boolean {
    return this.status === CommissionStatus.FAILED;
  }
  get isCancelled(): boolean {
    return this.status === CommissionStatus.CANCELLED;
  }
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get commissionAmountInRupees(): number {
    return this.commissionAmount / 100;
  }
  get rootCommissionAmountInRupees(): number {
    return (this.rootCommissionAmount || 0) / 100;
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
  get totalCommissionInRupees(): number {
    return this.totalAmount / 100;
  }
  get totalDeductionsInRupees(): number {
    return this.totalDeductions / 100;
  }

  // Associations
  @BelongsTo(() => Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction',
  })
  declare transaction: Transaction;
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  declare user: User;
  @BelongsTo(() => User, { foreignKey: 'fromUserId', as: 'fromUser' })
  declare fromUser: User | null;

  // Instance methods
  calculateNetAmount(): void {
    const totalCommission =
      this.commissionAmount + (this.rootCommissionAmount || 0);
    const totalDeductions = (this.tdsAmount || 0) + (this.gstAmount || 0);
    this.netAmount = Math.max(0, totalCommission - totalDeductions);
  }

  async markAsProcessed(): Promise<void> {
    if (this.isProcessed) throw new Error('Commission already processed');
    if (this.isCancelled)
      throw new Error('Cannot process cancelled commission');
    this.status = CommissionStatus.PROCESSED;
    this.processedAt = new Date();
    await this.save();
  }

  async markAsFailed(reason: string): Promise<void> {
    if (this.isProcessed)
      throw new Error('Cannot mark processed commission as failed');
    if (this.isCancelled)
      throw new Error('Cannot mark cancelled commission as failed');
    this.status = CommissionStatus.FAILED;
    this.failureReason = reason;
    await this.save();
  }

  async cancel(reason?: string): Promise<void> {
    if (this.isProcessed) throw new Error('Cannot cancel processed commission');
    this.status = CommissionStatus.CANCELLED;
    this.cancelledAt = new Date();
    if (reason) this.failureReason = reason;
    await this.save();
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateAmounts(instance: CommissionEarning): void {
    if (instance.amount < 0) throw new Error('Amount cannot be negative');
    if (instance.commissionAmount < 0)
      throw new Error('Commission amount cannot be negative');
    if (instance.rootCommissionAmount < 0)
      throw new Error('Root commission amount cannot be negative');
    if ((instance.tdsAmount || 0) < 0)
      throw new Error('TDS amount cannot be negative');
    if ((instance.gstAmount || 0) < 0)
      throw new Error('GST amount cannot be negative');
    if (instance.commissionAmount > instance.amount)
      throw new Error('Commission amount cannot exceed transaction amount');
    instance.calculateNetAmount();
    if (instance.netAmount < 0)
      throw new Error('Net amount cannot be negative');
  }

  @BeforeCreate
  static setMetadataDefaults(instance: CommissionEarning): void {
    if (!instance.metadata) instance.metadata = {} as CommissionMetadata;
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

  @BeforeUpdate
  static updateTimestamp(instance: CommissionEarning): void {
    if (instance.changed()) instance.updatedAt = new Date();
  }
}
