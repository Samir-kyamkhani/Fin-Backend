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
} from 'sequelize-typescript';

import {
  PerformerType,
  TargetUserType,
  AuditStatus,
} from '../enums/audit-log.enum';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { Employee } from 'src/employee/entities/employee.entity';

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
      fields: ['action', 'performed_at'],
    },
    {
      fields: ['target_user_type', 'target_user_id'],
    },
    {
      fields: ['performed_at'],
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

  @ForeignKey(() => Root)
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

  @ForeignKey(() => User)
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
    field: 'performed_at',
    type: DataType.DATE,
  })
  declare performedAt: Date;

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

  get performerName() {
    const performer =
      this.performedByRoot || this.performedByUser || this.performedByEmployee;

    if (!performer) return 'Unknown';

    if ('name' in performer && typeof performer.name === 'string') {
      return performer.name;
    }
    if ('email' in performer && typeof performer.email === 'string') {
      return performer.email;
    }
    if ('username' in performer && typeof performer.username === 'string') {
      return performer.username;
    }
  }

  get targetUserName() {
    if (!this.targetUserType) return null;

    const target = this.targetRoot || this.targetUser || this.targetEmployee;

    if (!target) return 'Unknown';

    if ('name' in target && typeof target.name === 'string') {
      return target.name;
    }
    if ('email' in target && typeof target.email === 'string') {
      return target.email;
    }
    if ('username' in target && typeof target.username === 'string') {
      return target.username;
    }
  }

  get changesSummary(): string {
    if (!this.changedFields || this.changedFields.length === 0) {
      return 'No field changes';
    }

    return `Changed fields: ${this.changedFields.join(', ')}`;
  }
}
