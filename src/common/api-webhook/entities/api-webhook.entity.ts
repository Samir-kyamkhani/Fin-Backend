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
  BeforeUpdate,
} from 'sequelize-typescript';
import { WebhookProvider, WebhookStatus } from '../enums/api-webhook.enum';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';

@Table({
  tableName: 'api_webhooks',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'idx_transaction_id', fields: ['transaction_id'] },
    { name: 'idx_api_entity_id', fields: ['api_entity_id'] },
    { name: 'idx_provider_event', fields: ['provider', 'event_type'] },
    { name: 'idx_status_created', fields: ['status', 'created_at'] },
    { name: 'idx_last_attempt', fields: ['last_attempt_at'] },
  ],
})
export class ApiWebhook extends Model<ApiWebhook> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Transaction)
  @Index('idx_transaction_id')
  @Column({ field: 'transaction_id', type: DataType.UUID })
  transactionId: string | null;
  @ForeignKey(() => ApiEntity)
  @AllowNull(false)
  @Index('idx_api_entity_id')
  @Column({ field: 'api_entity_id', type: DataType.UUID })
  apiEntityId: string;
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(WebhookProvider)),
    validate: { isIn: [Object.values(WebhookProvider)] },
  })
  provider: WebhookProvider;
  @AllowNull(false)
  @Index('idx_event_type')
  @Column({
    field: 'event_type',
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  eventType: string;
  @AllowNull(false)
  @Column({ type: DataType.JSON, defaultValue: {} })
  payload: Record<string, unknown>;
  @Column({ type: DataType.STRING(500), validate: { len: [0, 500] } })
  signature: string | null;
  @Column({ type: DataType.JSON, defaultValue: {} }) headers: Record<
    string,
    unknown
  >;
  @Default(WebhookStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(WebhookStatus)),
    validate: { isIn: [Object.values(WebhookStatus)] },
  })
  status: WebhookStatus;
  @Default(0)
  @Column({ type: DataType.INTEGER, validate: { min: 0, max: 50 } })
  attempts: number;
  @Column({ field: 'last_attempt_at', type: DataType.DATE })
  lastAttemptAt: Date | null;
  @Column({ type: DataType.JSON, defaultValue: {} }) response: Record<
    string,
    unknown
  >;
  @Default(DataType.NOW)
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  // Virtual fields
  get isProcessable(): boolean {
    return (
      this.status === WebhookStatus.PENDING ||
      this.status === WebhookStatus.RETRY
    );
  }
  get maxAttemptsReached(): boolean {
    return this.attempts >= 5;
  }
  get nextRetryAt(): Date | null {
    if (!this.lastAttemptAt || !this.isProcessable) return null;
    const delay = Math.min(
      30 * 60 * 1000,
      Math.pow(2, this.attempts) * 60 * 1000,
    );
    return new Date(this.lastAttemptAt.getTime() + delay);
  }

  // Associations
  @BelongsTo(() => ApiEntity, { foreignKey: 'apiEntityId', as: 'apiEntity' })
  apiEntity: ApiEntity;
  @BelongsTo(() => Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction',
  })
  transaction: Transaction | null;

  // Hooks
  @BeforeUpdate
  static updateLastAttempt(instance: ApiWebhook): void {
    if (instance.changed('attempts')) instance.lastAttemptAt = new Date();
    instance.updatedAt = new Date();
  }
}
