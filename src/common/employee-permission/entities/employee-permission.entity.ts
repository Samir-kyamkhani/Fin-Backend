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
import { Employee } from 'src/employee/entities/employee.entity';
import { CreatedByType } from '../enums/employee-permission.enum';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

// ========== EMPLOYEE PERMISSION ==========
@Table({
  tableName: 'employee_permissions',
  timestamps: true,
  underscored: true,
  modelName: 'EmployeePermission',
  indexes: [
    {
      name: 'idx_employee_permission_unique',
      unique: true,
      fields: ['employee_id', 'permission'],
      where: { is_active: true, revoked_at: null },
    },
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
    { name: 'idx_employee_id', fields: ['employee_id'] },
    { name: 'idx_is_active', fields: ['is_active'] },
  ],
})
export class EmployeePermission extends Model<EmployeePermission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => Employee)
  @Column({ type: DataType.UUID, field: 'employee_id', allowNull: false })
  employeeId: string;
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
  @BelongsTo(() => Employee, { foreignKey: 'employee_id', as: 'employee' })
  employee: Employee;
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
    as: 'createdByUser',
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Virtual properties
  get isActivePermission(): boolean {
    return this.isActive && !this.revokedAt;
  }

  // Hooks
  @BeforeCreate
  static validateUniquePermission(instance: EmployeePermission): void {
    if (!instance.permission) throw new Error('Permission is required');
  }

  @BeforeUpdate
  static updateRevokedAt(instance: EmployeePermission): void {
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
