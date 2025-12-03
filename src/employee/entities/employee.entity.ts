// src/modules/employees/entities/employee.entity.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  BeforeCreate,
  BeforeUpdate,
  Unique,
  BeforeSave,
} from 'sequelize-typescript';
import { Department } from 'src/common/department/entities/department.entity';
import { CreatedByType, EmployeeStatus } from '../enums/employee.enum';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { EmployeePermission } from 'src/common/employee-permission/entities/employee-permission.entity';
@Table({
  tableName: 'employees',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: 'idx_department_id', fields: ['department_id'] },
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
    { name: 'idx_username_unique', unique: true, fields: ['username'] },
    { name: 'idx_email_unique', unique: true, fields: ['email'] },
    { name: 'idx_phone_number_unique', unique: true, fields: ['phone_number'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_hierarchy_level', fields: ['hierarchy_level'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    { name: 'idx_root_id', fields: ['root_id'] },
    { name: 'idx_user_id', fields: ['user_id'] },
  ],
})
export class Employee extends Model<Employee> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;

  @AllowNull(false)
  @Unique('idx_username_unique')
  @Index('idx_username')
  @Column({
    type: DataType.STRING(50),
    validate: { notEmpty: true, len: [3, 50] },
  })
  username: string;

  @AllowNull(false)
  @Column({
    field: 'first_name',
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;

  @AllowNull(false)
  @Column({
    field: 'last_name',
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;

  @Column({
    field: 'profile_image',
    type: DataType.TEXT,
    validate: { len: [0, 1000] },
  })
  profileImage: string | null;

  @AllowNull(false)
  @Unique('idx_email_unique')
  @Index('idx_email')
  @Column({ type: DataType.STRING(255), validate: { isEmail: true } })
  email: string;

  @AllowNull(false)
  @Unique('idx_phone_number_unique')
  @Index('idx_phone_number')
  @Column({
    field: 'phone_number',
    type: DataType.STRING(15),
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
    validate: { len: [6, 255] },
    set(value: string) {
      // Password will be hashed in the service layer using CryptoService
      this.setDataValue('password', value);
    },
  })
  password: string;

  @Column({
    field: 'password_salt',
    type: DataType.STRING(64),
    allowNull: true,
  })
  passwordSalt: string | null;

  @ForeignKey(() => Department)
  @AllowNull(false)
  @Index('idx_department_id')
  @Column({ field: 'department_id', type: DataType.UUID })
  departmentId: string;

  @Default(EmployeeStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(EmployeeStatus)),
    validate: { isIn: [Object.values(EmployeeStatus)] },
  })
  status: EmployeeStatus;

  @Column({ field: 'refresh_token', type: DataType.TEXT })
  refreshToken: string | null;

  @Column({ field: 'password_reset_token', type: DataType.STRING(64) })
  passwordResetToken: string | null;

  @Column({ field: 'password_reset_expires', type: DataType.DATE })
  passwordResetExpires: Date | null;

  @Column({ field: 'last_login_at', type: DataType.DATE })
  lastLoginAt: Date | null;

  @AllowNull(false)
  @Index('idx_hierarchy_level')
  @Column({
    field: 'hierarchy_level',
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  hierarchyLevel: number;

  @AllowNull(false)
  @Column({
    field: 'hierarchy_path',
    type: DataType.TEXT,
    validate: { notEmpty: true },
  })
  hierarchyPath: string;

  @Default(DataType.NOW)
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  @Column({ field: 'deleted_at', type: DataType.DATE })
  declare deletedAt: Date | null;

  @Column({ field: 'deactivation_reason', type: DataType.TEXT })
  deactivationReason: string | null;

  @AllowNull(false)
  @Column({
    field: 'created_by_type',
    type: DataType.ENUM(...Object.values(CreatedByType)),
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;

  @AllowNull(false)
  @Index('idx_created_by_id')
  @Column({ field: 'created_by_id', type: DataType.UUID })
  createdById: string;

  @ForeignKey(() => Root)
  @Column({ field: 'root_id', type: DataType.UUID })
  rootId: string | null;

  @ForeignKey(() => User)
  @Column({ field: 'user_id', type: DataType.UUID })
  userId: string | null;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === EmployeeStatus.ACTIVE;
  }

  get isSuspended(): boolean {
    return this.status === EmployeeStatus.SUSPENDED;
  }

  get isDeleted(): boolean {
    return this.status === EmployeeStatus.DELETED;
  }

  get hierarchy(): { level: number; path: string; ancestors?: string[] } {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split('.').slice(0, -1),
    };
  }

  get maskedPhone(): string {
    // This would be better handled in a DTO or service
    const phone = this.phoneNumber || '';
    return phone.length >= 4 ? `******${phone.slice(-4)}` : '****';
  }

  // Associations
  @BelongsTo(() => Department, {
    foreignKey: 'department_id',
    as: 'department',
  })
  department: Department;

  @HasMany(() => EmployeePermission, {
    foreignKey: 'employee_id',
    as: 'employeePermissions',
  })
  employeePermissions: EmployeePermission[];

  @BelongsTo(() => Root, { foreignKey: 'root_id', as: 'root' })
  root: Root | null;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  user: User | null;

  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
  })
  createdByRoot: Root | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByUser',
  })
  createdByUser: User | null;

  // Hooks
  @BeforeCreate
  static async setHierarchy(instance: Employee): Promise<void> {
    if (!instance.hierarchyLevel && !instance.hierarchyPath) {
      const maxLevelEmployee = await Employee.findOne({
        where: { departmentId: instance.departmentId },
        order: [['hierarchy_level', 'DESC']],
        attributes: ['hierarchy_level', 'hierarchy_path'],
      });
      if (maxLevelEmployee) {
        instance.hierarchyLevel = maxLevelEmployee.hierarchyLevel + 1;
        instance.hierarchyPath = `${maxLevelEmployee.hierarchyPath}.${instance.id}`;
      } else {
        instance.hierarchyLevel = 0;
        instance.hierarchyPath = instance.id;
      }
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Employee): Promise<void> {
    if (
      instance.changed('username') ||
      instance.changed('email') ||
      instance.changed('phoneNumber')
    ) {
      const where: Record<string, unknown> = {};

      if (instance.changed('username')) where.username = instance.username;
      if (instance.changed('email')) where.email = instance.email;
      if (instance.changed('phoneNumber'))
        where.phoneNumber = instance.phoneNumber;

      const existing = await Employee.findOne({ where });

      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @BeforeSave
  static validateCreator(instance: Employee): void {
    if (instance.createdByType === CreatedByType.ROOT && !instance.rootId) {
      instance.rootId = instance.createdById;
    } else if (
      instance.createdByType === CreatedByType.ADMIN &&
      !instance.userId
    ) {
      instance.userId = instance.createdById;
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: Employee): void {
    instance.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as unknown as Record<string, unknown>;
    delete values.password;
    delete values.passwordSalt;
    delete values.refreshToken;
    delete values.passwordResetToken;
    return values;
  }
}
