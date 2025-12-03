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
import { User } from 'src/user/entities/user.entity';
import { CreatedByType } from '../enums/user-permission.enum';
import { Root } from 'src/root/entities/root.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';

// ========== USER PERMISSION ==========
@Table({
  tableName: 'user_permissions',
  timestamps: true,
  underscored: true,
  modelName: 'UserPermission',
  indexes: [
    {
      name: 'idx_user_permission_service_unique',
      unique: true,
      fields: ['user_id', 'permission', 'service_id'],
      where: { is_active: true, revoked_at: null },
    },
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_is_active', fields: ['is_active'] },
    { name: 'idx_service_id', fields: ['service_id'] },
  ],
})
export class UserPermission extends Model<UserPermission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => ServiceProvider)
  @Column({ type: DataType.UUID, field: 'service_id', allowNull: true })
  serviceId: string | null;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: false })
  userId: string;
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  permission: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'assigned_at', allowNull: false })
  assignedAt: Date;
  @Column({ type: DataType.DATE, field: 'revoked_at' }) revokedAt: Date | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive: boolean;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: 'created_by_type',
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: 'created_by_id', allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => ServiceProvider, { foreignKey: 'service_id', as: 'service' })
  service: ServiceProvider | null;
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' }) user: User;
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByAdmin',
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByAdmin: User | null;

  // Virtual properties
  get isActivePermission(): boolean {
    return this.isActive && !this.revokedAt;
  }

  // Hooks
  @BeforeCreate
  static validateUniquePermission(instance: UserPermission): void {
    if (!instance.permission) throw new Error('Permission is required');
  }

  @BeforeUpdate
  static updateRevokedAt(instance: UserPermission): void {
    if (
      instance.changed('isActive') &&
      !instance.isActive &&
      !instance.revokedAt
    ) {
      instance.revokedAt = new Date();
    }
    instance.updatedAt = new Date();
  }
}
