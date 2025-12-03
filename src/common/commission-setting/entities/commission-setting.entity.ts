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
import {
  CommissionScope,
  CommissionType,
  CreatedByType,
} from '../enums/commission-setting.enum';
import { Role } from 'src/common/role/entities/role.entity';
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
    {
      name: 'commission_settings_service_idx',
      fields: ['service_id'],
    },
    {
      name: 'commission_settings_effective_date_idx',
      fields: ['effective_from', 'effective_to'],
    },
  ],
})
export class CommissionSetting extends Model<CommissionSetting> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(CommissionScope)),
    defaultValue: CommissionScope.ROLE,
  })
  scope: CommissionScope;

  @ForeignKey(() => Role)
  @AllowNull
  @Column({
    type: DataType.UUID,
    field: 'role_id',
  })
  roleId: string;

  @BelongsTo(() => Role, {
    foreignKey: 'role_id',
    as: 'role',
  })
  role: Role;

  @ForeignKey(() => User)
  @AllowNull
  @Column({
    type: DataType.UUID,
    field: 'target_user_id',
  })
  targetUserId: string;

  @BelongsTo(() => User, {
    foreignKey: 'target_user_id',
    as: 'targetUser',
  })
  targetUser: User;

  @ForeignKey(() => ServiceProvider)
  @AllowNull
  @Column({
    type: DataType.UUID,
    field: 'service_id',
  })
  serviceId: string;

  @BelongsTo(() => ServiceProvider, {
    foreignKey: 'service_id',
    as: 'service',
  })
  service: ServiceProvider;

  @Column({
    type: DataType.ENUM(...Object.values(CommissionType)),
    field: 'commission_type',
    allowNull: false,
  })
  commissionType: CommissionType;

  @Column({
    type: DataType.DECIMAL(12, 4),
    field: 'commission_value',
    allowNull: false,
  })
  commissionValue: number;

  @AllowNull
  @Column({
    type: DataType.BIGINT,
    field: 'min_amount',
  })
  minAmount: number;

  @AllowNull
  @Column({
    type: DataType.BIGINT,
    field: 'max_amount',
  })
  maxAmount: number;

  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'root_commission_percent',
  })
  rootCommissionPercent: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'apply_tds',
  })
  applyTDS: boolean;

  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'tds_percent',
  })
  tdsPercent: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'apply_gst',
  })
  applyGST: boolean;

  @AllowNull
  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'gst_percent',
  })
  gstPercent: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  isActive: boolean;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'effective_from',
  })
  effectiveFrom: Date;

  @AllowNull
  @Column({
    type: DataType.DATE,
    field: 'effective_to',
  })
  effectiveTo: Date;

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

  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
  })
  createdByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByUser',
  })
  createdByUser: User;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
