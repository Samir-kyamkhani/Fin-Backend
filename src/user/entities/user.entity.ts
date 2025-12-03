import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  BeforeCreate,
  BeforeUpdate,
  Unique,
  BeforeSave,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { CreatorType, UserStatus } from '../enums/user.enum';
import { Role } from 'src/common/role/entities/role.entity';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: 'idx_parent_id', fields: ['parent_id'] },
    { name: 'idx_customer_id_unique', unique: true, fields: ['customer_id'] },
    { name: 'idx_hierarchy_level', fields: ['hierarchy_level'] },
    { name: 'idx_hierarchy_path', fields: ['hierarchy_path'] },
    { name: 'idx_phone_number_unique', unique: true, fields: ['phone_number'] },
    { name: 'idx_role_id', fields: ['role_id'] },
    { name: 'idx_username_unique', unique: true, fields: ['username'] },
    { name: 'idx_email_unique', unique: true, fields: ['email'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
  ],
})
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;

  @AllowNull(false)
  @Unique('idx_customer_id_unique')
  @Index('idx_customer_id')
  @Column({
    field: 'customer_id',
    type: DataType.STRING(8),
    validate: { len: [8, 8] },
  })
  customerId: string;

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

  @Column({
    field: 'transaction_pin',
    type: DataType.STRING(128),
    allowNull: true,
    validate: { len: [0, 128] },
    set(value: string | null) {
      // Transaction pin will be hashed in service layer
      this.setDataValue('transactionPin', value);
    },
  })
  transactionPin: string | null;

  @Column({
    field: 'transaction_pin_salt',
    type: DataType.STRING(64),
    allowNull: true,
  })
  transactionPinSalt: string | null;

  @ForeignKey(() => User)
  @Column({ field: 'parent_id', type: DataType.UUID })
  parentId: string | null;

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

  @Default(UserStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    validate: { isIn: [Object.values(UserStatus)] },
  })
  status: UserStatus;

  @Default(false)
  @Column({ field: 'is_kyc_verified', type: DataType.BOOLEAN })
  isKycVerified: boolean;

  @ForeignKey(() => Role)
  @AllowNull(false)
  @Index('idx_role_id')
  @Column({ field: 'role_id', type: DataType.UUID })
  roleId: string;

  @Column({ field: 'refresh_token', type: DataType.TEXT })
  refreshToken: string | null;

  @Column({ field: 'password_reset_token', type: DataType.STRING(64) })
  passwordResetToken: string | null;

  @Column({ field: 'password_reset_expires', type: DataType.DATE })
  passwordResetExpires: Date | null;

  @Column({ field: 'email_verification_token', type: DataType.STRING(64) })
  emailVerificationToken: string | null;

  @Column({ field: 'email_verified_at', type: DataType.DATE })
  emailVerifiedAt: Date | null;

  @Column({ field: 'email_verification_token_expires', type: DataType.DATE })
  emailVerificationTokenExpires: Date | null;

  @Column({ field: 'last_login_at', type: DataType.DATE })
  lastLoginAt: Date | null;

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

  @Column({ field: 'created_by_id', type: DataType.UUID })
  createdById: string;

  @Default(CreatorType.USER)
  @Column({
    field: 'created_by_type',
    type: DataType.ENUM(...Object.values(CreatorType)),
    validate: { isIn: [Object.values(CreatorType)] },
  })
  createdByType: CreatorType;

  // Associations
  @BelongsTo(() => Role, { foreignKey: 'role_id', as: 'role' })
  role: Role;

  @BelongsTo(() => User, { foreignKey: 'parent_id', as: 'parent' })
  parent: User | null;

  @HasMany(() => User, { foreignKey: 'parent_id', as: 'children' })
  children: User[];

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

  get hierarchy(): {
    level: number;
    path: string;
    ancestors: string[];
    isTopLevel: boolean;
  } {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split('.').slice(0, -1),
      isTopLevel: this.hierarchyLevel === 0,
    };
  }

  // Hooks
  @BeforeCreate
  static async generateCustomerId(instance: User): Promise<void> {
    if (!instance.customerId) {
      let customerId: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        customerId = String(Math.floor(10000000 + Math.random() * 90000000));
        const existing = await User.findOne({ where: { customerId } });
        isUnique = !existing;
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique customer ID');
      }
      instance.customerId = customerId!;
    }
  }

  @BeforeCreate
  static async setHierarchy(instance: User): Promise<void> {
    if (instance.parentId) {
      const parent = await User.findByPk(instance.parentId);
      if (parent) {
        instance.hierarchyLevel = parent.hierarchyLevel + 1;
        instance.hierarchyPath = `${parent.hierarchyPath}.${instance.id}`;
      } else {
        throw new Error('Parent user not found');
      }
    } else {
      instance.hierarchyLevel = 0;
      instance.hierarchyPath = instance.id;
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: User): Promise<void> {
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

      const existing = await User.findOne({ where });
      if (existing && existing.id !== instance.id) {
        throw new Error('Username, email or phone number already exists');
      }
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: User): void {
    instance.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as unknown as Record<string, unknown>;
    delete values.password;
    delete values.passwordSalt;
    delete values.transactionPin;
    delete values.transactionPinSalt;
    delete values.refreshToken;
    delete values.passwordResetToken;
    delete values.emailVerificationToken;
    return values;
  }
}
