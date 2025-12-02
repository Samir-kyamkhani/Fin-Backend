import {
  Table,
  Column,
  Model,
  DataType,
  //   ForeignKey,
  BelongsTo,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
} from 'sequelize-typescript';

// import { Root } from '../../roots/entities/root.entity';
// import { User } from '../../users/entities/user.entity';
// import { Employee } from '../../employees/entities/employee.entity';

import {
  PerformerType,
  TargetUserType,
  AuditStatus,
  //   AuditAction,
} from '../enums/audit-log.enum';

@Table({
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['entity', 'entity_id'],
    },
    {
      fields: ['performed_by_type', 'performed_by_id'],
    },
    {
      fields: ['action', 'created_at'],
    },
    {
      fields: ['target_user_type', 'target_user_id'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['request_id'],
    },
  ],
})
export class AuditLog extends Model<AuditLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING,
  })
  action: string;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING,
  })
  entity: string;

  @Index
  @Column({
    field: 'entity_id',
    type: DataType.STRING,
  })
  entityId: string;

  @AllowNull(false)
  @Column({
    field: 'performed_by_type',
    type: DataType.ENUM(...Object.values(PerformerType)),
  })
  performedByType: PerformerType;

  @Index
  @Column({
    field: 'performed_by_id',
    type: DataType.UUID,
  })
  performedById: string;

  @Column({
    field: 'target_user_type',
    type: DataType.ENUM(...Object.values(TargetUserType)),
  })
  targetUserType: TargetUserType;

  @Index
  @Column({
    field: 'target_user_id',
    type: DataType.UUID,
  })
  targetUserId: string;

  @Column({
    field: 'old_values',
    type: DataType.JSON,
  })
  oldValues: Record<string, any>;

  @Column({
    field: 'new_values',
    type: DataType.JSON,
  })
  newValues: Record<string, any>;

  @Column({
    field: 'changed_fields',
    type: DataType.JSON,
  })
  changedFields: string[];

  @Column({
    field: 'ip_address',
    type: DataType.STRING(45), // IPv6 support
  })
  ipAddress: string;

  @Column({
    field: 'user_agent',
    type: DataType.TEXT,
  })
  userAgent: string;

  @Index
  @Column({
    field: 'request_id',
    type: DataType.STRING,
  })
  requestId: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @Default(AuditStatus.SUCCESS)
  @Column({
    type: DataType.ENUM(...Object.values(AuditStatus)),
  })
  status: AuditStatus;

  @Column({
    field: 'error_message',
    type: DataType.TEXT,
  })
  errorMessage: string;

  @Default(Date.now)
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;

  @Default(Date.now)
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  declare updatedAt: Date;

  // Polymorphic associations for performer
  @BelongsTo(() => Root, {
    foreignKey: 'performed_by_id',
    constraints: false,
  })
  performedByRoot?: Root;

  @BelongsTo(() => User, {
    foreignKey: 'performed_by_id',
    constraints: false,
  })
  performedByUser?: User;

  @BelongsTo(() => Employee, {
    foreignKey: 'performed_by_id',
    constraints: false,
  })
  performedByEmployee?: Employee;

  // Polymorphic associations for target user
  @BelongsTo(() => Root, {
    foreignKey: 'target_user_id',
    constraints: false,
  })
  targetRoot?: Root;

  @BelongsTo(() => User, {
    foreignKey: 'target_user_id',
    constraints: false,
  })
  targetUser?: User;

  @BelongsTo(() => Employee, {
    foreignKey: 'target_user_id',
    constraints: false,
  })
  targetEmployee?: Employee;

  // Virtual fields
  get performerName(): string {
    if (this.performedByType === PerformerType.SYSTEM) {
      return 'System';
    }

    const performer =
      this.performedByRoot || this.performedByUser || this.performedByEmployee;
    return performer
      ? performer['name'] || performer['email'] || performer['username']
      : 'Unknown';
  }

  get targetUserName(): string {
    if (!this.targetUserType) return null;

    const target = this.targetRoot || this.targetUser || this.targetEmployee;
    return target
      ? target['name'] || target['email'] || target['username']
      : 'Unknown';
  }

  get changesSummary(): string {
    if (!this.changedFields || this.changedFields.length === 0) {
      return 'No field changes';
    }

    return `Changed fields: ${this.changedFields.join(', ')}`;
  }
}
