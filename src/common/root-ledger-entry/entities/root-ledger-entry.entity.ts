// src/modules/root-ledger-entries/entities/root-ledger-entry.entity.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  PrimaryKey,
  BeforeCreate,
} from 'sequelize-typescript';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { RootWallet } from 'src/common/root-wallet/entities/root-wallet.entity';

// ========== ENUMS ==========
export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum ReferenceType {
  TRANSACTION = 'TRANSACTION',
  COMMISSION = 'COMMISSION',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  BONUS = 'BONUS',
  CHARGE = 'CHARGE',
  FEE = 'FEE',
  TAX = 'TAX',
  PAYOUT = 'PAYOUT',
  COLLECTION = 'COLLECTION',
}

// ========== INTERFACES ==========
export interface AuditInfo {
  performedAt: Date;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransactionDetails {
  transactionId?: string;
  serviceType?: string;
  provider?: string;
  customerId?: string;
  referenceNumber?: string;
}

export interface CommissionDetails {
  commissionSettingId?: string;
  commissionType?: string;
  commissionRate?: number;
  transactionAmount?: number;
  calculatedCommission?: number;
}

export interface RootLedgerMetadata {
  auditInfo: AuditInfo;
  transactionDetails?: TransactionDetails;
  commissionDetails?: CommissionDetails;
  notes?: string;
  attachments?: string[];
  tags?: string[];
}

// ========== ENTITY ==========
@Table({
  tableName: 'root_ledger_entries',
  underscored: true,
  timestamps: false,
  indexes: [
    { name: 'idx_commission_earning_id', fields: ['commission_earning_id'] },
    { name: 'idx_wallet_id', fields: ['wallet_id'] },
    { name: 'idx_entry_type', fields: ['entry_type'] },
    { name: 'idx_reference_type', fields: ['reference_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    {
      name: 'idx_running_balance',
      fields: ['wallet_id', 'created_at', 'running_balance'],
    },
    {
      name: 'idx_wallet_reference',
      fields: ['wallet_id', 'reference_type', 'created_at'],
    },
  ],
})
export class RootLedgerEntry extends Model<RootLedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;

  @ForeignKey(() => RootCommissionEarning)
  @Column({
    type: DataType.UUID,
    field: 'commission_earning_id',
    allowNull: true,
  })
  commissionEarningId: string | null;

  @ForeignKey(() => RootWallet)
  @Column({ type: DataType.UUID, field: 'wallet_id', allowNull: false })
  walletId: string;

  @Column({
    type: DataType.ENUM(...Object.values(LedgerEntryType)),
    field: 'entry_type',
    allowNull: false,
  })
  entryType: LedgerEntryType;

  @Column({
    type: DataType.ENUM(...Object.values(ReferenceType)),
    field: 'reference_type',
    allowNull: false,
  })
  referenceType: ReferenceType;

  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 1 } })
  amount: number;

  @Column({ type: DataType.BIGINT, field: 'running_balance', allowNull: false })
  runningBalance: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: false,
    validate: { len: [1, 1000] },
  })
  narration: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {} as RootLedgerMetadata,
  })
  metadata: RootLedgerMetadata;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
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
    const date = new Date(this.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const amount = Math.abs(this.amountInRupees).toFixed(2);
    const type = this.isCredit ? 'Credited' : 'Debited';
    const sign = this.isCredit ? '+' : '-';
    return `${date}: ${type} ₹${amount} (${sign}₹${amount}) - ${this.narration}`;
  }

  get formattedRunningBalance(): string {
    return `₹${this.runningBalanceInRupees.toFixed(2)}`;
  }

  get isCommission(): boolean {
    return this.referenceType === ReferenceType.COMMISSION;
  }

  get isTransaction(): boolean {
    return this.referenceType === ReferenceType.TRANSACTION;
  }

  get isPayout(): boolean {
    return this.referenceType === ReferenceType.PAYOUT;
  }

  // Associations
  @BelongsTo(() => RootWallet, { foreignKey: 'wallet_id', as: 'wallet' })
  wallet: RootWallet;

  @BelongsTo(() => RootCommissionEarning, {
    foreignKey: 'commission_earning_id',
    as: 'commissionEarning',
  })
  commissionEarning: RootCommissionEarning | null;

  // Hooks
  @BeforeCreate
  static validateAmountAndBalance(instance: RootLedgerEntry): void {
    if (instance.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (instance.isDebit && instance.runningBalance < 0) {
      throw new Error('Debit entry cannot result in negative balance');
    }

    if (!instance.narration || instance.narration.trim().length === 0) {
      throw new Error('Narration is required');
    }
  }

  @BeforeCreate
  static setMetadataDefaults(instance: RootLedgerEntry): void {
    if (!instance.metadata) {
      instance.metadata = {
        auditInfo: {
          performedAt: new Date(),
        },
      };
    }

    if (!instance.metadata.auditInfo) {
      instance.metadata.auditInfo = { performedAt: new Date() };
    }
  }

  @BeforeCreate
  static async validateWalletBalance(instance: RootLedgerEntry): Promise<void> {
    const wallet: RootWallet | null = await RootWallet.findByPk(
      instance.walletId,
      {
        attributes: ['balance'],
      },
    );

    if (!wallet) {
      throw new Error(`Root wallet with ID ${instance.walletId} not found`);
    }

    const walletBalance = Number(wallet.balance ?? 0);

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

  // Instance methods
  getTransactionDetails(): TransactionDetails | null {
    return this.metadata?.transactionDetails || null;
  }

  getCommissionDetails(): CommissionDetails | null {
    return this.metadata?.commissionDetails || null;
  }

  getAuditInfo(): AuditInfo {
    return this.metadata?.auditInfo || { performedAt: this.createdAt };
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as unknown as Record<string, unknown>;

    // Add formatted values
    values.amountInRupees = this.amountInRupees;
    values.runningBalanceInRupees = this.runningBalanceInRupees;
    values.isCredit = this.isCredit;
    values.isDebit = this.isDebit;
    values.formattedNarration = this.formattedNarration;
    values.formattedRunningBalance = this.formattedRunningBalance;
    values.isCommission = this.isCommission;
    values.isTransaction = this.isTransaction;
    values.isPayout = this.isPayout;

    return values;
  }
}
