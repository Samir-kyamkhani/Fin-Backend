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
} from 'sequelize-typescript';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

import type { IRootCommissionEarningMetadata } from '../interface/root-commission-earning.interface';
import { CommissionType } from '../enums/root-commission-earning.enums';

// import { RootWallet } from '../root-wallets/root-wallet.model';
// import { Transaction } from '../transactions/transaction.model';
// import { RootLedgerEntry } from '../root-ledger-entries/root-ledger-entry.model';

@Table({
  tableName: 'root_commission_earnings',
  underscored: true,
  timestamps: false,
})
export class RootCommissionEarning extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.UUID,
    field: 'user_transaction_id',
    allowNull: false,
  })
  userTransactionId: string;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'root_id',
    allowNull: false,
  })
  rootId: string;

  @ForeignKey(() => RootWallet)
  @Column({
    type: DataType.UUID,
    field: 'wallet_id',
    allowNull: false,
  })
  walletId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'from_user_id',
    allowNull: false,
  })
  fromUserId: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'commission_amount',
    allowNull: false,
  })
  commissionAmount: number;

  @Column({
    type: DataType.ENUM('FLAT', 'PERCENTAGE'),
    field: 'commission_type',
    allowNull: false,
  })
  commissionType: CommissionType;

  @Column({
    type: DataType.BIGINT,
    field: 'tds_amount',
    allowNull: true,
  })
  tdsAmount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'gst_amount',
    allowNull: true,
  })
  gstAmount: number;

  @Column({
    type: DataType.BIGINT,
    field: 'net_amount',
    allowNull: false,
  })
  netAmount: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: IRootCommissionEarningMetadata;

  @Default(Date.now)
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  // Associations
  @BelongsTo(() => Root)
  root: Root;

  @BelongsTo(() => RootWallet)
  wallet: RootWallet;

  @BelongsTo(() => User, 'fromUserId')
  fromUser: User;

  @BelongsTo(() => Transaction)
  userTransaction: Transaction;

  @HasMany(() => RootLedgerEntry, 'commissionEarningId')
  rootLedgerEntries: RootLedgerEntry[];
}
