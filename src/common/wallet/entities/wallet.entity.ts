import { literal } from 'sequelize';
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
  DeletedAt,
} from 'sequelize-typescript';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { User } from 'src/user/entities/user.entity';
import { Currency, WalletType } from '../enums/wallet.enums';
import type { WalletLimits } from '../interface/wallet.interface';

@DefaultScope(() => ({
  where: { isActive: true },
  attributes: {
    exclude: ['version'],
  },
}))
@Scopes(() => ({
  active: {
    where: { isActive: true },
  },
  inactive: {
    where: { isActive: false },
  },
  withUser: {
    include: ['user'],
  },
  full: {
    include: ['user', 'ledgerEntries', 'transactions'],
  },
  withLimits: {
    attributes: {
      include: ['dailyLimit', 'monthlyLimit', 'perTransactionLimit'],
    },
  },
  paranoid: {
    paranoid: false,
  },
  deleted: {
    paranoid: false,
    where: { deletedAt: { $ne: null } },
  },
  byUser: (userId: string) => ({
    where: { userId },
  }),
  byType: (walletType: WalletType) => ({
    where: { walletType },
  }),
  withBalanceSummary: {
    attributes: {
      include: [
        [literal('balance - hold_balance'), 'calculatedAvailableBalance'],
      ],
    },
  },
}))
@Table({
  tableName: 'wallets',
  underscored: true,
  paranoid: true,
  version: true,
})
export class Wallet extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
    validate: {
      notNull: { msg: 'User ID is required' },
      notEmpty: { msg: 'User ID cannot be empty' },
    },
  })
  userId: string;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    validate: {
      min: 0,
    },
  })
  balance: number;

  @Default(Currency.INR)
  @Column({
    type: DataType.ENUM('INR'),
  })
  currency: Currency;

  @Default(WalletType.PRIMARY)
  @Column({
    type: DataType.ENUM(
      'PRIMARY',
      'COMMISSION',
      'ESCROW',
      'TAX',
      'BONUS',
      'HOLDING',
    ),
    field: 'wallet_type',
  })
  walletType: WalletType;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'hold_balance',
    validate: {
      min: 0,
    },
  })
  holdBalance: number;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    field: 'available_balance',
    validate: {
      min: 0,
    },
  })
  availableBalance: number;

  @Column({
    type: DataType.BIGINT,
    field: 'daily_limit',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  dailyLimit: number;

  @Column({
    type: DataType.BIGINT,
    field: 'monthly_limit',
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  monthlyLimit: number;

  @Column({
    type: DataType.BIGINT,
    field: 'per_transaction_limit',
    allowNull: true,
    validate: {
      min: 1,
    },
  })
  perTransactionLimit: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  isActive: boolean;

  @Default(1)
  @Column({
    type: DataType.INTEGER,
  })
  declare version: number;

  @Default(Date.now)
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Default(Date.now)
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    field: 'deleted_at',
    allowNull: true,
  })
  declare deletedAt: Date;

  // Virtual field for calculated available balance
  get calculatedAvailableBalance(): number {
    return this.balance - this.holdBalance;
  }

  // Virtual field for limits
  get limits(): WalletLimits {
    return {
      dailyLimit: this.dailyLimit,
      monthlyLimit: this.monthlyLimit,
      perTransactionLimit: this.perTransactionLimit,
    };
  }

  set limits(limits: WalletLimits) {
    if (limits.dailyLimit !== undefined) this.dailyLimit = limits.dailyLimit;
    if (limits.monthlyLimit !== undefined)
      this.monthlyLimit = limits.monthlyLimit;
    if (limits.perTransactionLimit !== undefined)
      this.perTransactionLimit = limits.perTransactionLimit;
  }

  // Associations
  @BelongsTo(() => User)
  user: User;

  @HasMany(() => LedgerEntry)
  ledgerEntries: LedgerEntry[];

  @HasMany(() => Transaction)
  transactions: Transaction[];

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateBalanceConsistency(instance: Wallet) {
    // Ensure hold balance doesn't exceed total balance
    if (instance.holdBalance > instance.balance) {
      throw new Error('Hold balance cannot exceed total balance');
    }

    // Ensure available balance is consistent
    if (instance.availableBalance !== instance.balance - instance.holdBalance) {
      throw new Error(
        'Available balance must equal balance minus hold balance',
      );
    }

    // Ensure non-negative balances
    if (
      instance.balance < 0 ||
      instance.holdBalance < 0 ||
      instance.availableBalance < 0
    ) {
      throw new Error('Balances cannot be negative');
    }

    // Validate limits
    if (instance.perTransactionLimit && instance.perTransactionLimit <= 0) {
      throw new Error('Per transaction limit must be greater than 0');
    }

    if (instance.dailyLimit && instance.dailyLimit < 0) {
      throw new Error('Daily limit cannot be negative');
    }

    if (instance.monthlyLimit && instance.monthlyLimit < 0) {
      throw new Error('Monthly limit cannot be negative');
    }
  }

  @BeforeUpdate
  static incrementVersion(instance: Wallet) {
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
    if (!this.perTransactionLimit) return true;
    return amount <= this.perTransactionLimit;
  }

  getRemainingDailyLimit(dailyUsage: number = 0): number {
    if (!this.dailyLimit) return Infinity;
    return Math.max(0, this.dailyLimit - dailyUsage);
  }

  getRemainingMonthlyLimit(monthlyUsage: number = 0): number {
    if (!this.monthlyLimit) return Infinity;
    return Math.max(0, this.monthlyLimit - monthlyUsage);
  }

  debit(amount: number): void {
    if (!this.canDebit(amount)) {
      throw new Error(
        `Cannot debit ${amount}. Available balance: ${this.availableBalance}`,
      );
    }
    this.balance -= amount;
    this.availableBalance -= amount;
  }

  credit(amount: number): void {
    if (!this.canCredit(amount)) {
      throw new Error(`Cannot credit ${amount}`);
    }
    this.balance += amount;
    this.availableBalance += amount;
  }

  holdAmount(amount: number): void {
    if (!this.canHold(amount)) {
      throw new Error(
        `Cannot hold ${amount}. Available balance: ${this.availableBalance}`,
      );
    }
    this.holdBalance += amount;
    this.availableBalance -= amount;
  }

  releaseHold(amount: number): void {
    if (!this.canReleaseHold(amount)) {
      throw new Error(
        `Cannot release hold of ${amount}. Hold balance: ${this.holdBalance}`,
      );
    }
    this.holdBalance -= amount;
    this.availableBalance += amount;
  }

  settleHold(amount: number, isDebit: boolean = true): void {
    if (!this.canReleaseHold(amount)) {
      throw new Error(
        `Cannot settle hold of ${amount}. Hold balance: ${this.holdBalance}`,
      );
    }

    this.holdBalance -= amount;
    if (isDebit) {
      this.balance -= amount;
    }
    // If credit, balance was already increased when amount was held
  }

  applyLimits(limits: WalletLimits): void {
    this.limits = limits;
  }

  resetHold(): void {
    this.availableBalance += this.holdBalance;
    this.holdBalance = 0;
  }

  toJSON(): Record<string, any> {
    const values: Record<string, any> = { ...super.toJSON() };

    values.calculatedAvailableBalance = this.calculatedAvailableBalance;
    values.limits = this.limits;

    return values;
  }
}
