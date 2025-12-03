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
  BeforeCreate,
  BeforeUpdate,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';
import { Root } from 'src/root/entities/root.entity';
import { Currency, WalletType } from '../enums/root-wallet.enums';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { RootLedgerEntry } from 'src/common/root-ledger-entry/entities/root-ledger-entry.entity';
import { literal } from 'sequelize';

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
  withRoot: {
    include: ['root'],
  },
  full: {
    include: ['root', 'commissionEarnings', 'ledgerEntries'],
  },
  withBalances: {
    attributes: {
      include: [
        [literal('balance - hold_balance'), 'calculatedAvailableBalance'],
      ],
    },
  },
}))
@Table({
  tableName: 'root_wallets',
  underscored: true,
  version: true,
})
export class RootWallet extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'root_id',
    allowNull: false,
    validate: {
      notNull: { msg: 'Root ID is required' },
      notEmpty: { msg: 'Root ID cannot be empty' },
    },
  })
  rootId: string;

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

  // Virtual field for calculated available balance
  get calculatedAvailableBalance(): number {
    return this.balance - this.holdBalance;
  }

  // Associations
  @BelongsTo(() => Root)
  root: Root;

  @HasMany(() => RootCommissionEarning)
  commissionEarnings: RootCommissionEarning[];

  @HasMany(() => RootLedgerEntry)
  ledgerEntries: RootLedgerEntry[];

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateBalanceConsistency(instance: RootWallet) {
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
  }

  @BeforeUpdate
  static incrementVersion(instance: RootWallet) {
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
}
