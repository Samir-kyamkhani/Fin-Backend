// src/modules/roots/entities/root.entity.ts
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
import { Role } from 'src/common/role/entities/role.entity';
import { RootStatus } from '../enums/root.enum';
import { IRootHierarchy } from '../interface/root.interface';
import { RootWallet } from 'src/common/root-wallet/entities/root-wallet.entity';
import { RootBankDetail } from 'src/common/root-bank-detail/entities/root-bank-detail.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { SystemSetting } from 'src/common/system-setting/entities/system-setting.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { IpWhitelist } from 'src/common/ip-whitelist/entities/ip-whitelist.entity';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'roots',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: 'idx_username_unique', unique: true, fields: ['username'] },
    { name: 'idx_email_unique', unique: true, fields: ['email'] },
    { name: 'idx_phone_number_unique', unique: true, fields: ['phone_number'] },
    {
      name: 'idx_hierarchy_level',
      fields: ['hierarchy_level'],
    },
    {
      name: 'idx_hierarchy_path',
      fields: ['hierarchy_path'],
    },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    { name: 'idx_role_id', fields: ['role_id'] },
  ],
})
export class Root extends Model<Root> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;

  @ForeignKey(() => Role)
  @Column({ field: 'role_id', type: DataType.UUID })
  roleId: string | null;

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
      // Password will be hashed in service layer
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

  @Default(RootStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(RootStatus)),
    validate: { isIn: [Object.values(RootStatus)] },
  })
  status: RootStatus;

  @Column({ field: 'refresh_token', type: DataType.TEXT })
  refreshToken: string | null;

  @Column({ field: 'password_reset_token', type: DataType.STRING(64) })
  passwordResetToken: string | null;

  @Column({ field: 'password_reset_expires', type: DataType.DATE })
  passwordResetExpires: Date | null;

  @Column({ field: 'last_login_at', type: DataType.DATE })
  lastLoginAt: Date | null;

  @Default(0)
  @Column({
    field: 'hierarchy_level',
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  hierarchyLevel: number;

  @Default('0')
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

  get maskedPhone(): string {
    return this.phoneNumber ? `******${this.phoneNumber.slice(-4)}` : '****';
  }

  get maskedEmail(): string {
    if (!this.email) return '***@***';
    const [localPart, domain] = this.email.split('@');
    return localPart.length > 2
      ? `${localPart.substring(0, 2)}***@${domain}`
      : `***@${domain}`;
  }

  // Associations
  @BelongsTo(() => Role, { foreignKey: 'roleId', as: 'role' })
  role: Role | null;

  @HasMany(() => RootWallet, { foreignKey: 'root_id', as: 'wallets' })
  wallets: RootWallet[];

  @HasMany(() => RootBankDetail, { foreignKey: 'root_id', as: 'bankAccounts' })
  bankAccounts: RootBankDetail[];

  @HasMany(() => RootCommissionEarning, {
    foreignKey: 'root_id',
    as: 'commissionEarnings',
  })
  commissionEarnings: RootCommissionEarning[];

  @HasMany(() => Employee, { foreignKey: 'root_id', as: 'employees' })
  employees: Employee[];

  @HasMany(() => SystemSetting, { foreignKey: 'root_id', as: 'systemSettings' })
  systemSettings: SystemSetting[];

  @HasMany(() => ServiceProvider, {
    foreignKey: 'created_by_root_id',
    as: 'serviceProviders',
  })
  serviceProviders: ServiceProvider[];

  @HasMany(() => IpWhitelist, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdIpWhitelists',
  })
  createdIpWhitelists: IpWhitelist[];

  @HasMany(() => IpWhitelist, {
    foreignKey: 'user_id',
    constraints: false,
    as: 'ipWhitelists',
    scope: { user_type: 'ROOT' },
  })
  ipWhitelists: IpWhitelist[];

  @HasMany(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdUsers',
  })
  createdUsers: User[];

  // Hooks
  @BeforeCreate
  static async setDefaultHierarchy(instance: Root): Promise<void> {
    if (!instance.hierarchyLevel && !instance.hierarchyPath) {
      const maxLevelRoot = await Root.findOne({
        order: [['hierarchy_level', 'DESC']],
        attributes: ['hierarchy_level', 'hierarchy_path'],
      });

      if (maxLevelRoot) {
        instance.hierarchyLevel = maxLevelRoot.hierarchyLevel + 1;
        instance.hierarchyPath = `${maxLevelRoot.hierarchyPath}/${instance.hierarchyLevel}`;
      } else {
        instance.hierarchyLevel = 0;
        instance.hierarchyPath = '0';
      }
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Root): Promise<void> {
    if (
      instance.changed('username') ||
      instance.changed('email') ||
      instance.changed('phoneNumber')
    ) {
      const where: Record<string, unknown> = {};
      if (instance.changed('username')) where.username = instance.username;
      if (instance.changed('email')) where.email = instance.email;
      if (instance.changed('phoneNumber')) {
        where.phoneNumber = instance.phoneNumber;
      }

      const existing = await Root.findOne({ where });
      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: Root): void {
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
