import { Op } from 'sequelize';
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
  DeletedAt,
} from 'sequelize-typescript';
import { Currency, WalletType } from '../enums/wallet.enums';
import { User } from 'src/user/entities/user.entity';
import type { WalletLimits } from '../interface/wallet.interface';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';

// ========== WALLET ==========
@DefaultScope(() => ({
  where: { isActive: true },
  attributes: { exclude: ['version'] },
}))
@Scopes(() => ({
  active: { where: { isActive: true } },
  inactive: { where: { isActive: false } },
  withUser: { include: ['user'] },
  full: { include: ['user', 'ledgerEntries', 'transactions'] },
  withLimits: {
    attributes: {
      include: ['dailyLimit', 'monthlyLimit', 'perTransactionLimit'],
    },
  },
  paranoid: { paranoid: false },
  deleted: { paranoid: false, where: { deletedAt: { [Op.ne]: null } } },
  byUser: (userId: string) => ({ where: { userId } }),
  byType: (walletType: WalletType) => ({ where: { walletType } }),
}))
@Table({
  tableName: 'wallets',
  underscored: true,
  paranoid: true,
  version: true,
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_wallet_type', fields: ['wallet_type'] },
    { name: 'idx_is_active', fields: ['is_active'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    { name: 'idx_balance', fields: ['balance'] },
    {
      name: 'idx_user_wallet_type',
      fields: ['user_id', 'wallet_type'],
      unique: true,
    },
  ],
})
export class Wallet extends Model<Wallet> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => User)
  @Index('idx_user_id')
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
    validate: { notEmpty: { msg: 'User ID is required' } },
  })
  userId: string;
  @Default(0)
  @Column({ type: DataType.BIGINT, validate: { min: 0 } })
  balance: number;
  @Default(Currency.INR)
  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    validate: { isIn: [Object.values(Currency)] },
  })
  currency: Currency;
  @Default(WalletType.PRIMARY)
  @Column({
    type: DataType.ENUM(...Object.values(WalletType)),
    field: 'wallet_type',
    validate: { isIn: [Object.values(WalletType)] },
  })
  walletType: WalletType;
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'hold_balance',
    validate: { min: 0 },
  })
  holdBalance: number;
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'available_balance',
    validate: { min: 0 },
  })
  availableBalance: number;
  @Column({ type: DataType.BIGINT, field: 'daily_limit', validate: { min: 0 } })
  dailyLimit: number | null;
  @Column({
    type: DataType.BIGINT,
    field: 'monthly_limit',
    validate: { min: 0 },
  })
  monthlyLimit: number | null;
  @Column({
    type: DataType.BIGINT,
    field: 'per_transaction_limit',
    validate: { min: 1 },
  })
  perTransactionLimit: number | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive: boolean;
  @Default(1) @Column({ type: DataType.INTEGER }) declare version: number;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;
  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;

  // Virtual fields
  get calculatedAvailableBalance(): number {
    return this.balance - this.holdBalance;
  }
  get limits(): WalletLimits {
    return {
      dailyLimit: this.dailyLimit || undefined,
      monthlyLimit: this.monthlyLimit || undefined,
      perTransactionLimit: this.perTransactionLimit || undefined,
    };
  }
  set limits(limits: WalletLimits) {
    if (limits.dailyLimit !== undefined) this.dailyLimit = limits.dailyLimit;
    if (limits.monthlyLimit !== undefined)
      this.monthlyLimit = limits.monthlyLimit;
    if (limits.perTransactionLimit !== undefined)
      this.perTransactionLimit = limits.perTransactionLimit;
  }
  get balanceInRupees(): number {
    return this.balance / 100;
  }
  get holdBalanceInRupees(): number {
    return this.holdBalance / 100;
  }
  get availableBalanceInRupees(): number {
    return this.availableBalance / 100;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' }) user: User;
  @HasMany(() => LedgerEntry, {
    foreignKey: 'walletId',
    as: 'ledgerEntries',
    onDelete: 'CASCADE',
  })
  ledgerEntries: LedgerEntry[];
  @HasMany(() => Transaction, {
    foreignKey: 'walletId',
    as: 'transactions',
    onDelete: 'SET NULL',
  })
  transactions: Transaction[];

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateBalanceConsistency(instance: Wallet): void {
    if (instance.holdBalance > instance.balance)
      throw new Error('Hold balance cannot exceed total balance');
    if (instance.availableBalance !== instance.balance - instance.holdBalance)
      instance.availableBalance = instance.balance - instance.holdBalance;
    if (
      instance.balance < 0 ||
      instance.holdBalance < 0 ||
      instance.availableBalance < 0
    )
      throw new Error('Balances cannot be negative');
    if (instance.perTransactionLimit && instance.perTransactionLimit <= 0)
      throw new Error('Per transaction limit must be greater than 0');
    if (instance.dailyLimit && instance.dailyLimit < 0)
      throw new Error('Daily limit cannot be negative');
    if (instance.monthlyLimit && instance.monthlyLimit < 0)
      throw new Error('Monthly limit cannot be negative');
  }

  @BeforeUpdate
  static incrementVersion(instance: Wallet): void {
    instance.version = (instance.version || 0) + 1;
  }

  // Instance methods
  canDebit(amount: number): boolean {
    return this.availableBalance >= amount && amount > 0;
  }
  canCredit(amount: number): boolean {
    return amount > 0;
  }
  canHold(amount: number): boolean {
    return this.availableBalance >= amount && amount > 0;
  }
  canReleaseHold(amount: number): boolean {
    return this.holdBalance >= amount && amount > 0;
  }
  checkTransactionLimit(amount: number): boolean {
    return !this.perTransactionLimit || amount <= this.perTransactionLimit;
  }
  getRemainingDailyLimit(dailyUsage: number = 0): number {
    return !this.dailyLimit
      ? Infinity
      : Math.max(0, this.dailyLimit - dailyUsage);
  }
  getRemainingMonthlyLimit(monthlyUsage: number = 0): number {
    return !this.monthlyLimit
      ? Infinity
      : Math.max(0, this.monthlyLimit - monthlyUsage);
  }

  debit(amount: number): void {
    if (!this.canDebit(amount))
      throw new Error(
        `Cannot debit ${amount}. Available balance: ${this.availableBalance}`,
      );
    this.balance -= amount;
    this.availableBalance -= amount;
  }

  credit(amount: number): void {
    if (!this.canCredit(amount)) throw new Error(`Cannot credit ${amount}`);
    this.balance += amount;
    this.availableBalance += amount;
  }

  holdAmount(amount: number): void {
    if (!this.canHold(amount))
      throw new Error(
        `Cannot hold ${amount}. Available balance: ${this.availableBalance}`,
      );
    this.holdBalance += amount;
    this.availableBalance -= amount;
  }

  releaseHold(amount: number): void {
    if (!this.canReleaseHold(amount))
      throw new Error(
        `Cannot release hold of ${amount}. Hold balance: ${this.holdBalance}`,
      );
    this.holdBalance -= amount;
    this.availableBalance += amount;
  }

  settleHold(amount: number, isDebit: boolean = true): void {
    if (!this.canReleaseHold(amount))
      throw new Error(
        `Cannot settle hold of ${amount}. Hold balance: ${this.holdBalance}`,
      );
    this.holdBalance -= amount;
    if (isDebit) this.balance -= amount;
  }

  applyLimits(limits: WalletLimits): void {
    this.limits = limits;
  }
  resetHold(): void {
    this.availableBalance += this.holdBalance;
    this.holdBalance = 0;
  }

  toJSON(): Record<string, unknown> {
    const values: Record<string, unknown> = { ...super.toJSON() };
    values.calculatedAvailableBalance = this.calculatedAvailableBalance;
    values.limits = this.limits;
    return values;
  }
}
