import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
  Default,
  PrimaryKey,
  BeforeCreate,
  BeforeUpdate,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';
import {
  Currency,
  PaymentType,
  TransactionStatus,
} from '../enums/transaction.enums';
import { Op } from 'sequelize';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { Wallet } from 'src/common/wallet/entities/wallet.entity';
import { User } from 'src/user/entities/user.entity';
import { ApiWebhook } from 'src/common/api-webhook/entities/api-webhook.entity';
import { CommissionEarning } from 'src/common/commission-earning/entities/commission-earning.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { Refund } from 'src/common/refund/entities/refund.entity';
import { RefundStatus } from 'src/common/refund/enums/retund.enum';

@DefaultScope(() => ({
  attributes: {
    exclude: ['requestPayload', 'responsePayload', 'providerResponse'],
  },
  order: [['initiated_at', 'DESC']],
}))
@Scopes(() => ({
  full: { include: ['user', 'wallet', 'apiEntity', 'service', 'refunds'] },
  withSensitiveData: {
    attributes: {
      include: ['requestPayload', 'responsePayload', 'providerResponse'],
    },
  },
  pending: { where: { status: TransactionStatus.PENDING } },
  successful: { where: { status: TransactionStatus.SUCCESS } },
  failed: { where: { status: TransactionStatus.FAILED } },
  recent: (days: number = 7) => ({
    where: {
      initiatedAt: {
        [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
  }),
  byUser: (userId: string) => ({ where: { userId } }),
  byWallet: (walletId: string) => ({ where: { walletId } }),
  byStatus: (status: TransactionStatus) => ({ where: { status } }),
  withCommissionDetails: {
    include: ['commissionEarnings', 'rootCommissionEarnings'],
  },
}))
@Table({
  tableName: 'transactions',
  underscored: true,
  timestamps: false,
  indexes: [
    { name: 'idx_reference_id_unique', unique: true, fields: ['reference_id'] },
    { name: 'idx_external_ref_id', fields: ['external_ref_id'] },
    {
      name: 'idx_idempotency_key_unique',
      unique: true,
      fields: ['idempotency_key'],
    },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_wallet_id', fields: ['wallet_id'] },
    { name: 'idx_service_id', fields: ['service_id'] },
    { name: 'idx_api_entity_id', fields: ['api_entity_id'] },
    { name: 'idx_initiated_at', fields: ['initiated_at'] },
    { name: 'idx_status_initiated', fields: ['status', 'initiated_at'] },
    { name: 'idx_payment_type', fields: ['payment_type'] },
    { name: 'idx_processed_at', fields: ['processed_at'] },
    { name: 'idx_completed_at', fields: ['completed_at'] },
  ],
})
export class Transaction extends Model<Transaction> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @Index('idx_reference_id')
  @Column({
    type: DataType.STRING(50),
    field: 'reference_id',
    unique: true,
    validate: { len: [1, 50] },
  })
  referenceId: string | null;
  @Index('idx_external_ref_id')
  @Column({
    type: DataType.STRING(100),
    field: 'external_ref_id',
    validate: { len: [0, 100] },
  })
  externalRefId: string | null;
  @Index('idx_idempotency_key')
  @Column({
    type: DataType.STRING(255),
    field: 'idempotency_key',
    unique: true,
    validate: { len: [1, 255] },
  })
  idempotencyKey: string | null;
  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 1 } })
  amount: number;
  @Default(Currency.INR)
  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    validate: { isIn: [Object.values(Currency)] },
  })
  currency: Currency;
  @Column({
    type: DataType.BIGINT,
    field: 'net_amount',
    allowNull: false,
    validate: { min: 0 },
  })
  netAmount: number;
  @Default(TransactionStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(TransactionStatus)),
    validate: { isIn: [Object.values(TransactionStatus)] },
  })
  status: TransactionStatus;
  @ForeignKey(() => ServiceProvider)
  @Index('idx_service_id')
  @Column({ type: DataType.UUID, field: 'service_id' })
  serviceId: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(PaymentType)),
    field: 'payment_type',
    allowNull: false,
    validate: { isIn: [Object.values(PaymentType)] },
  })
  paymentType: PaymentType;
  @ForeignKey(() => User)
  @Index('idx_user_id')
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: false })
  userId: string;
  @ForeignKey(() => Wallet)
  @Index('idx_wallet_id')
  @Column({ type: DataType.UUID, field: 'wallet_id', allowNull: false })
  walletId: string;
  @ForeignKey(() => ApiEntity)
  @Index('idx_api_entity_id')
  @Column({ type: DataType.UUID, field: 'api_entity_id' })
  apiEntityId: string | null;
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'total_commission',
    validate: { min: 0 },
  })
  totalCommission: number;
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'root_commission',
    validate: { min: 0 },
  })
  rootCommission: number;
  @Column({ type: DataType.BIGINT, validate: { min: 0 } }) providerCharge:
    | number
    | null;
  @Column({ type: DataType.BIGINT, field: 'tax_amount', validate: { min: 0 } })
  taxAmount: number | null;
  @Column({ type: DataType.BIGINT, field: 'fee_amount', validate: { min: 0 } })
  feeAmount: number | null;
  @Column({
    type: DataType.BIGINT,
    field: 'cashback_amount',
    validate: { min: 0 },
  })
  cashbackAmount: number | null;
  @Column({
    type: DataType.STRING(100),
    field: 'provider_reference',
    validate: { len: [0, 100] },
  })
  providerReference: string | null;
  @Column({ type: DataType.JSON, field: 'provider_response', defaultValue: {} })
  providerResponse: Record<string, unknown>;
  @Column({ type: DataType.JSON, defaultValue: {} }) requestPayload: Record<
    string,
    unknown
  >;
  @Column({ type: DataType.JSON, defaultValue: {} }) responsePayload: Record<
    string,
    unknown
  >;
  @Default(DataType.NOW)
  @Index('idx_initiated_at')
  @Column({ type: DataType.DATE, field: 'initiated_at', allowNull: false })
  initiatedAt: Date;
  @Column({ type: DataType.DATE, field: 'processed_at' })
  processedAt: Date | null;
  @Column({ type: DataType.DATE, field: 'completed_at' })
  completedAt: Date | null;

  // Virtual calculated fields
  get totalDeductions(): number {
    return (
      (this.totalCommission || 0) +
      (this.providerCharge || 0) +
      (this.taxAmount || 0) +
      (this.feeAmount || 0)
    );
  }
  get netAmountAfterDeductions(): number {
    return this.amount - this.totalDeductions + (this.cashbackAmount || 0);
  }
  get isSuccessful(): boolean {
    return this.status === TransactionStatus.SUCCESS;
  }
  get isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }
  get isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }
  get canRefund(): boolean {
    return (
      this.isSuccessful &&
      ![
        TransactionStatus.REFUNDED,
        TransactionStatus.CANCELLED,
        TransactionStatus.REVERSED,
      ].includes(this.status)
    );
  }
  get canCancel(): boolean {
    return this.isPending;
  }
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get netAmountInRupees(): number {
    return this.netAmount / 100;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' }) user: User;
  @BelongsTo(() => Wallet, { foreignKey: 'walletId', as: 'wallet' })
  wallet: Wallet;
  @BelongsTo(() => ApiEntity, { foreignKey: 'apiEntityId', as: 'apiEntity' })
  apiEntity: ApiEntity | null;
  @BelongsTo(() => ServiceProvider, { foreignKey: 'serviceId', as: 'service' })
  service: ServiceProvider | null;
  @HasMany(() => ApiWebhook, {
    foreignKey: 'transactionId',
    as: 'apiWebhooks',
    onDelete: 'SET NULL',
  })
  apiWebhooks: ApiWebhook[];
  @HasMany(() => CommissionEarning, {
    foreignKey: 'transactionId',
    as: 'commissionEarnings',
    onDelete: 'CASCADE',
  })
  commissionEarnings: CommissionEarning[];
  @HasMany(() => RootCommissionEarning, {
    foreignKey: 'userTransactionId',
    as: 'rootCommissionEarnings',
    onDelete: 'CASCADE',
  })
  rootCommissionEarnings: RootCommissionEarning[];
  @HasMany(() => LedgerEntry, {
    foreignKey: 'transactionId',
    as: 'ledgerEntries',
    onDelete: 'SET NULL',
  })
  ledgerEntries: LedgerEntry[];
  @HasMany(() => Refund, {
    foreignKey: 'transactionId',
    as: 'refunds',
    onDelete: 'CASCADE',
  })
  refunds: Refund[];

  // Hooks
  @BeforeCreate
  static generateReferenceId(instance: Transaction): void {
    if (!instance.referenceId) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      instance.referenceId = `TXN-${timestamp}-${random}`;
    }
    Transaction.validateNetAmount(instance);
  }

  @BeforeUpdate
  static updateTimestamps(instance: Transaction): void {
    if (instance.changed('status')) {
      const now = new Date();
      if (
        instance.status === TransactionStatus.PENDING &&
        !instance.processedAt
      )
        instance.processedAt = now;
      if (
        [
          TransactionStatus.SUCCESS,
          TransactionStatus.FAILED,
          TransactionStatus.REFUNDED,
          TransactionStatus.CANCELLED,
        ].includes(instance.status) &&
        !instance.completedAt
      ) {
        instance.completedAt = now;
      }
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static validateNetAmount(instance: Transaction): void {
    const calculatedNet = instance.netAmountAfterDeductions;
    if (instance.netAmount !== calculatedNet)
      throw new Error(
        `Net amount mismatch. Expected ${calculatedNet}, got ${instance.netAmount}`,
      );
  }

  // Instance methods
  markAsSuccess(
    providerReference?: string,
    providerResponse?: Record<string, unknown>,
  ): void {
    this.status = TransactionStatus.SUCCESS;
    if (providerReference) this.providerReference = providerReference;
    if (providerResponse) this.providerResponse = providerResponse;
    this.completedAt = new Date();
  }

  markAsRefunded(): void {
    if (!this.canRefund) throw new Error('Transaction cannot be refunded');
    this.status = TransactionStatus.REFUNDED;
    this.completedAt = new Date();
  }

  markAsCancelled(): void {
    if (!this.canCancel) throw new Error('Transaction cannot be cancelled');
    this.status = TransactionStatus.CANCELLED;
    this.completedAt = new Date();
  }

  markAsReversed(): void {
    this.status = TransactionStatus.REVERSED;
    this.completedAt = new Date();
  }

  addCommission(commission: number, isRootCommission: boolean = false): void {
    if (isRootCommission)
      this.rootCommission = (this.rootCommission || 0) + commission;
    this.totalCommission = (this.totalCommission || 0) + commission;
  }

  getRefundableAmount(): number {
    if (!this.canRefund) return 0;
    const refunds: Refund[] = Array.isArray(this.refunds) ? this.refunds : [];
    let totalRefunded = 0;
    for (const refund of refunds) {
      if (
        refund.status === RefundStatus.SUCCESS &&
        typeof refund.amount === 'number'
      )
        totalRefunded += refund.amount;
    }
    return Math.max(0, this.netAmount - totalRefunded);
  }

  toJSON(): Record<string, unknown> {
    const values: Record<string, unknown> = { ...super.toJSON() };
    delete values.requestPayload;
    delete values.responsePayload;
    delete values.providerResponse;
    return values;
  }
}
