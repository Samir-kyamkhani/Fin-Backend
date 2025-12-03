import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { RefundStatus } from '../enums/retund.enum';

@Table({
  tableName: 'refunds',
  timestamps: true,
  underscored: true,
  modelName: 'Refund',
  indexes: [
    { name: 'idx_transaction_id', fields: ['transaction_id'] },
    { name: 'idx_status_created', fields: ['status', 'created_at'] },
    { name: 'idx_initiated_by', fields: ['initiated_by'] },
  ],
})
export class Refund extends Model<Refund> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => Transaction)
  @Column({ type: DataType.UUID, field: 'transaction_id', allowNull: false })
  transactionId: string;
  @Column({
    type: DataType.STRING(100),
    field: 'initiated_by',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  initiatedBy: string;
  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 1 } })
  amount: number;
  @Column({
    type: DataType.ENUM(...Object.values(RefundStatus)),
    defaultValue: RefundStatus.PENDING,
    validate: { isIn: [Object.values(RefundStatus)] },
  })
  status: RefundStatus;
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    validate: { len: [0, 500] },
  })
  reason: string | null;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<
    string,
    unknown
  >;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get isPending(): boolean {
    return this.status === RefundStatus.PENDING;
  }
  get isProcessed(): boolean {
    return this.status === RefundStatus.PROCESSED;
  }
  get isFailed(): boolean {
    return this.status === RefundStatus.FAILED;
  }
  get isCancelled(): boolean {
    return this.status === RefundStatus.CANCELLED;
  }

  get isSuccess(): boolean {
    return this.status === RefundStatus.SUCCESS;
  }

  // Associations
  @BelongsTo(() => Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
  })
  transaction: Transaction;

  // Hooks
  @BeforeCreate
  static validateRefundAmount(instance: Refund): void {
    if (instance.amount <= 0)
      throw new Error('Refund amount must be greater than 0');
  }

  @BeforeUpdate
  static updateTimestamp(instance: Refund): void {
    instance.updatedAt = new Date();
  }
}
