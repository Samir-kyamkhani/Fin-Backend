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

import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { WebhookStatus, WebhookProvider } from '../enums/api-webhook.enum';

@Table({
  tableName: 'api_webhooks',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['transaction_id'] },
    { fields: ['api_entity_id'] },
    { fields: ['provider', 'event_type'] },
    { fields: ['status', 'created_at'] },
  ],
})
export class ApiWebhook extends Model<ApiWebhook> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => Transaction)
  @Column({ field: 'transaction_id', type: DataType.UUID })
  transactionId?: string;

  @ForeignKey(() => ApiEntity)
  @Column({ field: 'api_entity_id', type: DataType.UUID })
  apiEntityId: string;

  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(WebhookProvider)) })
  provider: WebhookProvider;

  @AllowNull(false)
  @Index
  @Column({ field: 'event_type', type: DataType.STRING })
  eventType: string;

  @AllowNull(false)
  @Column({ type: DataType.JSON })
  payload: Record<string, unknown>;

  @Column({ type: DataType.STRING })
  signature?: string;

  @Column({ type: DataType.JSON })
  headers?: Record<string, unknown>;

  @Default(WebhookStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(WebhookStatus)) })
  status: WebhookStatus;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  attempts: number;

  @Column({ field: 'last_attempt_at', type: DataType.DATE })
  lastAttemptAt?: Date;

  @Column({ type: DataType.JSON })
  response?: Record<string, unknown>;

  @Default(() => new Date())
  @Column({ field: 'created_at', type: DataType.DATE })
  declare createdAt: Date;

  @Default(() => new Date())
  @Column({ field: 'updated_at', type: DataType.DATE })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => ApiEntity)
  apiEntity: ApiEntity;

  @BelongsTo(() => Transaction)
  transaction: Transaction;

  // Virtual fields
  get isProcessable(): boolean {
    return (
      this.status === WebhookStatus.PENDING ||
      this.status === WebhookStatus.RETRY
    );
  }

  get maxAttemptsReached(): boolean {
    return this.attempts >= 5; // Configurable max attempts
  }

  // Hooks
  @BeforeUpdate
  static updateLastAttempt(instance: ApiWebhook) {
    if (instance.changed('attempts')) {
      instance.lastAttemptAt = new Date();
    }
  }
}
