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
  BeforeCreate,
  BeforeUpdate,
  Unique,
  BeforeSave,
  AfterCreate,
} from 'sequelize-typescript';
import { BankAccountType, BankDetailStatus } from '../enums/bank-detail.enum';
import { User } from 'src/user/entities/user.entity';
import { Op } from 'sequelize';

@Table({
  tableName: 'bank_details',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_is_primary', fields: ['is_primary'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    {
      name: 'idx_account_number_unique',
      unique: true,
      fields: ['account_number'],
    },
    { name: 'idx_user_is_primary', fields: ['user_id', 'is_primary'] },
  ],
})
export class BankDetail extends Model<BankDetail> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, allowNull: false })
  declare id: string;
  @AllowNull(false)
  @Column({
    field: 'account_holder',
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [2, 100], is: /^[a-zA-Z\s.'-]+$/i },
  })
  accountHolder: string;
  @AllowNull(false)
  @Unique('account_number_unique')
  @Column({
    field: 'account_number',
    type: DataType.STRING(18),
    validate: { notEmpty: true, len: [9, 18], isNumeric: true },
  })
  accountNumber: string;
  @AllowNull(false)
  @Column({
    field: 'phone_number',
    type: DataType.STRING(15),
    validate: { notEmpty: true, is: /^[6-9]\d{9}$/ },
  })
  phoneNumber: string;
  @AllowNull(false)
  @Column({
    field: 'account_type',
    type: DataType.ENUM(...Object.values(BankAccountType)),
    validate: { isIn: [Object.values(BankAccountType)] },
  })
  accountType: BankAccountType;
  @AllowNull(false)
  @Column({
    field: 'ifsc_code',
    type: DataType.STRING(11),
    validate: { notEmpty: true, len: [11, 11], is: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
  })
  ifscCode: string;
  @AllowNull(false)
  @Column({
    field: 'bank_name',
    type: DataType.STRING(100),
    validate: { notEmpty: true, len: [2, 100] },
  })
  bankName: string;
  @Column({ field: 'bank_rejection_reason', type: DataType.TEXT })
  bankRejectionReason: string | null;
  @AllowNull(false)
  @Column({
    field: 'bank_proof_file',
    type: DataType.STRING(500),
    validate: { notEmpty: true, len: [1, 500] },
  })
  bankProofFile: string;
  @Default(BankDetailStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(BankDetailStatus)),
    validate: { isIn: [Object.values(BankDetailStatus)] },
  })
  status: BankDetailStatus;
  @Default(false)
  @Index('idx_is_primary')
  @Column({ field: 'is_primary', type: DataType.BOOLEAN })
  isPrimary: boolean;
  @ForeignKey(() => User)
  @AllowNull(false)
  @Index('idx_user_id')
  @Column({ field: 'user_id', type: DataType.UUID })
  userId: string;
  @Default(DataType.NOW)
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
  @Column({ field: 'deleted_at', type: DataType.DATE })
  declare deletedAt: Date | null;

  // Virtual properties
  get maskedAccountNumber(): string {
    if (!this.accountNumber || this.accountNumber.length < 4) return '****';
    const last4 = this.accountNumber.slice(-4);
    return `****${last4}`;
  }
  get isVerified(): boolean {
    return this.status === BankDetailStatus.VERIFIED;
  }
  get isRejected(): boolean {
    return this.status === BankDetailStatus.REJECTED;
  }
  get isPending(): boolean {
    return this.status === BankDetailStatus.PENDING;
  }
  get bankInfo(): {
    name: string;
    ifsc: string;
    type: BankAccountType;
    maskedAccount: string;
  } {
    return {
      name: this.bankName,
      ifsc: this.ifscCode,
      type: this.accountType,
      maskedAccount: this.maskedAccountNumber,
    };
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' }) user: User;

  // Instance methods
  async markAsPrimary(): Promise<void> {
    await BankDetail.update(
      { isPrimary: false },
      { where: { userId: this.userId, id: { [Op.ne]: this.id } } },
    );
    this.isPrimary = true;
    await this.save();
  }

  async verify(): Promise<void> {
    if (this.isVerified) throw new Error('Bank detail already verified');
    this.status = BankDetailStatus.VERIFIED;
    this.bankRejectionReason = null;
    await this.save();
  }

  async reject(reason: string): Promise<void> {
    if (this.isRejected) throw new Error('Bank detail already rejected');
    this.status = BankDetailStatus.REJECTED;
    this.bankRejectionReason = reason;
    await this.save();
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateAndCleanBankDetails(instance: BankDetail): void {
    if (instance.accountNumber)
      instance.accountNumber = instance.accountNumber.replace(/\s/g, '');
    if (instance.ifscCode)
      instance.ifscCode = instance.ifscCode.toUpperCase().trim();
    if (instance.bankName) instance.bankName = instance.bankName.trim();
    if (instance.accountHolder)
      instance.accountHolder = instance.accountHolder.trim();
    if (instance.phoneNumber)
      instance.phoneNumber = instance.phoneNumber.replace(/\s/g, '');
  }

  @BeforeCreate
  static async validateUniqueAccountNumber(
    instance: BankDetail,
  ): Promise<void> {
    const existing = await BankDetail.findOne({
      where: { accountNumber: instance.accountNumber },
    });
    if (existing) throw new Error('Account number already exists');
  }

  @BeforeSave
  static async validatePrimaryAccount(instance: BankDetail): Promise<void> {
    if (instance.isPrimary && instance.changed('isPrimary')) {
      const existingPrimary = await BankDetail.findOne({
        where: {
          userId: instance.userId,
          isPrimary: true,
          id: { [Op.ne]: instance.id },
        },
      });
      if (existingPrimary) await existingPrimary.update({ isPrimary: false });
    }
  }

  @AfterCreate
  static async setAsPrimaryIfFirst(instance: BankDetail): Promise<void> {
    const count = await BankDetail.count({
      where: { userId: instance.userId },
    });
    if (count === 1) await instance.markAsPrimary();
  }

  @BeforeSave
  static validateStatusChanges(instance: BankDetail): void {
    if (instance.changed('status')) {
      const previousStatus = instance.previous(
        'status',
      ) as BankDetailStatus | null;
      if (previousStatus === BankDetailStatus.VERIFIED)
        throw new Error('Cannot change status of verified bank account');
      if (previousStatus === BankDetailStatus.REJECTED)
        throw new Error('Cannot change status of rejected bank account');
      if (
        instance.status === BankDetailStatus.VERIFIED &&
        !instance.bankProofFile
      )
        throw new Error('Bank proof file is required for verification');
      if (
        instance.status === BankDetailStatus.REJECTED &&
        !instance.bankRejectionReason
      )
        throw new Error(
          'Rejection reason is required when rejecting bank account',
        );
    }
  }
}
