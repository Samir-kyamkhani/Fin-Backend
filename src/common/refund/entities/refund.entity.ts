import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { RefundStatus } from '../enums/retund.enum';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';

@Table({
  tableName: 'refunds',
  timestamps: true,
  underscored: true,
  modelName: 'Refund',
  indexes: [
    {
      fields: ['transaction_id'],
    },
  ],
})
export class Refund extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.UUID,
    field: 'transaction_id',
    allowNull: false,
  })
  transactionId: string;

  @Column({
    type: DataType.STRING,
    field: 'initiated_by',
    allowNull: false,
  })
  initiatedBy: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  amount: number; // Note: BIGINT maps to number in TypeScript

  @Column({
    type: DataType.ENUM(...Object.values(RefundStatus)),
    defaultValue: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  reason: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: Record<string, any>;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
  })
  transaction: Transaction;
}
