import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  BeforeCreate,
} from 'sequelize-typescript';
import { Employee } from 'src/employee/entities/employee.entity';
import {
  AuditStatus,
  PerformerType,
  TargetUserType,
} from '../enums/audit-log.enum';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'audit_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    { name: 'idx_entity_entity_id', fields: ['entity', 'entity_id'] },
    {
      name: 'idx_performer_type_id',
      fields: ['performed_by_type', 'performed_by_id'],
    },
    { name: 'idx_action_performed_at', fields: ['action', 'performed_at'] },
    {
      name: 'idx_target_user_type_id',
      fields: ['target_user_type', 'target_user_id'],
    },
    { name: 'idx_performed_at', fields: ['performed_at'] },
    { name: 'idx_request_id', fields: ['request_id'] },
    { name: 'idx_status_performed_at', fields: ['status', 'performed_at'] },
  ],
})
export class AuditLog extends Model<AuditLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @AllowNull(false)
  @Index('idx_action')
  @Column({
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  action: string;
  @AllowNull(false)
  @Index('idx_entity')
  @Column({
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  entity: string;
  @Index('idx_entity_id')
  @Column({
    field: 'entity_id',
    type: DataType.STRING(100),
    validate: { len: [0, 100] },
  })
  entityId: string | null;
  @AllowNull(false)
  @Column({
    field: 'performed_by_type',
    type: DataType.ENUM(...Object.values(PerformerType)),
    validate: { isIn: [Object.values(PerformerType)] },
  })
  performedByType: PerformerType;
  @ForeignKey(() => Root)
  @Index('idx_performed_by_id')
  @Column({ field: 'performed_by_id', type: DataType.UUID })
  performedById: string;
  @Column({
    field: 'target_user_type',
    type: DataType.ENUM(...Object.values(TargetUserType)),
  })
  targetUserType: TargetUserType | null;
  @ForeignKey(() => User)
  @Index('idx_target_user_id')
  @Column({ field: 'target_user_id', type: DataType.UUID })
  targetUserId: string | null;
  @Column({ field: 'old_values', type: DataType.JSON, defaultValue: {} })
  oldValues: Record<string, unknown>;
  @Column({ field: 'new_values', type: DataType.JSON, defaultValue: {} })
  newValues: Record<string, unknown>;
  @Column({ field: 'changed_fields', type: DataType.JSON, defaultValue: [] })
  changedFields: string[];
  @Column({
    field: 'ip_address',
    type: DataType.STRING(45),
    validate: { isIP: true },
  })
  ipAddress: string | null;
  @Column({ field: 'user_agent', type: DataType.TEXT }) userAgent:
    | string
    | null;
  @Index('idx_request_id')
  @Column({
    field: 'request_id',
    type: DataType.STRING(100),
    validate: { len: [0, 100] },
  })
  requestId: string | null;
  @Column({ type: DataType.TEXT }) description: string | null;
  @Default(AuditStatus.SUCCESS)
  @Column({
    type: DataType.ENUM(...Object.values(AuditStatus)),
    validate: { isIn: [Object.values(AuditStatus)] },
  })
  status: AuditStatus;
  @Column({ field: 'error_message', type: DataType.TEXT }) errorMessage:
    | string
    | null;
  @Default(DataType.NOW)
  @Column({ field: 'performed_at', type: DataType.DATE, allowNull: false })
  performedAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  // Polymorphic associations
  @BelongsTo(() => Root, {
    foreignKey: 'performedById',
    constraints: false,
    as: 'performedByRoot',
  })
  performedByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'performedById',
    constraints: false,
    as: 'performedByUser',
  })
  performedByUser: User | null;
  @BelongsTo(() => Employee, {
    foreignKey: 'performedById',
    constraints: false,
    as: 'performedByEmployee',
  })
  performedByEmployee: Employee | null;
  @BelongsTo(() => Root, {
    foreignKey: 'targetUserId',
    constraints: false,
    as: 'targetRoot',
  })
  targetRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'targetUserId',
    constraints: false,
    as: 'targetUser',
  })
  targetUser: User | null;
  @BelongsTo(() => Employee, {
    foreignKey: 'targetUserId',
    constraints: false,
    as: 'targetEmployee',
  })
  targetEmployee: Employee | null;

  // Virtual getters
  get performerName(): string {
    const performer =
      this.performedByRoot || this.performedByUser || this.performedByEmployee;
    if (!performer) return 'Unknown';
    if ('name' in performer && typeof performer.name === 'string')
      return performer.name;
    if ('email' in performer && typeof performer.email === 'string')
      return performer.email;
    if ('username' in performer && typeof performer.username === 'string')
      return performer.username;
    return 'Unknown';
  }

  get targetUserName(): string | null {
    if (!this.targetUserType) return null;
    const target = this.targetRoot || this.targetUser || this.targetEmployee;
    if (!target) return null;
    if ('name' in target && typeof target.name === 'string') return target.name;
    if ('email' in target && typeof target.email === 'string')
      return target.email;
    if ('username' in target && typeof target.username === 'string')
      return target.username;
    return null;
  }

  get changesSummary(): string {
    if (!this.changedFields || this.changedFields.length === 0)
      return 'No field changes';
    return `Changed fields: ${this.changedFields.join(', ')}`;
  }

  // Hooks
  @BeforeCreate
  static validateAuditLog(instance: AuditLog): void {
    if (
      Object.keys(instance.oldValues).length === 0 &&
      Object.keys(instance.newValues).length === 0 &&
      instance.changedFields.length === 0
    ) {
      throw new Error(
        'Audit log must contain old values, new values, or changed fields',
      );
    }
  }
}
