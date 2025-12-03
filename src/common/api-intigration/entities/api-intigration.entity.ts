import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
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
      unique: true,
      fields: ['platform_name', 'service_name', 'created_by_root_id'],
    },
  ],
})
export class ApiIntegration extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    field: 'platform_name',
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  platformName: string;

  @Column({
    type: DataType.STRING,
    field: 'service_name',
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  serviceName: string;

  @Column({
    type: DataType.TEXT,
    field: 'api_base_url',
    allowNull: false,
    validate: {
      notEmpty: true,
      isUrl: true,
    },
  })
  apiBaseUrl: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: {},
  })
  credentials: Record<string, any>;

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
  })
  isActive: boolean;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'created_by_root_id',
    allowNull: false,
  })
  createdByRootId: string;

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

  // Instance methods
  isOperational(): boolean {
    return this.isActive;
  }

  // Static methods
  static async findByPlatformAndService(
    platformName: string,
    serviceName: string,
    rootId: string,
  ): Promise<ApiIntegration | null> {
    return this.findOne({
      where: {
        platformName,
        serviceName,
        createdByRootId: rootId,
      },
    });
  }

  static async findActiveByRoot(rootId: string): Promise<ApiIntegration[]> {
    return this.findAll({
      where: {
        createdByRootId: rootId,
        isActive: true,
      },
    });
  }
}
