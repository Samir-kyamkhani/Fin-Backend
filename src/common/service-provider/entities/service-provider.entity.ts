import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { ApiIntegration } from 'src/common/api-intigration/entities/api-intigration.entity';
import { CommissionSetting } from 'src/common/commission-setting/entities/commission-setting.entity';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { RolePermission } from 'src/common/role-permission/entities/role-permission.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { AssignedByType, ServiceStatus } from '../enums/service-provider.enum';
import { UserPermission } from 'src/common/user-permission/entities/user-permission.entity';

@Table({
  tableName: 'service_providers',
  timestamps: true,
  underscored: true,
  modelName: 'ServiceProvider',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['integration_id'],
    },
    {
      fields: ['root_id'],
    },
    {
      fields: ['assigned_by_id', 'assigned_by_type'],
    },
    {
      fields: ['hierarchy_path'],
    },
    {
      fields: ['status'],
    },
  ],
})
export class ServiceProvider extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
  })
  userId: string;

  @ForeignKey(() => ApiIntegration)
  @Column({
    type: DataType.UUID,
    field: 'integration_id',
    allowNull: false,
  })
  integrationId: string;

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
    type: DataType.ENUM(...Object.values(ServiceStatus)),
    defaultValue: ServiceStatus.ACTIVE,
    validate: {
      isIn: [Object.values(ServiceStatus)],
    },
  })
  status: ServiceStatus;

  @Column({
    type: DataType.ENUM(...Object.values(AssignedByType)),
    field: 'assigned_by_type',
    allowNull: false,
    validate: {
      isIn: [Object.values(AssignedByType)],
    },
  })
  assignedByType: AssignedByType;

  @Column({
    type: DataType.UUID,
    field: 'assigned_by_id',
    allowNull: false,
  })
  assignedById: string;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'root_id',
    allowNull: false,
  })
  rootId: string;

  @Column({
    type: DataType.INTEGER,
    field: 'hierarchy_level',
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  })
  hierarchyLevel: number;

  @Column({
    type: DataType.TEXT,
    field: 'hierarchy_path',
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  hierarchyPath: string;

  @Column({
    type: DataType.BOOLEAN,
    field: 'can_reassign',
    defaultValue: true,
  })
  canReassign: boolean;

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

  // Polymorphic relations
  @BelongsTo(() => Root, {
    foreignKey: 'assigned_by_id',
    constraints: false,
    as: 'assignedByRoot',
    scope: {
      assigned_by_type: AssignedByType.ROOT,
    },
  })
  assignedByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'assigned_by_id',
    constraints: false,
    as: 'assignedByAdmin',
    scope: {
      assigned_by_type: AssignedByType.ADMIN,
    },
  })
  assignedByAdmin: User;

  // Instance methods
  isActive(): boolean {
    return this.status === ServiceStatus.ACTIVE;
  }

  canBeReassigned(): boolean {
    return this.canReassign && this.isActive();
  }
}
