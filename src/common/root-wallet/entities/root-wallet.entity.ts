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
  BeforeUpdate,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';

import { literal } from 'sequelize';
import { Root } from 'src/root/entities/root.entity';
import { Currency, WalletType } from '../enums/root-wallet.enums';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { RootLedgerEntry } from 'src/common/root-ledger-entry/entities/root-ledger-entry.entity';

@DefaultScope(() => ({
  where: { isActive: true },
  attributes: { exclude: ['version'] },
}))
@Scopes(() => ({
  active: { where: { isActive: true } },
  inactive: { where: { isActive: false } },
  withRoot: { include: ['root'] },
  full: { include: ['root', 'commissionEarnings', 'ledgerEntries'] },
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
  indexes: [
    { name: 'idx_root_id', fields: ['root_id'] },
    { name: 'idx_wallet_type', fields: ['wallet_type'] },
    { name: 'idx_is_active', fields: ['is_active'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class RootWallet extends Model<RootWallet> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
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

  // Virtual field
  get calculatedAvailableBalance(): number {
    return this.balance - this.holdBalance;
  }

  // Associations
  @BelongsTo(() => Root, { foreignKey: 'rootId', as: 'root' }) root: Root;
  @HasMany(() => RootCommissionEarning, {
    foreignKey: 'walletId',
    as: 'commissionEarnings',
  })
  commissionEarnings: RootCommissionEarning[];
  @HasMany(() => RootLedgerEntry, {
    foreignKey: 'walletId',
    as: 'ledgerEntries',
  })
  ledgerEntries: RootLedgerEntry[];

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateBalanceConsistency(instance: RootWallet): void {
    if (instance.holdBalance > instance.balance)
      throw new Error('Hold balance cannot exceed total balance');
    if (instance.availableBalance !== instance.balance - instance.holdBalance)
      throw new Error(
        'Available balance must equal balance minus hold balance',
      );
    if (
      instance.balance < 0 ||
      instance.holdBalance < 0 ||
      instance.availableBalance < 0
    )
      throw new Error('Balances cannot be negative');
  }

  @BeforeUpdate
  static incrementVersion(instance: RootWallet): void {
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
}
