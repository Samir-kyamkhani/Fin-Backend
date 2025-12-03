import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Role } from 'src/common/role/entities/role.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

// Define enums
export enum CreatedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

@Table({
  tableName: 'role_permissions',
  timestamps: true,
  underscored: true,
  modelName: 'RolePermission',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission', 'service_id'],
      where: {
        is_active: true,
        revoked_at: null,
      },
    },
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      fields: ['role_id'],
    },
    {
      fields: ['is_active'],
    },
  ],
})
export class RolePermission extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    field: 'role_id',
    allowNull: false,
  })
  roleId: string;

  @ForeignKey(() => ServiceProvider)
  @Column({
    type: DataType.UUID,
    field: 'service_id',
    allowNull: true, // For global permissions
  })
  serviceId: string;

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

  @BelongsTo(() => Role, {
    foreignKey: 'role_id',
    as: 'role',
  })
  role: Role;

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
    as: 'createdByUser',
    scope: {
      created_by_type: CreatedByType.ADMIN,
    },
  })
  createdByUser: User;
}
