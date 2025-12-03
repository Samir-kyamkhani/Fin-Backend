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
} from "sequelize-typescript";






// ========== ROOT COMMISSION EARNING ==========
@Table({
  tableName: "root_commission_earnings",
  underscored: true,
  timestamps: false,
  indexes: [
    { name: "idx_user_transaction_id", fields: ["user_transaction_id"] },
    { name: "idx_root_id", fields: ["root_id"] },
    { name: "idx_wallet_id", fields: ["wallet_id"] },
    { name: "idx_from_user_id", fields: ["from_user_id"] },
    { name: "idx_created_at", fields: ["created_at"] },
  ],
})
export class RootCommissionEarning extends Model<RootCommissionEarning> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.UUID,
    field: "user_transaction_id",
    allowNull: false,
  })
  userTransactionId: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: "root_id", allowNull: false })
  rootId: string;
  @ForeignKey(() => RootWallet)
  @Column({ type: DataType.UUID, field: "wallet_id", allowNull: false })
  walletId: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "from_user_id", allowNull: false })
  fromUserId: string;
  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 0 } })
  amount: number;
  @Column({
    type: DataType.BIGINT,
    field: "commission_amount",
    allowNull: false,
    validate: { min: 0 },
  })
  commissionAmount: number;
  @Column({
    type: DataType.ENUM("FLAT", "PERCENTAGE"),
    field: "commission_type",
    allowNull: false,
    validate: { isIn: [["FLAT", "PERCENTAGE"]] },
  })
  commissionType: CommissionType;
  @Column({
    type: DataType.BIGINT,
    field: "tds_amount",
    allowNull: true,
    validate: { min: 0 },
  })
  tdsAmount: number | null;
  @Column({
    type: DataType.BIGINT,
    field: "gst_amount",
    allowNull: true,
    validate: { min: 0 },
  })
  gstAmount: number | null;
  @Column({
    type: DataType.BIGINT,
    field: "net_amount",
    allowNull: false,
    validate: { min: 0 },
  })
  netAmount: number;
  @Column({ type: DataType.JSON, allowNull: true, defaultValue: {} })
  metadata: RootCommissionEarningMetadata;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get totalDeductions(): number {
    return (this.tdsAmount || 0) + (this.gstAmount || 0);
  }
  get commissionRate(): number {
    return this.commissionType === CommissionType.FLAT
      ? this.commissionAmount
      : this.metadata?.commissionRate || 0;
  }
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get commissionAmountInRupees(): number {
    return this.commissionAmount / 100;
  }
  get tdsAmountInRupees(): number {
    return (this.tdsAmount || 0) / 100;
  }
  get gstAmountInRupees(): number {
    return (this.gstAmount || 0) / 100;
  }
  get netAmountInRupees(): number {
    return this.netAmount / 100;
  }
  get totalDeductionsInRupees(): number {
    return this.totalDeductions / 100;
  }

  // Associations
  @BelongsTo(() => Root, { foreignKey: "root_id", as: "root" }) root: Root;
  @BelongsTo(() => RootWallet, { foreignKey: "wallet_id", as: "wallet" })
  wallet: RootWallet;
  @BelongsTo(() => User, { foreignKey: "from_user_id", as: "fromUser" })
  fromUser: User;
  @BelongsTo(() => Transaction, {
    foreignKey: "user_transaction_id",
    as: "userTransaction",
  })
  userTransaction: Transaction;
  @HasMany(() => RootLedgerEntry, {
    foreignKey: "commission_earning_id",
    as: "rootLedgerEntries",
  })
  rootLedgerEntries: RootLedgerEntry[];

  // Hooks
  @BeforeCreate
  static validateAmounts(instance: RootCommissionEarning): void {
    if (instance.amount < 0) throw new Error("Amount cannot be negative");
    if (instance.commissionAmount < 0)
      throw new Error("Commission amount cannot be negative");
    if ((instance.tdsAmount || 0) < 0)
      throw new Error("TDS amount cannot be negative");
    if ((instance.gstAmount || 0) < 0)
      throw new Error("GST amount cannot be negative");
    if (instance.commissionAmount > instance.amount)
      throw new Error("Commission amount cannot exceed transaction amount");

    const netAmount =
      instance.commissionAmount -
      (instance.tdsAmount || 0) -
      (instance.gstAmount || 0);
    if (netAmount < 0) throw new Error("Net amount cannot be negative");
    if (instance.netAmount !== netAmount)
      throw new Error("Net amount calculation mismatch");
  }

  @BeforeCreate
  static setMetadataDefaults(instance: RootCommissionEarning): void {
    if (!instance.metadata)
      instance.metadata = {} as RootCommissionEarningMetadata;
    if (!instance.metadata.calculatedAt)
      instance.metadata.calculatedAt = new Date();
    if (
      instance.commissionType === CommissionType.PERCENTAGE &&
      instance.amount > 0
    ) {
      const rate = (instance.commissionAmount / instance.amount) * 100;
      instance.metadata.commissionRate = parseFloat(rate.toFixed(2));
    }
  }
}

// ========== ROOT LEDGER ENTRY ==========
@Table({
  tableName: "root_ledger_entries",
  underscored: true,
  timestamps: false,
  indexes: [
    { name: "idx_commission_earning_id", fields: ["commission_earning_id"] },
    { name: "idx_wallet_id", fields: ["wallet_id"] },
    { name: "idx_entry_type", fields: ["entry_type"] },
    { name: "idx_reference_type", fields: ["reference_type"] },
    { name: "idx_created_at", fields: ["created_at"] },
    {
      name: "idx_running_balance",
      fields: ["wallet_id", "created_at", "running_balance"],
    },
  ],
})
export class RootLedgerEntry extends Model<RootLedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => RootCommissionEarning)
  @Column({
    type: DataType.UUID,
    field: "commission_earning_id",
    allowNull: true,
  })
  commissionEarningId: string | null;
  @ForeignKey(() => RootWallet)
  @Column({ type: DataType.UUID, field: "wallet_id", allowNull: false })
  walletId: string;
  @Column({
    type: DataType.ENUM("DEBIT", "CREDIT"),
    field: "entry_type",
    allowNull: false,
    validate: { isIn: [["DEBIT", "CREDIT"]] },
  })
  entryType: EntryType;
  @Column({
    type: DataType.ENUM(
      "TRANSACTION",
      "COMMISSION",
      "REFUND",
      "ADJUSTMENT",
      "BONUS",
      "CHARGE",
      "FEE",
      "TAX",
      "PAYOUT",
      "COLLECTION"
    ),
    field: "reference_type",
    allowNull: false,
    validate: {
      isIn: [
        [
          "TRANSACTION",
          "COMMISSION",
          "REFUND",
          "ADJUSTMENT",
          "BONUS",
          "CHARGE",
          "FEE",
          "TAX",
          "PAYOUT",
          "COLLECTION",
        ],
      ],
    },
  })
  referenceType: ReferenceType;
  @Column({ type: DataType.BIGINT, allowNull: false, validate: { min: 1 } })
  amount: number;
  @Column({ type: DataType.BIGINT, field: "running_balance", allowNull: false })
  runningBalance: number;
  @Column({
    type: DataType.STRING(1000),
    allowNull: false,
    validate: { len: [1, 1000] },
  })
  narration: string;
  @Column({ type: DataType.JSON, allowNull: true, defaultValue: {} })
  metadata: RootLedgerMetadata;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get amountInRupees(): number {
    return this.amount / 100;
  }
  get runningBalanceInRupees(): number {
    return this.runningBalance / 100;
  }
  get isCredit(): boolean {
    return this.entryType === EntryType.CREDIT;
  }
  get isDebit(): boolean {
    return this.entryType === EntryType.DEBIT;
  }
  get formattedNarration(): string {
    const date = new Date(this.createdAt).toLocaleDateString("en-IN");
    const amount = Math.abs(this.amountInRupees).toFixed(2);
    const type = this.isCredit ? "Credited" : "Debited";
    return `${date}: ${type} ₹${amount} - ${this.narration}`;
  }

  // Associations
  @BelongsTo(() => RootWallet, { foreignKey: "wallet_id", as: "wallet" })
  wallet: RootWallet;
  @BelongsTo(() => RootCommissionEarning, {
    foreignKey: "commission_earning_id",
    as: "commissionEarning",
  })
  commissionEarning: RootCommissionEarning | null;

  // Hooks
  @BeforeCreate
  static validateAmountAndBalance(instance: RootLedgerEntry): void {
    if (instance.amount <= 0)
      throw new Error("Amount must be greater than zero");
    if (instance.isDebit && instance.runningBalance < 0)
      throw new Error("Debit entry cannot result in negative balance");
    if (!instance.narration || instance.narration.trim().length === 0)
      throw new Error("Narration is required");
  }

  @BeforeCreate
  static setMetadataDefaults(instance: RootLedgerEntry): void {
    if (!instance.metadata) instance.metadata = {} as RootLedgerMetadata;
    if (!instance.metadata.auditInfo)
      instance.metadata.auditInfo = { performedAt: new Date() };
  }

  @BeforeCreate
  static async validateWalletBalance(instance: RootLedgerEntry): Promise<void> {
    const wallet = await RootWallet.findByPk(instance.walletId, {
      attributes: ["balance"],
    });
    if (!wallet)
      throw new Error(`Root wallet with ID ${instance.walletId} not found`);

    const walletBalance: number = Number(wallet.balance ?? 0);
    if (instance.isCredit) {
      instance.runningBalance = walletBalance + instance.amount;
    } else {
      const newBalance = walletBalance - instance.amount;
      if (newBalance < 0)
        throw new Error("Insufficient balance for debit transaction");
      instance.runningBalance = newBalance;
    }
  }
}

// ========== ROOT ==========
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

@Table({
  tableName: "roots",
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: "idx_username_unique", unique: true, fields: ["username"] },
    { name: "idx_email_unique", unique: true, fields: ["email"] },
    { name: "idx_phone_number_unique", unique: true, fields: ["phone_number"] },
    {
      name: "idx_hierarchy_level_unique",
      unique: true,
      fields: ["hierarchy_level"],
    },
    {
      name: "idx_hierarchy_path_unique",
      unique: true,
      fields: ["hierarchy_path"],
    },
    { name: "idx_status", fields: ["status"] },
    { name: "idx_created_at", fields: ["created_at"] },
    { name: "idx_role_id", fields: ["role_id"] },
  ],
})
export class Root extends Model<Root> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @ForeignKey(() => Role)
  @Column({ field: "role_id", type: DataType.UUID })
  roleId: string | null;
  @AllowNull(false)
  @Unique("idx_username_unique")
  @Index("idx_username")
  @Column({
    type: DataType.STRING(50),
    validate: { notEmpty: true, len: [3, 50] },
  })
  username: string;
  @AllowNull(false)
  @Column({
    field: "first_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;
  @AllowNull(false)
  @Column({
    field: "last_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;
  @Column({
    field: "profile_image",
    type: DataType.TEXT,
    validate: { len: [0, 1000] },
  })
  profileImage: string | null;
  @AllowNull(false)
  @Unique("idx_email_unique")
  @Index("idx_email")
  @Column({ type: DataType.STRING(255), validate: { isEmail: true } })
  email: string;
  @AllowNull(false)
  @Unique("idx_phone_number_unique")
  @Index("idx_phone_number")
  @Column({
    field: "phone_number",
    type: DataType.STRING(15),
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;
  @AllowNull(false)
  @Column({ type: DataType.STRING(255), validate: { len: [6, 255] } })
  password: string;
  @Default(RootStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(RootStatus)),
    validate: { isIn: [Object.values(RootStatus)] },
  })
  status: RootStatus;
  @Column({ field: "refresh_token", type: DataType.TEXT }) refreshToken:
    | string
    | null;
  @Column({ field: "password_reset_token", type: DataType.STRING(64) })
  passwordResetToken: string | null;
  @Column({ field: "password_reset_expires", type: DataType.DATE })
  passwordResetExpires: Date | null;
  @Column({ field: "last_login_at", type: DataType.DATE })
  lastLoginAt: Date | null;
  @Default(0)
  @Unique("idx_hierarchy_level_unique")
  @Column({
    field: "hierarchy_level",
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  hierarchyLevel: number;
  @Default("0")
  @Unique("idx_hierarchy_path_unique")
  @Column({
    field: "hierarchy_path",
    type: DataType.TEXT,
    validate: { notEmpty: true },
  })
  hierarchyPath: string;
  @Default(DataType.NOW)
  @Column({ field: "created_at", type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: "updated_at", type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
  @Column({ field: "deleted_at", type: DataType.DATE })
  declare deletedAt: Date | null;

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
      ancestors: this.hierarchyPath.split("/").slice(0, -1),
    };
  }

  // Associations
  @BelongsTo(() => Role, { foreignKey: "roleId", as: "role" })
  role: Role | null;
  @HasMany(() => RootWallet, { foreignKey: "root_id", as: "wallets" })
  wallets: RootWallet[];
  @HasMany(() => RootBankDetail, { foreignKey: "root_id", as: "bankAccounts" })
  bankAccounts: RootBankDetail[];
  @HasMany(() => RootCommissionEarning, {
    foreignKey: "root_id",
    as: "commissionEarnings",
  })
  commissionEarnings: RootCommissionEarning[];
  @HasMany(() => Employee, { foreignKey: "root_id", as: "employees" })
  employees: Employee[];
  @HasMany(() => SystemSetting, { foreignKey: "root_id", as: "systemSettings" })
  systemSettings: SystemSetting[];
  @HasMany(() => ServiceProvider, {
    foreignKey: "created_by_root_id",
    as: "serviceProviders",
  })
  serviceProviders: ServiceProvider[];
  @HasMany(() => IpWhitelist, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdIpWhitelists",
  })
  createdIpWhitelists: IpWhitelist[];
  @HasMany(() => IpWhitelist, {
    foreignKey: "user_id",
    constraints: false,
    as: "ipWhitelists",
    scope: { user_type: "ROOT" },
  })
  ipWhitelists: IpWhitelist[];
  @HasMany(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdUsers",
  })
  createdUsers: User[];

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async generatePasswordResetToken(): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
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
  static async hashPassword(instance: Root): Promise<void> {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeCreate
  static async setDefaultHierarchy(instance: Root): Promise<void> {
    if (!instance.hierarchyLevel) {
      const maxLevelRoot = await Root.findOne({
        order: [["hierarchy_level", "DESC"]],
        attributes: ["hierarchy_level", "hierarchy_path"],
      });
      if (maxLevelRoot) {
        instance.hierarchyLevel = maxLevelRoot.hierarchyLevel + 1;
        instance.hierarchyPath = `${maxLevelRoot.hierarchyPath}.${instance.hierarchyLevel}`;
      } else {
        instance.hierarchyLevel = 0;
        instance.hierarchyPath = "0";
      }
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Root): Promise<void> {
    if (
      instance.changed("username") ||
      instance.changed("email") ||
      instance.changed("phone_number")
    ) {
      const where: Record<string, unknown> = {};
      if (instance.changed("username")) where.username = instance.username;
      if (instance.changed("email")) where.email = instance.email;
      if (instance.changed("phone_number"))
        where.phoneNumber = instance.phoneNumber;
      const existing = await Root.findOne({ where });
      if (existing && existing.id !== instance.id)
        throw new Error("Username, email or phone number already exists");
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: Root): void {
    instance.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.password;
    delete values.refreshToken;
    delete values.passwordResetToken;
    return values;
  }
}

// ========== USER ==========
@Table({
  tableName: "users",
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: "idx_parent_id", fields: ["parent_id"] },
    { name: "idx_customer_id_unique", unique: true, fields: ["customer_id"] },
    { name: "idx_hierarchy_level", fields: ["hierarchy_level"] },
    { name: "idx_hierarchy_path", fields: ["hierarchy_path"] },
    { name: "idx_phone_number_unique", unique: true, fields: ["phone_number"] },
    { name: "idx_role_id", fields: ["role_id"] },
    { name: "idx_username_unique", unique: true, fields: ["username"] },
    { name: "idx_email_unique", unique: true, fields: ["email"] },
    { name: "idx_status", fields: ["status"] },
    { name: "idx_created_at", fields: ["created_at"] },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
  ],
})
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @AllowNull(false)
  @Unique("idx_customer_id_unique")
  @Index("idx_customer_id")
  @Column({
    field: "customer_id",
    type: DataType.STRING(8),
    validate: { len: [8, 8] },
  })
  customerId: string;
  @AllowNull(false)
  @Unique("idx_username_unique")
  @Index("idx_username")
  @Column({
    type: DataType.STRING(50),
    validate: { notEmpty: true, len: [3, 50] },
  })
  username: string;
  @AllowNull(false)
  @Column({
    field: "first_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;
  @AllowNull(false)
  @Column({
    field: "last_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;
  @Column({
    field: "profile_image",
    type: DataType.TEXT,
    validate: { len: [0, 1000] },
  })
  profileImage: string | null;
  @AllowNull(false)
  @Unique("idx_email_unique")
  @Index("idx_email")
  @Column({ type: DataType.STRING(255), validate: { isEmail: true } })
  email: string;
  @AllowNull(false)
  @Unique("idx_phone_number_unique")
  @Index("idx_phone_number")
  @Column({
    field: "phone_number",
    type: DataType.STRING(15),
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;
  @AllowNull(false)
  @Column({ type: DataType.STRING(255), validate: { len: [6, 255] } })
  password: string;
  @Column({
    field: "transaction_pin",
    type: DataType.STRING(60),
    validate: { len: [0, 60] },
  })
  transactionPin: string | null;
  @ForeignKey(() => User)
  @Column({ field: "parent_id", type: DataType.UUID })
  parentId: string | null;
  @AllowNull(false)
  @Index("idx_hierarchy_level")
  @Column({
    field: "hierarchy_level",
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  hierarchyLevel: number;
  @AllowNull(false)
  @Column({
    field: "hierarchy_path",
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
  @Column({ field: "is_kyc_verified", type: DataType.BOOLEAN })
  isKycVerified: boolean;
  @ForeignKey(() => Role)
  @AllowNull(false)
  @Index("idx_role_id")
  @Column({ field: "role_id", type: DataType.UUID })
  roleId: string;
  @Column({ field: "refresh_token", type: DataType.TEXT }) refreshToken:
    | string
    | null;
  @Column({ field: "password_reset_token", type: DataType.STRING(64) })
  passwordResetToken: string | null;
  @Column({ field: "password_reset_expires", type: DataType.DATE })
  passwordResetExpires: Date | null;
  @Column({ field: "email_verification_token", type: DataType.STRING(64) })
  emailVerificationToken: string | null;
  @Column({ field: "email_verified_at", type: DataType.DATE })
  emailVerifiedAt: Date | null;
  @Column({ field: "email_verification_token_expires", type: DataType.DATE })
  emailVerificationTokenExpires: Date | null;
  @Column({ field: "last_login_at", type: DataType.DATE })
  lastLoginAt: Date | null;
  @Default(DataType.NOW)
  @Column({ field: "created_at", type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: "updated_at", type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
  @Column({ field: "deleted_at", type: DataType.DATE })
  declare deletedAt: Date | null;
  @Column({ field: "deactivation_reason", type: DataType.TEXT })
  deactivationReason: string | null;
  @Column({ field: "created_by_id", type: DataType.UUID }) createdById: string;
  @Default(CreatorType.USER)
  @Column({
    field: "created_by_type",
    type: DataType.ENUM(...Object.values(CreatorType)),
    validate: { isIn: [Object.values(CreatorType)] },
  })
  createdByType: CreatorType;

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
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await this.save();
    return resetToken;
  }

  async generateEmailVerificationToken(): Promise<string> {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    this.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    this.emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
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

  async getHierarchyInfo(): Promise<{
    level: number;
    path: string;
    ancestors: string[];
    isTopLevel: boolean;
  }> {
    return {
      level: this.hierarchyLevel,
      path: this.hierarchyPath,
      ancestors: this.hierarchyPath.split(".").slice(0, -1),
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

      if (!isUnique) throw new Error("Failed to generate unique customer ID");
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
      } else throw new Error("Parent user not found");
    } else {
      instance.hierarchyLevel = 0;
      instance.hierarchyPath = instance.id;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User): Promise<void> {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async hashTransactionPin(instance: User): Promise<void> {
    if (instance.changed("transactionPin") && instance.transactionPin) {
      const salt = await bcrypt.genSalt(10);
      instance.transactionPin = await bcrypt.hash(
        instance.transactionPin,
        salt
      );
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: User): Promise<void> {
    if (
      instance.changed("username") ||
      instance.changed("email") ||
      instance.changed("phone_number")
    ) {
      const where: Record<string, unknown> = {};
      if (instance.changed("username")) where.username = instance.username;
      if (instance.changed("email")) where.email = instance.email;
      if (instance.changed("phone_number"))
        where.phoneNumber = instance.phoneNumber;
      const existing = await User.findOne({ where });
      if (existing && existing.id !== instance.id)
        throw new Error("Username, email or phone number already exists");
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: User): void {
    instance.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.password;
    delete values.transactionPin;
    delete values.refreshToken;
    delete values.passwordResetToken;
    delete values.emailVerificationToken;
    return values;
  }
}

// ========== EMPLOYEE ==========
@Table({
  tableName: "employees",
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: "idx_department_id", fields: ["department_id"] },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_username_unique", unique: true, fields: ["username"] },
    { name: "idx_email_unique", unique: true, fields: ["email"] },
    { name: "idx_phone_number_unique", unique: true, fields: ["phone_number"] },
    { name: "idx_status", fields: ["status"] },
    { name: "idx_hierarchy_level", fields: ["hierarchy_level"] },
    { name: "idx_created_at", fields: ["created_at"] },
    { name: "idx_root_id", fields: ["root_id"] },
    { name: "idx_user_id", fields: ["user_id"] },
  ],
})
export class Employee extends Model<Employee> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @AllowNull(false)
  @Unique("idx_username_unique")
  @Index("idx_username")
  @Column({
    type: DataType.STRING(50),
    validate: { notEmpty: true, len: [3, 50] },
  })
  username: string;
  @AllowNull(false)
  @Column({
    field: "first_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;
  @AllowNull(false)
  @Column({
    field: "last_name",
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;
  @Column({
    field: "profile_image",
    type: DataType.TEXT,
    validate: { len: [0, 1000] },
  })
  profileImage: string | null;
  @AllowNull(false)
  @Unique("idx_email_unique")
  @Index("idx_email")
  @Column({ type: DataType.STRING(255), validate: { isEmail: true } })
  email: string;
  @AllowNull(false)
  @Unique("idx_phone_number_unique")
  @Index("idx_phone_number")
  @Column({
    field: "phone_number",
    type: DataType.STRING(15),
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;
  @AllowNull(false)
  @Column({ type: DataType.STRING(255), validate: { len: [6, 255] } })
  password: string;
  @ForeignKey(() => Department)
  @AllowNull(false)
  @Index("idx_department_id")
  @Column({ field: "department_id", type: DataType.UUID })
  departmentId: string;
  @Default(EmployeeStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(EmployeeStatus)),
    validate: { isIn: [Object.values(EmployeeStatus)] },
  })
  status: EmployeeStatus;
  @Column({ field: "refresh_token", type: DataType.TEXT }) refreshToken:
    | string
    | null;
  @Column({ field: "password_reset_token", type: DataType.STRING(64) })
  passwordResetToken: string | null;
  @Column({ field: "password_reset_expires", type: DataType.DATE })
  passwordResetExpires: Date | null;
  @Column({ field: "last_login_at", type: DataType.DATE })
  lastLoginAt: Date | null;
  @AllowNull(false)
  @Index("idx_hierarchy_level")
  @Column({
    field: "hierarchy_level",
    type: DataType.INTEGER,
    validate: { min: 0 },
  })
  hierarchyLevel: number;
  @AllowNull(false)
  @Column({
    field: "hierarchy_path",
    type: DataType.TEXT,
    validate: { notEmpty: true },
  })
  hierarchyPath: string;
  @Default(DataType.NOW)
  @Column({ field: "created_at", type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: "updated_at", type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
  @Column({ field: "deleted_at", type: DataType.DATE })
  declare deletedAt: Date | null;
  @Column({ field: "deactivation_reason", type: DataType.TEXT })
  deactivationReason: string | null;
  @AllowNull(false)
  @Column({
    field: "created_by_type",
    type: DataType.ENUM(...Object.values(CreatedByType)),
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @AllowNull(false)
  @Index("idx_created_by_id")
  @Column({ field: "created_by_id", type: DataType.UUID })
  createdById: string;
  @ForeignKey(() => Root)
  @Column({ field: "root_id", type: DataType.UUID })
  rootId: string | null;
  @ForeignKey(() => User)
  @Column({ field: "user_id", type: DataType.UUID })
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
      ancestors: this.hierarchyPath.split(".").slice(0, -1),
    };
  }

  // Associations
  @BelongsTo(() => Department, {
    foreignKey: "department_id",
    as: "department",
  })
  department: Department;
  @HasMany(() => EmployeePermission, {
    foreignKey: "employee_id",
    as: "employeePermissions",
  })
  employeePermissions: EmployeePermission[];
  @BelongsTo(() => Root, { foreignKey: "root_id", as: "root" })
  root: Root | null;
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" })
  user: User | null;
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
  })
  createdByUser: User | null;

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async generatePasswordResetToken(): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
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
        hierarchyPath: { [Op.startsWith]: `${this.hierarchyPath}.` },
        status: EmployeeStatus.ACTIVE,
      },
    });
  }

  // Hooks
  @BeforeCreate
  static async setHierarchy(instance: Employee): Promise<void> {
    if (!instance.hierarchyLevel && !instance.hierarchyPath) {
      const maxLevelEmployee = await Employee.findOne({
        where: { departmentId: instance.departmentId },
        order: [["hierarchy_level", "DESC"]],
        attributes: ["hierarchy_level", "hierarchy_path"],
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
  static async hashPassword(instance: Employee): Promise<void> {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  @BeforeSave
  static async validateUniqueFields(instance: Employee): Promise<void> {
    if (
      instance.changed("username") ||
      instance.changed("email") ||
      instance.changed("phone_number")
    ) {
      const where: Record<string, unknown> = {};
      if (instance.changed("username")) where.username = instance.username;
      if (instance.changed("email")) where.email = instance.email;
      if (instance.changed("phone_number"))
        where.phoneNumber = instance.phoneNumber;
      const existing = await Employee.findOne({ where });
      if (existing && existing.id !== instance.id)
        throw new Error("Username, email or phone number already exists");
    }
  }

  @BeforeSave
  static async validateCreator(instance: Employee): Promise<void> {
    if (instance.createdByType === CreatedByType.ROOT && !instance.rootId)
      instance.rootId = instance.createdById;
    else if (instance.createdByType === CreatedByType.ADMIN && !instance.userId)
      instance.userId = instance.createdById;
  }

  @BeforeUpdate
  static updateTimestamp(instance: Employee): void {
    instance.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.password;
    delete values.refreshToken;
    delete values.passwordResetToken;
    return values;
  }
}

// ========== ROLE ==========
@Table({
  tableName: "roles",
  timestamps: true,
  underscored: true,
  modelName: "Role",
  indexes: [
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_name_unique", unique: true, fields: ["name"] },
    {
      name: "idx_hierarchy_level_unique",
      unique: true,
      fields: ["hierarchy_level"],
    },
  ],
})
export class Role extends Model<Role> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(50),
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, len: [2, 50] },
  })
  name: string;
  @Column({
    type: DataType.INTEGER,
    field: "hierarchy_level",
    unique: true,
    allowNull: false,
    validate: { min: 1 },
  })
  hierarchyLevel: number;
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    validate: { len: [0, 1000] },
  })
  description: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @HasMany(() => User, {
    foreignKey: "role_id",
    as: "users",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  users: User[];
  @HasMany(() => RolePermission, {
    foreignKey: "role_id",
    as: "rolePermissions",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  rolePermissions: RolePermission[];
  @HasMany(() => CommissionSetting, {
    foreignKey: "role_id",
    as: "commissionSettings",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  commissionSettings: CommissionSetting[];
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Instance methods
  getCreator(): Root | User | undefined {
    if (this.createdByType === CreatedByType.ROOT) return this.createdByRoot;
    else if (this.createdByType === CreatedByType.ADMIN)
      return this.createdByUser;
    return undefined;
  }

  // Static methods
  static async findByHierarchyLevel(level: number): Promise<Role | null> {
    return this.findOne({ where: { hierarchyLevel: level } });
  }
  static async findByName(name: string): Promise<Role | null> {
    return this.findOne({ where: { name } });
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateHierarchy(instance: Role): void {
    if (instance.hierarchyLevel < 1)
      throw new Error("Hierarchy level must be at least 1");
  }
}

// ========== ROLE PERMISSION ==========
@Table({
  tableName: "role_permissions",
  timestamps: true,
  underscored: true,
  modelName: "RolePermission",
  indexes: [
    {
      name: "idx_role_permission_service_unique",
      unique: true,
      fields: ["role_id", "permission", "service_id"],
      where: { is_active: true, revoked_at: null },
    },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_role_id", fields: ["role_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
    { name: "idx_service_id", fields: ["service_id"] },
  ],
})
export class RolePermission extends Model<RolePermission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, field: "role_id", allowNull: false })
  roleId: string;
  @ForeignKey(() => ServiceProvider)
  @Column({ type: DataType.UUID, field: "service_id", allowNull: true })
  serviceId: string | null;
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  permission: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "assigned_at", allowNull: false })
  assignedAt: Date;
  @Column({ type: DataType.DATE, field: "revoked_at" }) revokedAt: Date | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: "is_active" })
  isActive: boolean;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => ServiceProvider, { foreignKey: "service_id", as: "service" })
  service: ServiceProvider | null;
  @BelongsTo(() => Role, { foreignKey: "role_id", as: "role" }) role: Role;
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Virtual properties
  get isActivePermission(): boolean {
    return this.isActive && !this.revokedAt;
  }

  // Hooks
  @BeforeCreate
  static validateUniquePermission(instance: RolePermission): void {
    if (!instance.permission) throw new Error("Permission is required");
  }

  @BeforeUpdate
  static updateRevokedAt(instance: RolePermission): void {
    if (
      instance.changed("isActive") &&
      !instance.isActive &&
      !instance.revokedAt
    ) {
      instance.revokedAt = new Date();
    }
    instance.updatedAt = new Date();
  }
}

// ========== USER PERMISSION ==========
@Table({
  tableName: "user_permissions",
  timestamps: true,
  underscored: true,
  modelName: "UserPermission",
  indexes: [
    {
      name: "idx_user_permission_service_unique",
      unique: true,
      fields: ["user_id", "permission", "service_id"],
      where: { is_active: true, revoked_at: null },
    },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_user_id", fields: ["user_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
    { name: "idx_service_id", fields: ["service_id"] },
  ],
})
export class UserPermission extends Model<UserPermission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => ServiceProvider)
  @Column({ type: DataType.UUID, field: "service_id", allowNull: true })
  serviceId: string | null;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "user_id", allowNull: false })
  userId: string;
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  permission: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "assigned_at", allowNull: false })
  assignedAt: Date;
  @Column({ type: DataType.DATE, field: "revoked_at" }) revokedAt: Date | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: "is_active" })
  isActive: boolean;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => ServiceProvider, { foreignKey: "service_id", as: "service" })
  service: ServiceProvider | null;
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" }) user: User;
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByAdmin",
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByAdmin: User | null;

  // Virtual properties
  get isActivePermission(): boolean {
    return this.isActive && !this.revokedAt;
  }

  // Hooks
  @BeforeCreate
  static validateUniquePermission(instance: UserPermission): void {
    if (!instance.permission) throw new Error("Permission is required");
  }

  @BeforeUpdate
  static updateRevokedAt(instance: UserPermission): void {
    if (
      instance.changed("isActive") &&
      !instance.isActive &&
      !instance.revokedAt
    ) {
      instance.revokedAt = new Date();
    }
    instance.updatedAt = new Date();
  }
}

// ========== EMPLOYEE PERMISSION ==========
@Table({
  tableName: "employee_permissions",
  timestamps: true,
  underscored: true,
  modelName: "EmployeePermission",
  indexes: [
    {
      name: "idx_employee_permission_unique",
      unique: true,
      fields: ["employee_id", "permission"],
      where: { is_active: true, revoked_at: null },
    },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_employee_id", fields: ["employee_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
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
  @Column({ type: DataType.UUID, field: "employee_id", allowNull: false })
  employeeId: string;
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  permission: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "assigned_at", allowNull: false })
  assignedAt: Date;
  @Column({ type: DataType.DATE, field: "revoked_at" }) revokedAt: Date | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: "is_active" })
  isActive: boolean;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Employee, { foreignKey: "employee_id", as: "employee" })
  employee: Employee;
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
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
    if (!instance.permission) throw new Error("Permission is required");
  }

  @BeforeUpdate
  static updateRevokedAt(instance: EmployeePermission): void {
    if (
      instance.changed("isActive") &&
      !instance.isActive &&
      !instance.revokedAt
    ) {
      instance.revokedAt = new Date();
    }
    instance.updatedAt = new Date();
  }
}

// ========== USER KYC ==========
enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

enum UserKycStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

enum UserKycType {
  USER_KYC = "USER_KYC",
  BUSINESS_KYC = "BUSINESS_KYC",
}

enum VerifiedByType {
  ROOT = "ROOT",
  USER = "USER",
  EMPLOYEE = "EMPLOYEE",
}

enum RoleType {
  PROPRIETOR = "PROPRIETOR",
  PARTNER = "PARTNER",
  DIRECTOR = "DIRECTOR",
  AUTHORIZED_SIGNATORY = "AUTHORIZED_SIGNATORY",
}

@Table({
  tableName: "user_kyc",
  timestamps: true,
  underscored: true,
  paranoid: true,
  modelName: "UserKyc",
  indexes: [
    { name: "idx_user_id", fields: ["user_id"] },
    { name: "idx_business_kyc_id", fields: ["business_kyc_id"] },
    { name: "idx_status", fields: ["status"] },
    { name: "idx_verified_by", fields: ["verified_by_id", "verified_by_type"] },
    { name: "idx_address_id", fields: ["address_id"] },
    { name: "idx_role_type", fields: ["role_type"] },
  ],
})
export class UserKyc extends Model<UserKyc> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: "user_id",
    unique: true,
    allowNull: false,
  })
  userId: string;
  @Column({
    type: DataType.STRING(100),
    field: "first_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;
  @Column({
    type: DataType.STRING(100),
    field: "last_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;
  @Column({
    type: DataType.STRING(100),
    field: "father_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  fatherName: string;
  @Column({ type: DataType.DATE, allowNull: false }) dob: Date;
  @Column({
    type: DataType.ENUM(...Object.values(UserGender)),
    allowNull: false,
    validate: { isIn: [Object.values(UserGender)] },
  })
  gender: UserGender;
  @Column({
    type: DataType.ENUM(...Object.values(UserKycStatus)),
    defaultValue: UserKycStatus.PENDING,
    validate: { isIn: [Object.values(UserKycStatus)] },
  })
  status: UserKycStatus;
  @Column({
    type: DataType.ENUM(...Object.values(UserKycType)),
    defaultValue: UserKycType.USER_KYC,
    validate: { isIn: [Object.values(UserKycType)] },
  })
  type: UserKycType;
  @Column({ type: DataType.TEXT, field: "kyc_rejection_reason" })
  kycRejectionReason: string | null;
  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, field: "address_id", allowNull: false })
  addressId: string;
  @Column({
    type: DataType.STRING(500),
    field: "pan_file",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  panFile: string;
  @Column({
    type: DataType.STRING(500),
    field: "aadhaar_file",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  aadhaarFile: string;
  @Column({
    type: DataType.STRING(500),
    field: "address_proof_file",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  addressProofFile: string;
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  photo: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;
  @DeletedAt
  @Column({ type: DataType.DATE, field: "deleted_at" })
  declare deletedAt: Date | null;
  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    field: "verified_by_type",
  })
  verifiedByType: VerifiedByType | null;
  @Column({ type: DataType.UUID, field: "verified_by_id" }) verifiedById:
    | string
    | null;
  @Column({ type: DataType.DATE, field: "verified_at" })
  verifiedAt: Date | null;
  @ForeignKey(() => BusinessKyc)
  @Column({ type: DataType.UUID, field: "business_kyc_id" })
  businessKycId: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(RoleType)),
    field: "role_type",
    defaultValue: RoleType.PROPRIETOR,
    validate: { isIn: [Object.values(RoleType)] },
  })
  roleType: RoleType;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  get isVerified(): boolean {
    return this.status === UserKycStatus.VERIFIED;
  }
  get isPending(): boolean {
    return this.status === UserKycStatus.PENDING;
  }
  get isRejected(): boolean {
    return this.status === UserKycStatus.REJECTED;
  }
  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    )
      age--;
    return age;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" }) user: User;
  @BelongsTo(() => Address, { foreignKey: "address_id", as: "address" })
  address: Address;
  @BelongsTo(() => BusinessKyc, {
    foreignKey: "business_kyc_id",
    as: "businessKyc",
  })
  businessKyc: BusinessKyc | null;
  @HasMany(() => PiiConsent, { foreignKey: "user_kyc_id", as: "piiConsents" })
  piiConsents: PiiConsent[];
  @BelongsTo(() => Root, {
    foreignKey: "verified_by_id",
    constraints: false,
    as: "verifiedByRoot",
  })
  verifiedByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "verified_by_id",
    constraints: false,
    as: "verifiedByUser",
  })
  verifiedByUser: User | null;

  // Hooks
  @BeforeCreate
  static validateAge(instance: UserKyc): void {
    const age = instance.age;
    if (age < 18) throw new Error("User must be at least 18 years old for KYC");
    if (age > 120) throw new Error("Invalid date of birth");
  }

  @BeforeUpdate
  static updateTimestamp(instance: UserKyc): void {
    instance.updatedAt = new Date();
  }
}

// ========== BUSINESS KYC ==========
enum BusinessType {
  PROPRIETORSHIP = "PROPRIETORSHIP",
  PARTNERSHIP = "PARTNERSHIP",
  PRIVATE_LIMITED = "PRIVATE_LIMITED",
  PUBLIC_LIMITED = "PUBLIC_LIMITED",
  LLP = "LLP",
  TRUST = "TRUST",
  SOCIETY = "SOCIETY",
}

@Table({
  tableName: "business_kycs",
  timestamps: true,
  underscored: true,
  modelName: "BusinessKyc",
  indexes: [
    { name: "business_kycs_user_id_unique", unique: true, fields: ["user_id"] },
    { name: "idx_user_status", fields: ["user_id", "status"] },
    { name: "idx_verified_by", fields: ["verified_by_id"] },
    { name: "idx_pan_number", fields: ["pan_number"] },
    { name: "idx_gst_number", fields: ["gst_number"] },
    { name: "idx_business_type", fields: ["business_type"] },
    { name: "idx_address_id", fields: ["address_id"] },
  ],
})
export class BusinessKyc extends Model<BusinessKyc> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: "user_id" })
  userId: string;
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    field: "business_name",
    validate: { notEmpty: true, len: [1, 200] },
  })
  businessName: string;
  @Column({
    type: DataType.ENUM(...Object.values(BusinessType)),
    allowNull: false,
    field: "business_type",
    validate: { isIn: [Object.values(BusinessType)] },
  })
  businessType: BusinessType;
  @Column({
    type: DataType.ENUM(...Object.values(KycStatus)),
    defaultValue: KycStatus.PENDING,
    validate: { isIn: [Object.values(KycStatus)] },
  })
  status: KycStatus;
  @Column({ type: DataType.TEXT, field: "rejection_reason" }) rejectionReason:
    | string
    | null;
  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, allowNull: false, field: "address_id" })
  addressId: string;
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    field: "pan_number",
    validate: {
      notEmpty: true,
      len: [10, 10],
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
  })
  panNumber: string;
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: "gst_number",
    validate: {
      notEmpty: true,
      len: [15, 15],
      is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
  })
  gstNumber: string;
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    field: "pan_file",
    validate: { notEmpty: true, len: [1, 500] },
  })
  panFile: string;
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    field: "gst_file",
    validate: { notEmpty: true, len: [1, 500] },
  })
  gstFile: string;
  @Column({
    type: DataType.STRING(20),
    field: "udhyam_aadhar",
    validate: { len: [0, 20] },
  })
  udhyamAadhar: string | null;
  @Column({
    type: DataType.STRING(500),
    field: "br_doc",
    validate: { len: [0, 500] },
  })
  brDoc: string | null;
  @Column({
    type: DataType.STRING(500),
    field: "partnership_deed",
    validate: { len: [0, 500] },
  })
  partnershipDeed: string | null;
  @Column({
    type: DataType.INTEGER,
    field: "partner_kyc_numbers",
    validate: { min: 1, max: 20 },
  })
  partnerKycNumbers: number | null;
  @Column({
    type: DataType.STRING(25),
    field: "cin",
    validate: { len: [0, 25] },
  })
  cin: string | null;
  @Column({
    type: DataType.STRING(500),
    field: "moa_file",
    validate: { len: [0, 500] },
  })
  moaFile: string | null;
  @Column({
    type: DataType.STRING(500),
    field: "aoa_file",
    validate: { len: [0, 500] },
  })
  aoaFile: string | null;
  @Column({
    type: DataType.INTEGER,
    field: "authorized_member_count",
    validate: { min: 1, max: 20 },
  })
  authorizedMemberCount: number;
  @Column({
    type: DataType.STRING(500),
    field: "director_shareholding_file",
    validate: { len: [0, 500] },
  })
  directorShareholding: string | null;
  @Column({ type: DataType.UUID, field: "verified_by_id" }) verifiedById:
    | string
    | null;
  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    field: "verified_by_type",
  })
  verifiedByType: VerifiedByType | null;
  @Column({ type: DataType.DATE, field: "verified_at" })
  verifiedAt: Date | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  get isVerified(): boolean {
    return this.status === KycStatus.VERIFIED;
  }
  get isPending(): boolean {
    return this.status === KycStatus.PENDING;
  }
  get isRejected(): boolean {
    return this.status === KycStatus.REJECTED;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" }) user: User;
  @BelongsTo(() => Address, { foreignKey: "address_id", as: "address" })
  address: Address;
  @HasMany(() => UserKyc, { foreignKey: "business_kyc_id", as: "userKycs" })
  userKycs: UserKyc[];
  @HasMany(() => PiiConsent, {
    foreignKey: "business_kyc_id",
    as: "piiConsents",
  })
  piiConsents: PiiConsent[];
  @BelongsTo(() => Root, {
    foreignKey: "verified_by_id",
    constraints: false,
    as: "verifiedByRoot",
    scope: { verified_by_type: VerifiedByType.ROOT },
  })
  verifiedByRoot: Root | null;
  @BelongsTo(() => Employee, {
    foreignKey: "verified_by_id",
    constraints: false,
    as: "verifiedByEmployee",
    scope: { verified_by_type: VerifiedByType.EMPLOYEE },
  })
  verifiedByEmployee: Employee | null;

  // Hooks
  @BeforeSave
  static setAuthorizedMemberCount(instance: BusinessKyc): void {
    if (instance.businessType === BusinessType.PROPRIETORSHIP)
      instance.authorizedMemberCount = 1;
    if (
      instance.businessType === BusinessType.PARTNERSHIP &&
      instance.authorizedMemberCount &&
      instance.authorizedMemberCount < 2
    ) {
      throw new Error("Partnership requires minimum 2 authorized members");
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: BusinessKyc): void {
    instance.updatedAt = new Date();
  }
}

// ========== PII CONSENT ==========
@Table({
  tableName: "pii_consents",
  timestamps: false,
  underscored: true,
  modelName: "PiiConsent",
  indexes: [
    {
      name: "idx_user_pii_type_scope_unique",
      unique: true,
      fields: ["user_id", "pii_type", "scope"],
    },
    { name: "idx_user_kyc_id", fields: ["user_kyc_id"] },
    { name: "idx_business_kyc_id", fields: ["business_kyc_id"] },
    { name: "idx_expires_at", fields: ["expires_at"] },
  ],
})
export class PiiConsent extends Model<PiiConsent> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "user_id", allowNull: false })
  userId: string;
  @ForeignKey(() => UserKyc)
  @Column({ type: DataType.UUID, field: "user_kyc_id", allowNull: true })
  userKycId: string | null;
  @ForeignKey(() => BusinessKyc)
  @Column({ type: DataType.UUID, field: "business_kyc_id", allowNull: true })
  businessKycId: string | null;
  @Column({
    type: DataType.STRING(50),
    field: "pii_type",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  piiType: string;
  @Column({
    type: DataType.STRING(64),
    field: "pii_hash",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 64] },
  })
  piiHash: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "provided_at", allowNull: false })
  providedAt: Date;
  @Column({ type: DataType.DATE, field: "expires_at", allowNull: false })
  expiresAt: Date;
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  scope: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }
  get isValid(): boolean {
    return !this.isExpired;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" }) user: User;
  @BelongsTo(() => UserKyc, { foreignKey: "user_kyc_id", as: "userKyc" })
  userKyc: UserKyc | null;
  @BelongsTo(() => BusinessKyc, {
    foreignKey: "business_kyc_id",
    as: "businessKyc",
  })
  businessKyc: BusinessKyc | null;

  // Hooks
  @BeforeCreate
  static validateExpiry(instance: PiiConsent): void {
    if (!instance.expiresAt)
      throw new Error("Expiry date is required for PII consent");
    if (instance.expiresAt <= new Date())
      throw new Error("PII consent expiry must be in the future");
  }
}

// ========== SERVICE PROVIDER ==========
@Table({
  tableName: "service_providers",
  timestamps: true,
  underscored: true,
  modelName: "ServiceProvider",
  indexes: [
    { name: "idx_user_id", fields: ["user_id"] },
    { name: "idx_integration_id", fields: ["integration_id"] },
    { name: "idx_root_id", fields: ["root_id"] },
    { name: "idx_assigned_by", fields: ["assigned_by_id", "assigned_by_type"] },
    { name: "idx_hierarchy_path", fields: ["hierarchy_path"] },
    { name: "idx_status", fields: ["status"] },
    { name: "idx_hierarchy_level", fields: ["hierarchy_level"] },
  ],
})
export class ServiceProvider extends Model<ServiceProvider> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "user_id", allowNull: false })
  userId: string;
  @ForeignKey(() => ApiIntegration)
  @Column({ type: DataType.UUID, field: "integration_id", allowNull: false })
  integrationId: string;
  @Column({
    type: DataType.STRING(100),
    field: "service_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  serviceName: string;
  @Column({
    type: DataType.ENUM(...Object.values(ServiceStatus)),
    defaultValue: ServiceStatus.ACTIVE,
    validate: { isIn: [Object.values(ServiceStatus)] },
  })
  status: ServiceStatus;
  @Column({
    type: DataType.ENUM(...Object.values(AssignedByType)),
    field: "assigned_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(AssignedByType)] },
  })
  assignedByType: AssignedByType;
  @Column({ type: DataType.UUID, field: "assigned_by_id", allowNull: false })
  assignedById: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: "root_id", allowNull: false })
  rootId: string;
  @Column({
    type: DataType.INTEGER,
    field: "hierarchy_level",
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  })
  hierarchyLevel: number;
  @Column({
    type: DataType.TEXT,
    field: "hierarchy_path",
    allowNull: false,
    validate: { notEmpty: true },
  })
  hierarchyPath: string;
  @Column({ type: DataType.BOOLEAN, field: "can_reassign", defaultValue: true })
  canReassign: boolean;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  isActive(): boolean {
    return this.status === ServiceStatus.ACTIVE;
  }
  canBeReassigned(): boolean {
    return this.canReassign && this.isActive();
  }

  // Associations
  @BelongsTo(() => User, {
    foreignKey: "user_id",
    as: "user",
    onDelete: "CASCADE",
  })
  user: User;
  @BelongsTo(() => ApiIntegration, {
    foreignKey: "integration_id",
    as: "integration",
    onDelete: "CASCADE",
  })
  integration: ApiIntegration;
  @BelongsTo(() => Root, {
    foreignKey: "root_id",
    as: "root",
    onDelete: "CASCADE",
  })
  root: Root;
  @HasMany(() => Transaction, {
    foreignKey: "service_id",
    as: "transactions",
    onDelete: "RESTRICT",
  })
  transactions: Transaction[];
  @HasMany(() => CommissionSetting, {
    foreignKey: "service_id",
    as: "commissionSettings",
    onDelete: "CASCADE",
  })
  commissionSettings: CommissionSetting[];
  @HasMany(() => LedgerEntry, {
    foreignKey: "service_id",
    as: "ledgerEntries",
    onDelete: "RESTRICT",
  })
  ledgerEntries: LedgerEntry[];
  @HasMany(() => RolePermission, {
    foreignKey: "service_id",
    as: "rolePermissions",
    onDelete: "CASCADE",
  })
  rolePermissions: RolePermission[];
  @HasMany(() => UserPermission, {
    foreignKey: "service_id",
    as: "userPermissions",
    onDelete: "CASCADE",
  })
  userPermissions: UserPermission[];
  @BelongsTo(() => Root, {
    foreignKey: "assigned_by_id",
    constraints: false,
    as: "assignedByRoot",
    scope: { assigned_by_type: AssignedByType.ROOT },
  })
  assignedByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "assigned_by_id",
    constraints: false,
    as: "assignedByAdmin",
    scope: { assigned_by_type: AssignedByType.ADMIN },
  })
  assignedByAdmin: User | null;

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: ServiceProvider): void {
    instance.updatedAt = new Date();
  }
}

// ========== API INTEGRATION ==========
@Table({
  tableName: "api_integrations",
  timestamps: true,
  underscored: true,
  modelName: "ApiIntegration",
  indexes: [
    {
      name: "idx_platform_service_root_unique",
      unique: true,
      fields: ["platform_name", "service_name", "created_by_root_id"],
    },
    { name: "idx_created_by_root_id", fields: ["created_by_root_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
  ],
})
export class ApiIntegration extends Model<ApiIntegration> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(50),
    field: "platform_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  platformName: string;
  @Column({
    type: DataType.STRING(50),
    field: "service_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  serviceName: string;
  @Column({
    type: DataType.TEXT,
    field: "api_base_url",
    allowNull: false,
    validate: { notEmpty: true, isUrl: true },
  })
  apiBaseUrl: string;
  @Column({ type: DataType.JSON, allowNull: false, defaultValue: {} })
  credentials: Record<string, unknown>;
  @Column({ type: DataType.BOOLEAN, field: "is_active", defaultValue: true })
  isActive: boolean;
  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: "created_by_root_id",
    allowNull: false,
  })
  createdByRootId: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Virtual properties
  isOperational(): boolean {
    return this.isActive;
  }

  // Associations
  @BelongsTo(() => Root, {
    foreignKey: "created_by_root_id",
    as: "createdByRoot",
    onDelete: "CASCADE",
  })
  createdByRoot: Root;
  @HasMany(() => ServiceProvider, {
    foreignKey: "integration_id",
    as: "serviceProviders",
    onDelete: "CASCADE",
  })
  serviceProviders: ServiceProvider[];

  // Static methods
  static async findByPlatformAndService(
    platformName: string,
    serviceName: string,
    rootId: string
  ): Promise<ApiIntegration | null> {
    return this.findOne({
      where: { platformName, serviceName, createdByRootId: rootId },
    });
  }

  static async findActiveByRoot(rootId: string): Promise<ApiIntegration[]> {
    return this.findAll({ where: { createdByRootId: rootId, isActive: true } });
  }

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: ApiIntegration): void {
    instance.updatedAt = new Date();
  }
}

// ========== SYSTEM SETTING ==========
@Table({
  tableName: "system_settings",
  timestamps: true,
  underscored: true,
  modelName: "SystemSetting",
  indexes: [{ name: "idx_root_id", fields: ["root_id"] }],
})
export class SystemSetting extends Model<SystemSetting> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(200),
    field: "company_name",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 200] },
  })
  companyName: string;
  @Column({
    type: DataType.STRING(500),
    field: "company_logo",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  companyLogo: string;
  @Column({
    type: DataType.STRING(500),
    field: "fav_icon",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  favIcon: string;
  @Column({
    type: DataType.STRING(15),
    field: "phone_number",
    allowNull: false,
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;
  @Column({
    type: DataType.STRING(15),
    field: "whatsapp_number",
    allowNull: false,
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  whatsappNumber: string;
  @Column({
    type: DataType.STRING(255),
    field: "company_email",
    allowNull: false,
    validate: { notEmpty: true, isEmail: true },
  })
  companyEmail: string;
  @Column({
    type: DataType.STRING(500),
    field: "facebook_url",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  facebookUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: "instagram_url",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  instagramUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: "twitter_url",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  twitterUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: "linkedin_url",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  linkedinUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: "website_url",
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  websiteUrl: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) settings: Record<
    string,
    unknown
  >;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: "root_id", allowNull: false })
  rootId: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Root, { foreignKey: "root_id", as: "root" }) root: Root;

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: SystemSetting): void {
    instance.updatedAt = new Date();
  }
}

// ========== DEPARTMENT ==========
@Table({
  tableName: "departments",
  timestamps: true,
  underscored: true,
  modelName: "Department",
  indexes: [
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_name_unique", unique: true, fields: ["name"] },
  ],
})
export class Department extends Model<Department> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(50),
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, len: [2, 50] },
  })
  name: string;
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    validate: { len: [0, 1000] },
  })
  description: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @HasMany(() => Employee, {
    foreignKey: "department_id",
    as: "employees",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  employees: Employee[];
  @HasMany(() => DepartmentPermission, {
    foreignKey: "department_id",
    as: "departmentPermissions",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  departmentPermissions: DepartmentPermission[];
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Instance methods
  getCreator(): Root | User | undefined {
    if (this.createdByType === CreatedByType.ROOT) return this.createdByRoot;
    else if (this.createdByType === CreatedByType.ADMIN)
      return this.createdByUser;
    return undefined;
  }

  // Static methods
  static async findByName(name: string): Promise<Department | null> {
    return this.findOne({ where: { name } });
  }

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: Department): void {
    instance.updatedAt = new Date();
  }
}

// ========== DEPARTMENT PERMISSION ==========
@Table({
  tableName: "department_permissions",
  timestamps: true,
  underscored: true,
  modelName: "DepartmentPermission",
  indexes: [
    {
      name: "idx_department_permission_unique",
      unique: true,
      fields: ["department_id", "permission"],
      where: { is_active: true, revoked_at: null },
    },
    { name: "idx_created_by", fields: ["created_by_id", "created_by_type"] },
    { name: "idx_department_id", fields: ["department_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
  ],
})
export class DepartmentPermission extends Model<DepartmentPermission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @ForeignKey(() => Department)
  @Column({ type: DataType.UUID, field: "department_id", allowNull: false })
  departmentId: string;
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  permission: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "assigned_at", allowNull: false })
  assignedAt: Date;
  @Column({ type: DataType.DATE, field: "revoked_at" }) revokedAt: Date | null;
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: "is_active" })
  isActive: boolean;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: "created_by_type",
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: "created_by_id", allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Department, {
    foreignKey: "department_id",
    as: "department",
  })
  department: Department;
  @BelongsTo(() => Root, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByRoot",
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: "created_by_id",
    constraints: false,
    as: "createdByUser",
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Virtual properties
  get isActivePermission(): boolean {
    return this.isActive && !this.revokedAt;
  }

  // Hooks
  @BeforeCreate
  static validateUniquePermission(instance: DepartmentPermission): void {
    if (!instance.permission) throw new Error("Permission is required");
  }

  @BeforeUpdate
  static updateRevokedAt(instance: DepartmentPermission): void {
    if (
      instance.changed("isActive") &&
      !instance.isActive &&
      !instance.revokedAt
    ) {
      instance.revokedAt = new Date();
    }
    instance.updatedAt = new Date();
  }
}

// ========== ADDRESS ==========
@Table({
  tableName: "addresses",
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    { name: "idx_city_id", fields: ["city_id"] },
    { name: "idx_state_id", fields: ["state_id"] },
    { name: "idx_pin_code", fields: ["pin_code"] },
  ],
})
export class Address extends Model<Address> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: { len: [5, 500] },
  })
  address: string;
  @Column({
    type: DataType.STRING(10),
    field: "pin_code",
    allowNull: false,
    validate: { is: /^[0-9]{5,10}$/ },
  })
  pinCode: string;
  @ForeignKey(() => State)
  @Column({ type: DataType.UUID, field: "state_id", allowNull: false })
  stateId: string;
  @ForeignKey(() => City)
  @Column({ type: DataType.UUID, field: "city_id", allowNull: false })
  cityId: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => City, {
    foreignKey: "city_id",
    as: "city",
    constraints: false,
  })
  city: City;
  @BelongsTo(() => State, {
    foreignKey: "state_id",
    as: "state",
    constraints: false,
  })
  state: State;
  @HasMany(() => UserKyc, {
    foreignKey: "address_id",
    as: "userKycs",
    constraints: false,
  })
  userKycs: UserKyc[];
  @HasMany(() => BusinessKyc, {
    foreignKey: "address_id",
    as: "businessKycs",
    constraints: false,
  })
  businessKycs: BusinessKyc[];

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: Address): void {
    instance.updatedAt = new Date();
  }
}

// ========== CITY ==========
@Table({
  tableName: "cities",
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    { name: "idx_city_code", fields: ["city_code"] },
    { name: "idx_city_name", fields: ["city_name"] },
    { name: "idx_state_id", fields: ["state_id"] },
    { name: "idx_country_id", fields: ["country_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
  ],
})
export class City extends Model<City> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(100),
    field: "city_name",
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  })
  cityName: string;
  @Column({
    type: DataType.STRING(10),
    field: "city_code",
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, is: /^[A-Z0-9]{2,10}$/i },
  })
  cityCode: string;
  @Column({ type: DataType.STRING(50), allowNull: true, field: "state_id" })
  stateId: string | null;
  @Column({ type: DataType.STRING(50), allowNull: true, field: "country_id" })
  countryId: string | null;
  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: "is_active" })
  isActive: boolean;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;
  @Column({ type: DataType.DATE, field: "deleted_at", allowNull: true })
  declare deletedAt: Date | null;

  // Associations
  @HasMany(() => Address, {
    foreignKey: "city_id",
    as: "addresses",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  addresses: Address[];

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: City): void {
    instance.updatedAt = new Date();
  }
}

// ========== STATE ==========
@Table({
  tableName: "states",
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    { name: "idx_state_code", fields: ["state_code"] },
    { name: "idx_state_name", fields: ["state_name"] },
    { name: "idx_country_id", fields: ["country_id"] },
    { name: "idx_is_active", fields: ["is_active"] },
  ],
})
export class State extends Model<State> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(100),
    field: "state_name",
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  })
  stateName: string;
  @Column({
    type: DataType.STRING(10),
    field: "state_code",
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, is: /^[A-Z0-9]{2,10}$/i },
  })
  stateCode: string;
  @Column({ type: DataType.STRING(50), field: "country_id", allowNull: false })
  countryId: string;
  @Column({ type: DataType.TEXT, allowNull: true, field: "description" })
  description: string | null;
  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: "is_active" })
  isActive: boolean;
  @Column({ type: DataType.INTEGER, allowNull: true, field: "timezone_offset" })
  timezoneOffset: number | null;
  @Column({ type: DataType.STRING(10), allowNull: true, field: "abbreviation" })
  abbreviation: string | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;
  @Column({ type: DataType.DATE, field: "deleted_at", allowNull: true })
  declare deletedAt: Date | null;

  // Associations
  @HasMany(() => Address, {
    foreignKey: "state_id",
    as: "addresses",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  addresses: Address[];
  @HasMany(() => City, {
    foreignKey: "state_id",
    as: "cities",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  cities: City[];

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: State): void {
    instance.updatedAt = new Date();
  }
}

// ========== IP WHITELIST ==========
@Table({
  tableName: "ip_whitelists",
  timestamps: true,
  underscored: true,
  modelName: "IpWhitelist",
  indexes: [
    { name: "idx_domain_name_unique", unique: true, fields: ["domain_name"] },
    { name: "idx_local_ip_unique", unique: true, fields: ["local_ip"] },
    { name: "idx_user_id", fields: ["user_id"] },
    { name: "idx_root_id", fields: ["root_id"] },
  ],
})
export class IpWhitelist extends Model<IpWhitelist> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(255),
    field: "domain_name",
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  })
  domainName: string;
  @Column({
    type: DataType.STRING(45),
    field: "server_ip",
    allowNull: false,
    validate: { notEmpty: true, isIP: true },
  })
  serverIp: string;
  @Column({
    type: DataType.STRING(45),
    field: "local_ip",
    unique: true,
    allowNull: true,
    validate: { isIP: true },
  })
  localIp: string | null;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "user_id", allowNull: false })
  userId: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: "root_id", allowNull: true })
  rootId: string | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "created_at", allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "updated_at", allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: "user_id", as: "user" }) user: User;
  @BelongsTo(() => Root, { foreignKey: "root_id", as: "root" })
  root: Root | null;

  // Hooks
  @BeforeCreate
  static validateIPAddresses(instance: IpWhitelist): void {
    if (!instance.serverIp) throw new Error("Server IP is required");
    // Validate IP format is handled by Sequelize validation
  }

  @BeforeUpdate
  static updateTimestamp(instance: IpWhitelist): void {
    instance.updatedAt = new Date();
  }
}
