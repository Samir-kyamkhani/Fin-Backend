import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
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
import { User } from 'src/user/entities/user.entity';
import { Wallet } from 'src/common/wallet/entities/wallet.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { ApiWebhook } from 'src/common/api-webhook/entities/api-webhook.entity';
import { CommissionEarning } from 'src/common/commission-earning/entities/commission-earning.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { Refund } from 'src/common/refund/entities/refund.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';

@DefaultScope(() => ({
  attributes: {
    exclude: ['requestPayload', 'responsePayload', 'providerResponse'],
  },
  order: [['initiated_at', 'DESC']],
}))
@Scopes(() => ({
  full: {
    include: ['user', 'wallet', 'apiEntity', 'service', 'refunds'],
  },
  withSensitiveData: {
    attributes: {
      include: ['requestPayload', 'responsePayload', 'providerResponse'],
    },
  },
  pending: {
    where: { status: TransactionStatus.PENDING },
  },
  successful: {
    where: { status: TransactionStatus.SUCCESS },
  },
  failed: {
    where: { status: TransactionStatus.FAILED },
  },
  recent: (days: number = 7) => ({
    where: {
      initiatedAt: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
  }),
  byUser: (userId: string) => ({
    where: { userId },
  }),
  byWallet: (walletId: string) => ({
    where: { walletId },
  }),
  byStatus: (status: TransactionStatus) => ({
    where: { status },
  }),
  withCommissionDetails: {
    include: ['commissionEarnings', 'rootCommissionEarnings'],
  },
}))
@Table({
  tableName: 'transactions',
  underscored: true,
  timestamps: false,
})
export class Transaction extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    field: 'reference_id',
    allowNull: true,
    unique: true,
  })
  referenceId: string;

  @Index
  @Column({
    type: DataType.STRING,
    field: 'external_ref_id',
    allowNull: true,
  })
  externalRefId: string;

  @Index
  @Column({
    type: DataType.STRING,
    field: 'idempotency_key',
    allowNull: true,
    unique: true,
  })
  idempotencyKey: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    validate: {
      min: 1,
    },
  })
  amount: number;

  @Default(Currency.INR)
  @Column({
    type: DataType.ENUM('INR'),
  })
  currency: Currency;

  @Column({
    type: DataType.BIGINT,
    field: 'net_amount',
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  netAmount: number;

  @Default(TransactionStatus.PENDING)
  @Column({
    type: DataType.ENUM(
      'PENDING',
      'SUCCESS',
      'FAILED',
      'REVERSED',
      'REFUNDED',
      'CANCELLED',
    ),
  })
  status: TransactionStatus;

  @ForeignKey(() => ServiceProvider)
  @Column({
    type: DataType.UUID,
    field: 'service_id',
    allowNull: true,
  })
  serviceId: string;

  @Column({
    type: DataType.ENUM(
      'COLLECTION',
      'PAYOUT',
      'REFUND',
      'REVERSAL',
      'COMMISSION',
      'FEE',
      'TAX',
      'ADJUSTMENT',
      'CHARGE',
      'FUND_REQ_BANK',
      'FUND_REQ_RAZORPAY',
    ),
    field: 'payment_type',
    allowNull: false,
  })
  paymentType: PaymentType;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
  })
  userId: string;

  @ForeignKey(() => Wallet)
  @Index
  @Column({
    type: DataType.UUID,
    field: 'wallet_id',
    allowNull: false,
  })
  walletId: string;

  @ForeignKey(() => ApiEntity)
  @Column({
    type: DataType.UUID,
    field: 'api_entity_id',
    allowNull: true,
  })
  apiEntityId: string;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'total_commission',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  totalCommission: number;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'root_commission',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  rootCommission: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  providerCharge: number;

  @Column({
    type: DataType.BIGINT,
    field: 'tax_amount',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  taxAmount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'fee_amount',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  feeAmount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'cashback_amount',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  cashbackAmount: number;

  @Column({
    type: DataType.STRING,
    field: 'provider_reference',
    allowNull: true,
  })
  providerReference: string;

  @Column({
    type: DataType.JSON,
    field: 'provider_response',
    allowNull: true,
  })
  providerResponse: Record<string, any>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  requestPayload: Record<string, any>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  responsePayload: Record<string, any>;

  @Default(Date.now)
  @Column({
    type: DataType.DATE,
    field: 'initiated_at',
  })
  initiatedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'processed_at',
    allowNull: true,
  })
  processedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'completed_at',
    allowNull: true,
  })
  completedAt: Date;

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

  // Associations
  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Wallet)
  wallet: Wallet;

  @BelongsTo(() => ApiEntity)
  apiEntity: ApiEntity;

  @BelongsTo(() => ServiceProvider)
  service: ServiceProvider;

  @HasMany(() => ApiWebhook)
  apiWebhooks: ApiWebhook[];

  @HasMany(() => CommissionEarning)
  commissionEarnings: CommissionEarning[];

  @HasMany(() => RootCommissionEarning)
  rootCommissionEarnings: RootCommissionEarning[];

  @HasMany(() => LedgerEntry)
  ledgerEntries: LedgerEntry[];

  @HasMany(() => Refund)
  refunds: Refund[];

  // Hooks
  @BeforeCreate
  static generateReferenceId(instance: Transaction) {
    if (!instance.referenceId) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      instance.referenceId = `TXN-${timestamp}-${random}`;
    }

    // Validate net amount consistency
    Transaction.validateNetAmount(instance);
  }

  @BeforeUpdate
  static updateTimestamps(instance: Transaction) {
    if (instance.changed('status')) {
      const now = new Date();

      if (
        instance.status === TransactionStatus.PENDING &&
        !instance.processedAt
      ) {
        instance.processedAt = now;
      }

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
  static validateNetAmount(instance: Transaction) {
    const calculatedNet = instance.netAmountAfterDeductions;

    if (instance.netAmount !== calculatedNet) {
      throw new Error(
        `Net amount mismatch. Expected ${calculatedNet}, got ${instance.netAmount}`,
      );
    }
  }

  // Instance methods
  markAsSuccess(
    providerReference?: string,
    providerResponse?: Record<string, any>,
  ): void {
    this.status = TransactionStatus.SUCCESS;
    if (providerReference) this.providerReference = providerReference;
    if (providerResponse) this.providerResponse = providerResponse;
    this.completedAt = new Date();
  }

  isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in (error as Record<string, unknown>) &&
      typeof (error as Record<string, unknown>).message === 'string'
    );
  }

  markAsRefunded(): void {
    if (!this.canRefund) {
      throw new Error('Transaction cannot be refunded');
    }
    this.status = TransactionStatus.REFUNDED;
    this.completedAt = new Date();
  }

  markAsCancelled(): void {
    if (!this.canCancel) {
      throw new Error('Transaction cannot be cancelled');
    }
    this.status = TransactionStatus.CANCELLED;
    this.completedAt = new Date();
  }

  markAsReversed(): void {
    this.status = TransactionStatus.REVERSED;
    this.completedAt = new Date();
  }

  addCommission(commission: number, isRootCommission: boolean = false): void {
    if (isRootCommission) {
      this.rootCommission = (this.rootCommission || 0) + commission;
    }
    this.totalCommission = (this.totalCommission || 0) + commission;
  }

  getRefundableAmount(): number {
    if (!this.canRefund) return 0;

    const refunds: unknown[] = Array.isArray(this.refunds) ? this.refunds : [];

    let totalRefunded = 0;

    for (const item of refunds) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'status' in item &&
        'amount' in item
      ) {
        const status = (item as { status: unknown }).status;
        const amount = (item as { amount: unknown }).amount;

        if (status === 'SUCCESS' && typeof amount === 'number') {
          totalRefunded += amount;
        }
      }
    }

    return Math.max(0, this.netAmount - totalRefunded);
  }

  toJSON() {
    const rawUnknown: unknown = super.toJSON();

    if (typeof rawUnknown !== 'object' || rawUnknown === null) {
      return {};
    }

    const raw = rawUnknown as Record<string, unknown>;

    const values: Record<string, unknown> = { ...raw };

    delete values.requestPayload;
    delete values.responsePayload;
    delete values.providerResponse;

    return values;
  }
}
