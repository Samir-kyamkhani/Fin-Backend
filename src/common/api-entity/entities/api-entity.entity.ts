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
} from 'sequelize-typescript';

import { EntityStatus, ProviderType } from '../enums/api-entity.enum';
import { User } from 'src/user/entities/user.entity';
import { ApiWebhook } from 'src/common/api-webhook/entities/api-webhook.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';

@Table({
  tableName: 'api_entities',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'service_id'],
    },
    {
      fields: ['entity_type', 'entity_id'],
    },
    {
      fields: ['status', 'created_at'],
    },
  ],
})
export class ApiEntity extends Model<ApiEntity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    field: 'entity_type',
    type: DataType.STRING,
  })
  entityType: string;

  @AllowNull(false)
  @Index
  @Column({
    field: 'entity_id',
    type: DataType.STRING,
    unique: true,
  })
  entityId: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  reference: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    field: 'user_id',
    type: DataType.UUID,
  })
  userId: string;

  @ForeignKey(() => ServiceProvider)
  @Column({
    field: 'service_id',
    type: DataType.UUID,
  })
  serviceId: string;

  @Default(EntityStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(EntityStatus)),
  })
  status: EntityStatus;

  @Default(true)
  @Column({
    field: 'is_active',
    type: DataType.BOOLEAN,
  })
  isActive: boolean;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ProviderType)),
  })
  provider: ProviderType;

  @Column({
    field: 'provider_data',
    type: DataType.JSON,
  })
  providerData: Record<string, any>;

  @Column({
    type: DataType.JSON,
  })
  metadata: Record<string, any>;

  @Column({
    field: 'verification_data',
    type: DataType.JSON,
  })
  verificationData: Record<string, any>;

  @Column({
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  declare updatedAt: Date;

  @Column({
    field: 'verified_at',
    type: DataType.DATE,
  })
  verifiedAt: Date;

  // Associations
  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => ServiceProvider)
  service: ServiceProvider;

  @HasMany(() => ApiWebhook)
  apiWebhooks: ApiWebhook[];

  @HasMany(() => Transaction)
  transactions: Transaction[];

  // Hooks
  @BeforeCreate
  static generateReference(instance: ApiEntity) {
    if (!instance.reference) {
      instance.reference = `${instance.provider}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }
  }
}
