import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  PrimaryKey,
} from 'sequelize-typescript';

import { Role } from 'src/common/role/entities/role.entity';
import {
  CommissionScope,
  CommissionType,
  CreatedByType,
} from '../enums/commission-setting.enum';
import { User } from 'src/user/entities/user.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { Root } from 'src/root/entities/root.entity';

@Table({
  tableName: 'commission_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'commission_settings_scope_role_user_idx',
      fields: ['scope', 'role_id', 'target_user_id'],
    },
    {
      name: 'commission_settings_active_effective_idx',
      fields: ['is_active', 'effective_from', 'effective_to'],
    },
    {
      name: 'commission_settings_created_by_idx',
      fields: ['created_by_id', 'created_by_type'],
    },
    { name: 'commission_settings_service_idx', fields: ['service_id'] },
    {
      name: 'commission_settings_effective_date_idx',
      fields: ['effective_from', 'effective_to'],
    },
  ],
})
export class CommissionSetting extends Model<CommissionSetting> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @Column({
    type: DataType.ENUM(...Object.values(CommissionScope)),
    defaultValue: CommissionScope.ROLE,
    validate: { isIn: [Object.values(CommissionScope)] },
  })
  scope: CommissionScope;
  @ForeignKey(() => Role)
  @AllowNull
  @Column({ type: DataType.UUID, field: 'role_id' })
  roleId: string | null;
  @ForeignKey(() => User)
  @AllowNull
  @Column({ type: DataType.UUID, field: 'target_user_id' })
  targetUserId: string | null;
  @ForeignKey(() => ServiceProvider)
  @AllowNull
  @Column({ type: DataType.UUID, field: 'service_id' })
  serviceId: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(CommissionType)),
    field: 'commission_type',
    allowNull: false,
    validate: { isIn: [Object.values(CommissionType)] },
  })
  commissionType: CommissionType;
  @Column({
    type: DataType.DECIMAL(12, 4),
    field: 'commission_value',
    allowNull: false,
  })
  commissionValue: number;
  @AllowNull
  @Column({ type: DataType.BIGINT, field: 'min_amount', validate: { min: 0 } })
  minAmount: number | null;
  @AllowNull
  @Column({ type: DataType.BIGINT, field: 'max_amount', validate: { min: 0 } })
  maxAmount: number | null;
  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'root_commission_percent',
    validate: { min: 0, max: 100 },
  })
  rootCommissionPercent: number | null;
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'apply_tds' })
  applyTDS: boolean;
  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'tds_percent',
    validate: { min: 0, max: 100 },
  })
  tdsPercent: number | null;
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'apply_gst' })
  applyGST: boolean;
  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'gst_percent',
    validate: { min: 0, max: 100 },
  })
  gstPercent: number | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive: boolean;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'effective_from', allowNull: false })
  effectiveFrom: Date;
  @AllowNull
  @Column({ type: DataType.DATE, field: 'effective_to' })
  effectiveTo: Date | null;
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
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Role, { foreignKey: 'roleId', as: 'role' })
  role: Role | null;
  @BelongsTo(() => User, { foreignKey: 'targetUserId', as: 'targetUser' })
  targetUser: User | null;
  @BelongsTo(() => ServiceProvider, { foreignKey: 'serviceId', as: 'service' })
  service: ServiceProvider | null;
  @BelongsTo(() => Root, {
    foreignKey: 'createdById',
    constraints: false,
    as: 'createdByRoot',
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'createdById',
    constraints: false,
    as: 'createdByUser',
  })
  createdByUser: User | null;
}
