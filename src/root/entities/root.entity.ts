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
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  Unique,
  AfterFind,
} from 'sequelize-typescript';

// import bcrypt from 'bcrypt';
// import crypto from 'crypto';
// import { Role } from '../../roles/entities/role.entity';
// import { IpWhitelist } from '../../ip-whitelists/entities/ip-whitelist.entity';
// import { User } from '../../users/entities/user.entity';
// import { RootWallet } from './root-wallet.entity';
// import { RootBankDetail } from './root-bank-detail.entity';
// import { RootCommissionEarning } from './root-commission-earning.entity';
// import { Employee } from '../../employees/entities/employee.entity';
// import { Department } from '../../departments/entities/department.entity';
// import { SystemSetting } from '../../system-settings/entities/system-setting.entity';
// import { ServiceProvider } from '../../service-providers/entities/service-provider.entity';
// import { UserKyc } from '../../kyc/entities/user-kyc.entity';
// import { BusinessKyc } from '../../kyc/entities/business-kyc.entity';
import { RootStatus } from '../enums/root.enum';

export interface IRootHierarchy {
  level: number;
  path: string;
  ancestors?: string[];
}

@Table({
  tableName: 'roots',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
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
      unique: true,
      fields: ['hierarchy_level'],
    },
    {
      unique: true,
      fields: ['hierarchy_path'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['created_at'],
    },
  ],
})
export class Root extends Model<Root> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Role)
  @Column({
    field: 'role_id',
    type: DataType.UUID,
  })
  roleId: string;

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

  @Default(RootStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(RootStatus)),
    validate: {
      isIn: [Object.values(RootStatus)],
    },
  })
  status: RootStatus;

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

  @Default(0)
  @Unique
  @Index
  @Column({
    field: 'hierarchy_level',
    type: DataType.INTEGER,
    validate: {
      min: 0,
    },
  })
  hierarchyLevel: number;

  @Default('0')
  @Unique
  @Index
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

  // Associations
  @BelongsTo(() => Role)
  role: Role;

  @HasMany(() => IpWhitelist, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  createdIpWhitelists: IpWhitelist[];

  @HasMany(() => IpWhitelist, {
    foreignKey: 'user_id',
    constraints: false,
    scope: {
      user_type: 'ROOT',
    },
  })
  ipWhitelists: IpWhitelist[];

  @HasMany(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  createdUsers: User[];

  @HasMany(() => RootWallet, {
    foreignKey: 'root_id',
  })
  wallets: RootWallet[];

  @HasMany(() => RootBankDetail, {
    foreignKey: 'root_id',
  })
  bankAccounts: RootBankDetail[];

  @HasMany(() => RootCommissionEarning, {
    foreignKey: 'root_id',
  })
  commissionEarnings: RootCommissionEarning[];

  @HasMany(() => Employee, {
    foreignKey: 'root_id',
  })
  employees: Employee[];

  @HasMany(() => Department, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  departments: Department[];

  @HasMany(() => SystemSetting, {
    foreignKey: 'root_id',
  })
  systemSettings: SystemSetting[];

  @HasMany(() => ServiceProvider, {
    foreignKey: 'created_by_root_id',
  })
  serviceProviders: ServiceProvider[];

  @HasMany(() => UserKyc, {
    foreignKey: 'verified_by_id',
    constraints: false,
  })
  verifiedUserKycs: UserKyc[];

  @HasMany(() => BusinessKyc, {
    foreignKey: 'verified_by_id',
    constraints: false,
  })
  verifiedBusinessKycs: BusinessKyc[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === RootStatus.ACTIVE;
  }

  get isSuspended(): boolean {
    return this.status === RootStatus.SUSPENDED;
  }

  get isDeleted(): boolean {
    return this.status === RootStatus.DELETED;
  }

  get hierarchy(): IRootHierarchy {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split('/').slice(0, -1),
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

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: Root) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeCreate
  static async setDefaultHierarchy(instance: Root) {
    if (!instance.hierarchyLevel) {
      // Find the max hierarchy level and assign next level
      const maxLevelRoot = await Root.findOne({
        order: [['hierarchy_level', 'DESC']],
        attributes: ['hierarchy_level', 'hierarchy_path'],
      });

      if (maxLevelRoot) {
        instance.hierarchyLevel = maxLevelRoot.hierarchyLevel + 1;
        instance.hierarchyPath = `${maxLevelRoot.hierarchyPath}.${instance.hierarchyLevel}`;
      } else {
        instance.hierarchyLevel = 0;
        instance.hierarchyPath = '0';
      }
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Root) {
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

      const existing = await Root.findOne({ where });
      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @AfterFind
  static removeSensitiveData(instances: Root | Root[]) {
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
