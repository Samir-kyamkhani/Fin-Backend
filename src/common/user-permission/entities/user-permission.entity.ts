import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { CreatedByType } from '../enums/user-permission.enum';

@Table({
  tableName: 'user_permissions',
  timestamps: true,
  underscored: true,
  modelName: 'UserPermission',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'permission', 'service_id'],
      where: {
        is_active: true,
        revoked_at: null,
      },
    },
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['is_active'],
    },
  ],
})
export class UserPermission extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => ServiceProvider)
  @Column({
    type: DataType.UUID,
    field: 'service_id',
    allowNull: true, // For global permissions
  })
  serviceId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
  })
  userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  permission: string;

  @Column({
    type: DataType.DATE,
    field: 'assigned_at',
    defaultValue: DataType.NOW,
  })
  assignedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'revoked_at',
    allowNull: true,
  })
  revokedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: 'created_by_type',
    allowNull: false,
  })
  createdByType: CreatedByType;

  @Column({
    type: DataType.UUID,
    field: 'created_by_id',
    allowNull: false,
  })
  createdById: string;

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
  @BelongsTo(() => ServiceProvider, {
    foreignKey: 'service_id',
    as: 'service',
  })
  service: ServiceProvider;

  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user: User;

  // Polymorphic relations
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
    scope: {
      created_by_type: CreatedByType.ROOT,
    },
  })
  createdByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByAdmin',
    scope: {
      created_by_type: CreatedByType.ADMIN,
    },
  })
  createdByAdmin: User;
}
