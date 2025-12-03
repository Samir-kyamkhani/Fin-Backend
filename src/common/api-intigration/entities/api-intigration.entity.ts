import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  BeforeUpdate,
} from 'sequelize-typescript';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Root } from 'src/root/entities/root.entity';
@Table({
  tableName: 'api_integrations',
  timestamps: true,
  underscored: true,
  modelName: 'ApiIntegration',
  indexes: [
    {
      name: 'idx_platform_service_root_unique',
      unique: true,
      fields: ['platform_name', 'service_name', 'created_by_root_id'],
    },
    { name: 'idx_created_by_root_id', fields: ['created_by_root_id'] },
    { name: 'idx_is_active', fields: ['is_active'] },
  ],
})
export class ApiIntegration extends Model<ApiIntegration> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(50),
    field: 'platform_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  platformName: string;
  @Column({
    type: DataType.STRING(50),
    field: 'service_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  serviceName: string;
  @Column({
    type: DataType.TEXT,
    field: 'api_base_url',
    allowNull: false,
    validate: { notEmpty: true, isUrl: true },
  })
  apiBaseUrl: string;
  @Column({ type: DataType.JSON, allowNull: false, defaultValue: {} })
  credentials: Record<string, unknown>;
  @Column({ type: DataType.BOOLEAN, field: 'is_active', defaultValue: true })
  isActive: boolean;
  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'created_by_root_id',
    allowNull: false,
  })
  createdByRootId: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  isOperational(): boolean {
    return this.isActive;
  }

  // Associations
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_root_id',
    as: 'createdByRoot',
    onDelete: 'CASCADE',
  })
  createdByRoot: Root;
  @HasMany(() => ServiceProvider, {
    foreignKey: 'integration_id',
    as: 'serviceProviders',
    onDelete: 'CASCADE',
  })
  serviceProviders: ServiceProvider[];

  // Static methods
  static async findByPlatformAndService(
    platformName: string,
    serviceName: string,
    rootId: string,
  ): Promise<ApiIntegration | null> {
    return this.findOne({
      where: { platformName, serviceName, createdByRootId: rootId },
    });
  }

  static async findActiveByRoot(rootId: string): Promise<ApiIntegration[]> {
    return this.findAll({ where: { createdByRootId: rootId, isActive: true } });
  }

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: ApiIntegration): void {
    instance.updatedAt = new Date();
  }
}
