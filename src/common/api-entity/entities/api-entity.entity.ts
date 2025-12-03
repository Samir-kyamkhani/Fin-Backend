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
  AllowNull,
  PrimaryKey,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import { ApiWebhook } from 'src/common/api-webhook/entities/api-webhook.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { EntityStatus, ProviderType } from '../enums/api-entity.enum';

@Table({
  tableName: 'api_entities',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'idx_user_service', fields: ['user_id', 'service_id'] },
    { name: 'idx_entity_type_id', fields: ['entity_type', 'entity_id'] },
    { name: 'idx_status_created', fields: ['status', 'created_at'] },
    { name: 'idx_reference_unique', unique: true, fields: ['reference'] },
    { name: 'idx_entity_id_unique', unique: true, fields: ['entity_id'] },
  ],
})
export class ApiEntity extends Model<ApiEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;

  @AllowNull(false)
  @Column({
    field: 'entity_type',
    type: DataType.STRING(50),
    validate: { notEmpty: true, len: [1, 50] },
  })
  entityType: string;

  @AllowNull(false)
  @Index('idx_entity_id')
  @Column({
    field: 'entity_id',
    type: DataType.STRING(100),
    unique: true,
    validate: { notEmpty: true, len: [1, 100] },
  })
  entityId: string;

  @Column({
    type: DataType.STRING(100),
    unique: true,
    validate: { len: [1, 100] },
  })
  reference: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index('idx_user_id')
  @Column({
    field: 'user_id',
    type: DataType.UUID,
    validate: { notEmpty: true },
  })
  userId: string;

  @ForeignKey(() => ServiceProvider)
  @Index('idx_service_id')
  @Column({ field: 'service_id', type: DataType.UUID })
  serviceId: string | null;

  @Default(EntityStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(EntityStatus)),
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  status: EntityStatus;

  @Default(true)
  @Column({ field: 'is_active', type: DataType.BOOLEAN })
  isActive: boolean;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ProviderType)),
    validate: { isIn: [Object.values(ProviderType)] },
  })
  provider: ProviderType;

  @Column({ field: 'provider_data', type: DataType.JSON, defaultValue: {} })
  providerData: Record<string, unknown>;

  @Column({ type: DataType.JSON, defaultValue: {} })
  metadata: Record<string, unknown>;

  @Column({ field: 'verification_data', type: DataType.JSON, defaultValue: {} })
  verificationData: Record<string, unknown>;

  @Default(DataType.NOW)
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  @Column({ field: 'verified_at', type: DataType.DATE })
  verifiedAt: Date | null;

  // Virtual/computed fields
  get isVerified(): boolean {
    return !!this.verifiedAt && this.status === EntityStatus.VERIFIED;
  }
  get isPending(): boolean {
    return this.status === EntityStatus.PENDING;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' }) user: User;
  @BelongsTo(() => ServiceProvider, { foreignKey: 'serviceId', as: 'service' })
  service: ServiceProvider | null;
  @HasMany(() => ApiWebhook, {
    foreignKey: 'apiEntityId',
    as: 'apiWebhooks',
    onDelete: 'CASCADE',
  })
  apiWebhooks: ApiWebhook[];
  @HasMany(() => Transaction, {
    foreignKey: 'apiEntityId',
    as: 'transactions',
    onDelete: 'SET NULL',
  })
  transactions: Transaction[];

  // Hooks
  @BeforeCreate
  static generateReference(instance: ApiEntity): void {
    if (!instance.reference) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 11);
      instance.reference = `${instance.provider}_${timestamp}_${random}`;
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: ApiEntity): void {
    instance.updatedAt = new Date();
  }
}
