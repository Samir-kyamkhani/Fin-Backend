import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeCreate,
  BeforeUpdate,
  BeforeSave,
  AfterFind,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  Unique,
} from 'sequelize-typescript';

// import * as bcrypt from 'bcrypt';
// import * as crypto from 'crypto';
// import { Department } from '../../departments/entities/department.entity';
// import { Root } from '../../roots/entities/root.entity';
// import { User } from '../../users/entities/user.entity';
// import { EmployeePermission } from '../../permissions/entities/employee-permission.entity';
import { CreatorType, EmployeeStatus } from '../enums/employee.enum';

@Table({
  tableName: 'employees',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      fields: ['department_id'],
    },
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      unique: true,
      fields: ['username'],
    },
    {
      unique: true,
      fields: ['email'],
    },
    {
      unique: true,
      fields: ['phone_number'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['hierarchy_level'],
    },
    {
      fields: ['created_at'],
    },
  ],
})
export class Employee extends Model<Employee> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Unique
  @Index
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true,
      len: [3, 50],
    },
  })
  username: string;

  @AllowNull(false)
  @Column({
    field: 'first_name',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  firstName: string;

  @AllowNull(false)
  @Column({
    field: 'last_name',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  lastName: string;

  @Column({
    field: 'profile_image',
    type: DataType.TEXT,
    validate: {
      isUrl: true,
    },
  })
  profileImage: string;

  @AllowNull(false)
  @Unique
  @Index
  @Column({
    type: DataType.STRING,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @AllowNull(false)
  @Unique
  @Index
  @Column({
    field: 'phone_number',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  phoneNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      len: [6, 255],
    },
  })
  password: string;

  @ForeignKey(() => Department)
  @AllowNull(false)
  @Index
  @Column({
    field: 'department_id',
    type: DataType.UUID,
  })
  departmentId: string;

  @Default(EmployeeStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(EmployeeStatus)),
    validate: {
      isIn: [Object.values(EmployeeStatus)],
    },
  })
  status: EmployeeStatus;

  @Column({
    field: 'refresh_token',
    type: DataType.TEXT,
  })
  refreshToken: string;

  @Column({
    field: 'password_reset_token',
    type: DataType.STRING,
  })
  passwordResetToken: string;

  @Column({
    field: 'password_reset_expires',
    type: DataType.DATE,
  })
  passwordResetExpires: Date;

  @Column({
    field: 'last_login_at',
    type: DataType.DATE,
  })
  lastLoginAt: Date;

  @AllowNull(false)
  @Index
  @Column({
    field: 'hierarchy_level',
    type: DataType.INTEGER,
    validate: {
      min: 0,
    },
  })
  hierarchyLevel: number;

  @AllowNull(false)
  @Column({
    field: 'hierarchy_path',
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
    },
  })
  hierarchyPath: string;

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

  @Column({
    field: 'deleted_at',
    type: DataType.DATE,
  })
  declare deletedAt: Date;

  @Column({
    field: 'deactivation_reason',
    type: DataType.TEXT,
  })
  deactivationReason: string;

  @AllowNull(false)
  @Column({
    field: 'created_by_type',
    type: DataType.ENUM(...Object.values(CreatorType)),
    validate: {
      isIn: [Object.values(CreatorType)],
    },
  })
  createdByType: CreatorType;

  @AllowNull(false)
  @Index
  @Column({
    field: 'created_by_id',
    type: DataType.UUID,
  })
  createdById: string;

  @ForeignKey(() => Root)
  @Column({
    field: 'root_id',
    type: DataType.UUID,
  })
  rootId: string;

  @ForeignKey(() => User)
  @Column({
    field: 'user_id',
    type: DataType.UUID,
  })
  userId: string;

  // Associations
  @BelongsTo(() => Department)
  department: Department;

  @HasMany(() => EmployeePermission)
  employeePermissions: EmployeePermission[];

  @BelongsTo(() => Root)
  root: Root;

  @BelongsTo(() => User)
  user: User;

  // Polymorphic association for creator
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  createdByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  createdByUser: User;

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

  get creator(): Root | User {
    return this.createdByType === CreatorType.ROOT
      ? this.createdByRoot
      : this.createdByUser;
  }

  get hierarchy(): {
    level: number;
    path: string;
    ancestors?: string[];
  } {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split('.').slice(0, -1),
    };
  }

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async generatePasswordResetToken(): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await this.save();
    return resetToken;
  }

  async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }

  async getDownlineEmployees(): Promise<Employee[]> {
    return Employee.findAll({
      where: {
        hierarchyPath: {
          [this.sequelize.Op.startsWith]: `${this.hierarchyPath}.`,
        },
        status: EmployeeStatus.ACTIVE,
      },
    });
  }

  // Hooks
  @BeforeCreate
  static async setHierarchy(instance: Employee) {
    if (!instance.hierarchyLevel && !instance.hierarchyPath) {
      // Find the max hierarchy level in the same department
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

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: Employee) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Employee) {
    if (
      instance.changed('username') ||
      instance.changed('email') ||
      instance.changed('phone_number')
    ) {
      const where: any = {};

      if (instance.changed('username')) {
        where.username = instance.username;
      }
      if (instance.changed('email')) {
        where.email = instance.email;
      }
      if (instance.changed('phone_number')) {
        where.phoneNumber = instance.phoneNumber;
      }

      const existing = await Employee.findOne({ where });
      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @BeforeSave
  static async validateCreator(instance: Employee) {
    if (instance.createdByType === CreatorType.ROOT && !instance.rootId) {
      instance.rootId = instance.createdById;
    } else if (
      instance.createdByType === CreatorType.ADMIN &&
      !instance.userId
    ) {
      instance.userId = instance.createdById;
    }
  }

  @AfterFind
  static removeSensitiveData(instances: Employee | Employee[]) {
    if (Array.isArray(instances)) {
      instances.forEach((instance) => {
        delete instance.password;
        delete instance.refreshToken;
        delete instance.passwordResetToken;
      });
    } else if (instances) {
      delete instances.password;
      delete instances.refreshToken;
      delete instances.passwordResetToken;
    }
  }
}
