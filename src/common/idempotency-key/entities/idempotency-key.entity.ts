import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  Default,
  BeforeCreate,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'idempotency_keys',
  timestamps: false,
  underscored: true,
  modelName: 'IdempotencyKey',
  indexes: [
    { name: 'idx_key_primary', fields: ['key'] },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_expired_at', fields: ['expired_at'] },
    { name: 'idx_used', fields: ['used'] },
  ],
})
export class IdempotencyKey extends Model<IdempotencyKey> {
  @Column({
    type: DataType.STRING(255),
    primaryKey: true,
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  })
  declare key: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: true })
  userId: string | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Column({ type: DataType.DATE, field: 'expired_at', allowNull: false })
  expiresAt: Date;
  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  used: boolean;
  @Column({ type: DataType.JSON, defaultValue: {} }) meta: Record<
    string,
    unknown
  >;

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }
  get isValid(): boolean {
    return !this.used && !this.isExpired;
  }

  // Instance methods
  markAsUsed(): void {
    this.used = true;
    this.save().catch(() => {
      return;
      // console.error('Failed to mark idempotency key as used', err);
    });
  }

  // Hooks
  @BeforeCreate
  static validateExpiry(instance: IdempotencyKey): void {
    if (!instance.expiresAt) {
      // Default expiry: 24 hours from creation
      instance.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (instance.expiresAt <= new Date()) {
      throw new Error('Idempotency key expiry must be in the future');
    }
  }
}
