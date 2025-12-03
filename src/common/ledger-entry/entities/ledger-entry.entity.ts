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
  Unique,
} from 'sequelize-typescript';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { Wallet } from 'src/common/wallet/entities/wallet.entity';
import {
  LedgerEntryType,
  LedgerReferenceType,
} from '../enums/ledger-entry.enums';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import type { LedgerMetadata } from '../interface/ledger-entry.interface';

@Table({
  tableName: 'ledger_entries',
  timestamps: false,
  underscored: true,
  indexes: [
    { name: 'idx_transaction_id', fields: ['transaction_id'] },
    { name: 'idx_wallet_created', fields: ['wallet_id', 'created_at'] },
    { name: 'idx_service_reference', fields: ['service_id', 'reference_type'] },
    { name: 'idx_idempotency_key', unique: true, fields: ['idempotency_key'] },
    { name: 'idx_entry_type_created', fields: ['entry_type', 'created_at'] },
    {
      name: 'idx_reference_type_created',
      fields: ['reference_type', 'created_at'],
    },
    { name: 'idx_created_at', fields: ['created_at'] },
    {
      name: 'idx_running_balance',
      fields: ['wallet_id', 'created_at', 'running_balance'],
    },
  ],
})
export class LedgerEntry extends Model<LedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Transaction)
  @Index('idx_transaction_id')
  @Column({ field: 'transaction_id', type: DataType.UUID })
  transactionId: string | null;
  @ForeignKey(() => Wallet)
  @AllowNull(false)
  @Index('idx_wallet_id')
  @Column({ field: 'wallet_id', type: DataType.UUID })
  walletId: string;
  @AllowNull(false)
  @Column({
    field: 'entry_type',
    type: DataType.ENUM(...Object.values(LedgerEntryType)),
    validate: { isIn: [Object.values(LedgerEntryType)] },
  })
  entryType: LedgerEntryType;
  @AllowNull(false)
  @Index('idx_reference_type')
  @Column({
    field: 'reference_type',
    type: DataType.ENUM(...Object.values(LedgerReferenceType)),
    validate: { isIn: [Object.values(LedgerReferenceType)] },
  })
  referenceType: LedgerReferenceType;
  @ForeignKey(() => ServiceProvider)
  @Index('idx_service_id')
  @Column({ field: 'service_id', type: DataType.UUID })
  serviceId: string | null;
  @AllowNull(false)
  @Column({ type: DataType.BIGINT, validate: { min: 1 } })
  amount: number;
  @AllowNull(false)
  @Column({ field: 'running_balance', type: DataType.BIGINT })
  runningBalance: number;
  @AllowNull(false)
  @Column({
    type: DataType.STRING(500),
    validate: { notEmpty: true, len: [1, 500] },
  })
  narration: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: LedgerMetadata;
  @Unique('idx_idempotency_key')
  @Index('idx_idempotency_key')
  @Column({
    field: 'idempotency_key',
    type: DataType.STRING(255),
    validate: { notEmpty: true, len: [1, 255] },
  })
  idempotencyKey: string;
  @Default(DataType.NOW)
  @Index('idx_created_at')
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get runningBalanceInRupees(): number {
    return this.runningBalance / 100;
  }
  get isCredit(): boolean {
    return this.entryType === LedgerEntryType.CREDIT;
  }
  get isDebit(): boolean {
    return this.entryType === LedgerEntryType.DEBIT;
  }
  get formattedNarration(): string {
    const date = new Date(this.createdAt).toLocaleDateString('en-IN');
    const amount = Math.abs(this.amountInRupees).toFixed(2);
    const type = this.isCredit ? 'Credited' : 'Debited';
    return `${date}: ${type} ₹${amount} - ${this.narration}`;
  }
  get transactionSummary(): {
    type: string;
    amount: string;
    balance: string;
    date: string;
  } {
    return {
      type: this.entryType,
      amount: `₹${Math.abs(this.amountInRupees).toFixed(2)}`,
      balance: `₹${this.runningBalanceInRupees.toFixed(2)}`,
      date: new Date(this.createdAt).toLocaleString('en-IN'),
    };
  }

  // Associations
  @BelongsTo(() => ServiceProvider, { foreignKey: 'serviceId', as: 'service' })
  service: ServiceProvider | null;
  @BelongsTo(() => Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction',
  })
  transaction: Transaction | null;
  @BelongsTo(() => Wallet, { foreignKey: 'walletId', as: 'wallet' })
  wallet: Wallet;

  // Instance methods
  validateEntry(): void {
    if (this.amount <= 0) throw new Error('Amount must be greater than 0');
    if (this.isDebit && this.runningBalance < 0)
      throw new Error('Debit entry cannot result in negative balance');
    if (!this.narration || this.narration.trim().length === 0)
      throw new Error('Narration is required');
  }

  generateIdempotencyKey(): string {
    if (!this.idempotencyKey) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      this.idempotencyKey = `${this.walletId}_${this.referenceType}_${this.amount}_${timestamp}_${random}`;
    }
    return this.idempotencyKey;
  }

  // Hooks
  @BeforeCreate
  static validateAndPrepare(instance: LedgerEntry): void {
    instance.validateEntry();
    if (!instance.idempotencyKey) instance.generateIdempotencyKey();
    if (!instance.metadata) instance.metadata = {} as LedgerMetadata;
    if (!instance.metadata.auditInfo)
      instance.metadata.auditInfo = { performedAt: new Date() };
  }

  @BeforeCreate
  static async checkIdempotency(instance: LedgerEntry): Promise<void> {
    if (instance.idempotencyKey) {
      const existingEntry = await LedgerEntry.findOne({
        where: { idempotencyKey: instance.idempotencyKey },
      });
      if (existingEntry)
        throw new Error(
          'Duplicate ledger entry detected. Idempotency key already exists.',
        );
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static sanitizeNarration(instance: LedgerEntry): void {
    if (instance.narration) {
      instance.narration = instance.narration.trim();
      if (instance.narration.length > 500)
        instance.narration = instance.narration.substring(0, 497) + '...';
    }
  }

  @BeforeCreate
  static async validateWalletBalance(instance: LedgerEntry): Promise<void> {
    const wallet = await Wallet.findByPk(instance.walletId, {
      attributes: ['balance'],
    });
    if (!wallet)
      throw new Error(`Wallet with ID ${instance.walletId} not found`);
    const walletBalance: number = Number(wallet.balance ?? 0);
    if (instance.isCredit) {
      instance.runningBalance = walletBalance + instance.amount;
    } else {
      const newBalance = walletBalance - instance.amount;
      if (newBalance < 0)
        throw new Error('Insufficient balance for debit transaction');
      instance.runningBalance = newBalance;
    }
  }
}
