import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
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
// import { Root } from '../../roots/entities/root.entity';
// import { Role } from '../../roles/entities/role.entity';
// import { Wallet } from '../../wallets/entities/wallet.entity';
// import { BankDetail } from '../../bank-details/entities/bank-detail.entity';
// import { UserKyc } from '../../kyc/entities/user-kyc.entity';
// import { BusinessKyc } from '../../kyc/entities/business-kyc.entity';
// import { Transaction } from '../../transactions/entities/transaction.entity';
// import { CommissionEarning } from '../../commission-earnings/entities/commission-earning.entity';
// import { RootCommissionEarning } from '../../roots/entities/root-commission-earning.entity';
// import { UserPermission } from '../../permissions/entities/user-permission.entity';
// import { PiiConsent } from '../../pii-consents/entities/pii-consent.entity';
// import { ApiEntity } from '../../api-entities/entities/api-entity.entity';
// import { IpWhitelist } from '../../ip-whitelists/entities/ip-whitelist.entity';
// import { ServiceProvider } from '../../service-providers/entities/service-provider.entity';
// import { Employee } from '../../employees/entities/employee.entity';
// import { CommissionSetting } from '../../commission-settings/entities/commission-setting.entity';
// import { Department } from '../../departments/entities/department.entity';
import { UserStatus, CreatorType } from '../enums/user.enum';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      fields: ['parent_id'],
    },
    {
      unique: true,
      fields: ['customer_id'],
    },
    {
      fields: ['hierarchy_level'],
    },
    {
      fields: ['hierarchy_path'],
    },
    {
      unique: true,
      fields: ['phone_number'],
    },
    {
      fields: ['role_id'],
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
      fields: ['status'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['created_by_id'],
    },
    {
      fields: ['created_by_type'],
    },
  ],
})
export class User extends Model<User> {
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
    field: 'customer_id',
    type: DataType.STRING(8),
    validate: {
      len: [8, 8],
    },
  })
  customerId: string;

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

  @Column({
    field: 'transaction_pin',
    type: DataType.STRING,
    validate: {
      len: [4, 6],
    },
  })
  transactionPin: string;

  @ForeignKey(() => User)
  @Column({
    field: 'parent_id',
    type: DataType.UUID,
  })
  parentId: string;

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

  @Default(UserStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    validate: {
      isIn: [Object.values(UserStatus)],
    },
  })
  status: UserStatus;

  @Default(false)
  @Column({
    field: 'is_kyc_verified',
    type: DataType.BOOLEAN,
  })
  isKycVerified: boolean;

  @ForeignKey(() => Role)
  @AllowNull(false)
  @Index
  @Column({
    field: 'role_id',
    type: DataType.UUID,
  })
  roleId: string;

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
    field: 'email_verification_token',
    type: DataType.STRING,
  })
  emailVerificationToken: string;

  @Column({
    field: 'email_verified_at',
    type: DataType.DATE,
  })
  emailVerifiedAt: Date;

  @Column({
    field: 'email_verification_token_expires',
    type: DataType.DATE,
  })
  emailVerificationTokenExpires: Date;

  @Column({
    field: 'last_login_at',
    type: DataType.DATE,
  })
  lastLoginAt: Date;

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

  @Column({
    field: 'created_by_id',
    type: DataType.UUID,
  })
  createdById: string;

  @Default(CreatorType.USER)
  @Column({
    field: 'created_by_type',
    type: DataType.ENUM(...Object.values(CreatorType)),
  })
  createdByType: CreatorType;

  // Associations

  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
  })
  creatorRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    scope: {
      created_by_type: CreatorType.USER,
    },
  })
  creatorUser: User;

  // Hierarchical self-reference
  @BelongsTo(() => User, {
    foreignKey: 'parent_id',
  })
  parent: User;

  @HasMany(() => User, {
    foreignKey: 'parent_id',
  })
  children: User[];

  // Business relations
  @BelongsTo(() => Role)
  role: Role;

  @HasMany(() => Wallet)
  wallets: Wallet[];

  @HasMany(() => BankDetail)
  bankAccounts: BankDetail[];

  // KYC Relations
  @HasOne(() => UserKyc)
  userKyc: UserKyc;

  @HasOne(() => BusinessKyc)
  businessKyc: BusinessKyc;

  @HasMany(() => UserKyc, {
    foreignKey: 'verified_by_id',
    constraints: false,
    scope: {
      verified_by_type: 'USER',
    },
  })
  verifiedUserKycs: UserKyc[];

  // Transaction relations
  @HasMany(() => Transaction)
  transactions: Transaction[];

  @HasMany(() => CommissionEarning, {
    foreignKey: 'user_id',
  })
  commissionEarnings: CommissionEarning[];

  @HasMany(() => CommissionEarning, {
    foreignKey: 'from_user_id',
  })
  commissionsGiven: CommissionEarning[];

  @HasMany(() => RootCommissionEarning, {
    foreignKey: 'from_user_id',
  })
  rootCommissionsGiven: RootCommissionEarning[];

  // Permission relations
  @HasMany(() => UserPermission)
  userPermissions: UserPermission[];

  @HasMany(() => PiiConsent)
  piiConsents: PiiConsent[];

  @HasMany(() => ApiEntity)
  apiEntities: ApiEntity[];

  @HasMany(() => IpWhitelist, {
    foreignKey: 'user_id',
    constraints: false,
    scope: {
      user_type: 'USER',
    },
  })
  ipWhitelists: IpWhitelist[];

  // Service Provider relations
  @HasMany(() => ServiceProvider)
  serviceProviders: ServiceProvider[];

  // Management relations
  @HasMany(() => Employee, {
    foreignKey: 'created_by_id',
    constraints: false,
    scope: {
      created_by_type: CreatorType.USER,
    },
  })
  employeesCreated: Employee[];

  @HasMany(() => CommissionSetting, {
    foreignKey: 'created_by_id',
    constraints: false,
    scope: {
      created_by_type: CreatorType.USER,
    },
  })
  commissionSettingsCreated: CommissionSetting[];

  @HasMany(() => Role, {
    foreignKey: 'created_by_id',
    constraints: false,
    scope: {
      created_by_type: CreatorType.USER,
    },
  })
  rolesCreated: Role[];

  @HasMany(() => CommissionSetting, {
    foreignKey: 'target_user_id',
  })
  commissionSettings: CommissionSetting[];

  @HasMany(() => Department, {
    foreignKey: 'created_by_id',
    constraints: false,
    scope: {
      created_by_type: CreatorType.USER,
    },
  })
  departments: Department[];

  @HasMany(() => Employee, {
    foreignKey: 'user_id',
  })
  employees: Employee[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isSuspended(): boolean {
    return this.status === UserStatus.SUSPENDED;
  }

  get isDeleted(): boolean {
    return this.status === UserStatus.DELETED;
  }

  get isEmailVerified(): boolean {
    return !!this.emailVerifiedAt;
  }

  get creator(): Root | User {
    return this.createdByType === CreatorType.ROOT
      ? this.creatorRoot
      : this.creatorUser;
  }

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async validateTransactionPin(pin: string): Promise<boolean> {
    if (!this.transactionPin) return false;
    return bcrypt.compare(pin, this.transactionPin);
  }

  async setTransactionPin(pin: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.transactionPin = await bcrypt.hash(pin, salt);
    await this.save();
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

  async generateEmailVerificationToken(): Promise<string> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    this.emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours
    await this.save();
    return verificationToken;
  }

  async verifyEmail(): Promise<void> {
    this.emailVerifiedAt = new Date();
    this.emailVerificationToken = null;
    this.emailVerificationTokenExpires = null;
    await this.save();
  }

  async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }

  async getHierarchyInfo() {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split('.').slice(0, -1),
      isTopLevel: this.hierarchyLevel === 0,
    };
  }

  async getDownlineUsers(): Promise<User[]> {
    return User.findAll({
      where: {
        hierarchyPath: {
          [this.sequelize.Op.startsWith]: `${this.hierarchyPath}.`,
        },
      },
    });
  }

  // Hooks
  @BeforeCreate
  static async generateCustomerId(instance: User) {
    if (!instance.customerId) {
      // Generate unique 8-digit customer ID
      let customerId: string;
      let isUnique = false;

      while (!isUnique) {
        customerId = String(Math.floor(10000000 + Math.random() * 90000000));
        const existing = await User.findOne({ where: { customerId } });
        isUnique = !existing;
      }

      instance.customerId = customerId;
    }
  }

  @BeforeCreate
  static async setHierarchy(instance: User) {
    if (instance.parentId) {
      const parent = await User.findByPk(instance.parentId);
      if (parent) {
        instance.hierarchyLevel = parent.hierarchyLevel + 1;
        instance.hierarchyPath = `${parent.hierarchyPath}.${instance.id}`;
      }
    } else {
      // Top-level user
      instance.hierarchyLevel = 0;
      instance.hierarchyPath = instance.id;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async hashTransactionPin(instance: User) {
    if (instance.changed('transactionPin') && instance.transactionPin) {
      const salt = await bcrypt.genSalt(10);
      instance.transactionPin = await bcrypt.hash(
        instance.transactionPin,
        salt,
      );
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: User) {
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

      const existing = await User.findOne({ where });
      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @AfterFind
  static removeSensitiveData(instances: User | User[]) {
    if (Array.isArray(instances)) {
      instances.forEach((instance) => {
        delete instance.password;
        delete instance.transactionPin;
        delete instance.refreshToken;
        delete instance.passwordResetToken;
        delete instance.emailVerificationToken;
      });
    } else if (instances) {
      delete instances.password;
      delete instances.transactionPin;
      delete instances.refreshToken;
      delete instances.passwordResetToken;
      delete instances.emailVerificationToken;
    }
  }
}
