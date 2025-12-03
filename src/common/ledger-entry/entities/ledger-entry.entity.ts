import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  BeforeUpdate,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  Unique,
} from 'sequelize-typescript';

// import { ServiceProvider } from '../../service-providers/entities/service-provider.entity';
// import { Transaction } from '../../transactions/entities/transaction.entity';
// import { Wallet } from '../../wallets/entities/wallet.entity';
import type { ILedgerMetadata } from '../interface/ledger-entry.interface';
import {
  LedgerEntryType,
  LedgerReferenceType,
} from '../enums/ledger-entry.enums';

@Table({
  tableName: 'ledger_entries',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['transaction_id'],
    },
    {
      fields: ['wallet_id', 'created_at'],
    },
    {
      fields: ['service_id', 'reference_type'],
    },
    {
      fields: ['idempotency_key'],
    },
    {
      fields: ['entry_type', 'created_at'],
    },
    {
      fields: ['reference_type', 'created_at'],
    },
    {
      fields: ['created_at'],
    },
  ],
})
export class LedgerEntry extends Model<LedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Transaction)
  @Column({
    field: 'transaction_id',
    type: DataType.UUID,
  })
  transactionId: string;

  @ForeignKey(() => Wallet)
  @AllowNull(false)
  @Index
  @Column({
    field: 'wallet_id',
    type: DataType.UUID,
  })
  walletId: string;

  @AllowNull(false)
  @Column({
    field: 'entry_type',
    type: DataType.ENUM(...Object.values(LedgerEntryType)),
  })
  entryType: LedgerEntryType;

  @AllowNull(false)
  @Index
  @Column({
    field: 'reference_type',
    type: DataType.ENUM(...Object.values(LedgerReferenceType)),
  })
  referenceType: LedgerReferenceType;

  @ForeignKey(() => ServiceProvider)
  @Column({
    field: 'service_id',
    type: DataType.UUID,
  })
  serviceId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    validate: {
      min: 0,
    },
  })
  amount: number; // Amount in paise

  @AllowNull(false)
  @Column({
    field: 'running_balance',
    type: DataType.BIGINT,
  })
  runningBalance: number; // Running balance in paise

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [1, 500],
    },
  })
  narration: string;

  @Column({
    type: DataType.JSON,
  })
  metadata: ILedgerMetadata;

  @Unique
  @Index
  @Column({
    field: 'idempotency_key',
    type: DataType.STRING,
  })
  idempotencyKey: string;

  @Default(() => new Date())
  @Index
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
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
  @BelongsTo(() => ServiceProvider)
  service: ServiceProvider;

  @BelongsTo(() => Transaction)
  transaction: Transaction;

  @BelongsTo(() => Wallet)
  wallet: Wallet;

  // Instance methods
  validateEntry(): void {
    // Validate amount is positive
    if (this.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate running balance logic
    if (this.isCredit && this.runningBalance < 0) {
      throw new Error('Credit entry cannot result in negative balance');
    }

    // Validate narration
    if (!this.narration || this.narration.trim().length === 0) {
      throw new Error('Narration is required');
    }
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
  static validateAndPrepare(instance: LedgerEntry) {
    // Validate the entry
    instance.validateEntry();

    // Generate idempotency key if not provided
    if (!instance.idempotencyKey) {
      instance.generateIdempotencyKey();
    }

    // Ensure metadata is properly structured
    if (!instance.metadata) {
      instance.metadata = {};
    }

    // Add timestamp to metadata if not present
    if (!instance.metadata.auditInfo) {
      instance.metadata.auditInfo = {
        performedAt: new Date(),
      };
    }
  }

  @BeforeCreate
  static async checkIdempotency(instance: LedgerEntry) {
    if (instance.idempotencyKey) {
      const existingEntry = await LedgerEntry.findOne({
        where: { idempotencyKey: instance.idempotencyKey },
      });

      if (existingEntry) {
        throw new Error(
          'Duplicate ledger entry detected. Idempotency key already exists.',
        );
      }
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static sanitizeNarration(instance: LedgerEntry) {
    if (instance.narration) {
      // Trim and clean narration
      instance.narration = instance.narration.trim();

      // Limit length
      if (instance.narration.length > 500) {
        instance.narration = instance.narration.substring(0, 497) + '...';
      }
    }
  }

  @BeforeCreate
  static async validateWallet(instance: LedgerEntry) {
    // Fetch wallet
    const wallet = await Wallet.findByPk(instance.walletId);

    if (!wallet) {
      throw new Error(`Wallet with ID ${instance.walletId} not found`);
    }

    // Ensure wallet.balance is a number
    const walletBalance: number = Number(wallet.getDataValue('balance') ?? 0);

    // Calculate running balance
    if (instance.isCredit) {
      instance.runningBalance = walletBalance + instance.amount;
    } else {
      const newBalance = walletBalance - instance.amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance for debit transaction');
      }

      instance.runningBalance = newBalance;
    }
  }
}
