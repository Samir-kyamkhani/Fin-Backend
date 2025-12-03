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
import { ApiIntegration } from 'src/common/api-intigration/entities/api-intigration.entity';
import { User } from 'src/user/entities/user.entity';
import { AssignedByType, ServiceStatus } from '../enums/service-provider.enum';
import { Root } from 'src/root/entities/root.entity';
import { CommissionSetting } from 'src/common/commission-setting/entities/commission-setting.entity';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { RolePermission } from 'src/common/role-permission/entities/role-permission.entity';
import { UserPermission } from 'src/common/user-permission/entities/user-permission.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';

// ========== SERVICE PROVIDER ==========
@Table({
  tableName: 'service_providers',
  timestamps: true,
  underscored: true,
  modelName: 'ServiceProvider',
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_integration_id', fields: ['integration_id'] },
    { name: 'idx_root_id', fields: ['root_id'] },
    { name: 'idx_assigned_by', fields: ['assigned_by_id', 'assigned_by_type'] },
    { name: 'idx_hierarchy_path', fields: ['hierarchy_path'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_hierarchy_level', fields: ['hierarchy_level'] },
  ],
})
export class ServiceProvider extends Model<ServiceProvider> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: false })
  userId: string;
  @ForeignKey(() => ApiIntegration)
  @Column({ type: DataType.UUID, field: 'integration_id', allowNull: false })
  integrationId: string;
  @Column({
    type: DataType.STRING(100),
    field: 'service_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  serviceName: string;
  @Column({
    type: DataType.ENUM(...Object.values(ServiceStatus)),
    defaultValue: ServiceStatus.ACTIVE,
    validate: { isIn: [Object.values(ServiceStatus)] },
  })
  status: ServiceStatus;
  @Column({
    type: DataType.ENUM(...Object.values(AssignedByType)),
    field: 'assigned_by_type',
    allowNull: false,
    validate: { isIn: [Object.values(AssignedByType)] },
  })
  assignedByType: AssignedByType;
  @Column({ type: DataType.UUID, field: 'assigned_by_id', allowNull: false })
  assignedById: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: 'root_id', allowNull: false })
  rootId: string;
  @Column({
    type: DataType.INTEGER,
    field: 'hierarchy_level',
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  })
  hierarchyLevel: number;
  @Column({
    type: DataType.TEXT,
    field: 'hierarchy_path',
    allowNull: false,
    validate: { notEmpty: true },
  })
  hierarchyPath: string;
  @Column({ type: DataType.BOOLEAN, field: 'can_reassign', defaultValue: true })
  canReassign: boolean;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  isActive(): boolean {
    return this.status === ServiceStatus.ACTIVE;
  }
  canBeReassigned(): boolean {
    return this.canReassign && this.isActive();
  }

  // Associations
  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
  })
  user: User;
  @BelongsTo(() => ApiIntegration, {
    foreignKey: 'integration_id',
    as: 'integration',
    onDelete: 'CASCADE',
  })
  integration: ApiIntegration;
  @BelongsTo(() => Root, {
    foreignKey: 'root_id',
    as: 'root',
    onDelete: 'CASCADE',
  })
  root: Root;
  @HasMany(() => Transaction, {
    foreignKey: 'service_id',
    as: 'transactions',
    onDelete: 'RESTRICT',
  })
  transactions: Transaction[];
  @HasMany(() => CommissionSetting, {
    foreignKey: 'service_id',
    as: 'commissionSettings',
    onDelete: 'CASCADE',
  })
  commissionSettings: CommissionSetting[];
  @HasMany(() => LedgerEntry, {
    foreignKey: 'service_id',
    as: 'ledgerEntries',
    onDelete: 'RESTRICT',
  })
  ledgerEntries: LedgerEntry[];
  @HasMany(() => RolePermission, {
    foreignKey: 'service_id',
    as: 'rolePermissions',
    onDelete: 'CASCADE',
  })
  rolePermissions: RolePermission[];
  @HasMany(() => UserPermission, {
    foreignKey: 'service_id',
    as: 'userPermissions',
    onDelete: 'CASCADE',
  })
  userPermissions: UserPermission[];
  @BelongsTo(() => Root, {
    foreignKey: 'assigned_by_id',
    constraints: false,
    as: 'assignedByRoot',
    scope: { assigned_by_type: AssignedByType.ROOT },
  })
  assignedByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'assigned_by_id',
    constraints: false,
    as: 'assignedByAdmin',
    scope: { assigned_by_type: AssignedByType.ADMIN },
  })
  assignedByAdmin: User | null;

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: ServiceProvider): void {
    instance.updatedAt = new Date();
  }
}
