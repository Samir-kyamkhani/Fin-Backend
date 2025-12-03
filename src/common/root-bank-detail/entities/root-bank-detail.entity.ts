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
import {
  RootBankAccountType,
  RootBankDetailStatus,
} from '../enums/root-bank-detail.enums';
import { Root } from 'src/root/entities/root.entity';
import type { RootBankMetadata } from '../interface/root-bank-detail.interface';
import { Op } from 'sequelize';

@Table({
  tableName: 'root_bank_details',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'idx_root_id', fields: ['root_id'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_is_primary', fields: ['is_primary'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    {
      name: 'idx_account_number_unique',
      unique: true,
      fields: ['account_number'],
    },
    { name: 'idx_root_is_primary', fields: ['root_id', 'is_primary'] },
  ],
})
export class RootBankDetail extends Model<RootBankDetail> {
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
  @Unique('idx_account_number_unique')
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
    type: DataType.ENUM(...Object.values(RootBankAccountType)),
    validate: { isIn: [Object.values(RootBankAccountType)] },
  })
  accountType: RootBankAccountType;
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
  @Default(RootBankDetailStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(RootBankDetailStatus)),
    validate: { isIn: [Object.values(RootBankDetailStatus)] },
  })
  status: RootBankDetailStatus;
  @Default(false)
  @Index('idx_is_primary')
  @Column({ field: 'is_primary', type: DataType.BOOLEAN })
  isPrimary: boolean;
  @ForeignKey(() => Root)
  @AllowNull(false)
  @Index('idx_root_id')
  @Column({ field: 'root_id', type: DataType.UUID })
  rootId: string;
  @Default(DataType.NOW)
  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: RootBankMetadata;

  // Virtual properties
  get maskedAccountNumber(): string {
    return !this.accountNumber || this.accountNumber.length < 4
      ? '****'
      : `****${this.accountNumber.slice(-4)}`;
  }
  get isVerified(): boolean {
    return this.status === RootBankDetailStatus.VERIFIED;
  }
  get isRejected(): boolean {
    return this.status === RootBankDetailStatus.REJECTED;
  }
  get isPending(): boolean {
    return this.status === RootBankDetailStatus.PENDING;
  }
  get bankInfo(): {
    name: string;
    ifsc: string;
    type: RootBankAccountType;
    maskedAccount: string;
    holder: string;
  } {
    return {
      name: this.bankName,
      ifsc: this.ifscCode,
      type: this.accountType,
      maskedAccount: this.maskedAccountNumber,
      holder: this.accountHolder,
    };
  }

  // Associations
  @BelongsTo(() => Root, { foreignKey: 'rootId', as: 'root' }) root: Root;

  // Instance methods
  async markAsPrimary(): Promise<void> {
    await RootBankDetail.update(
      { isPrimary: false },
      { where: { rootId: this.rootId, id: { [Op.ne]: this.id } } },
    );
    this.isPrimary = true;
    await this.save();
  }

  async verify(
    verifiedBy?: string,
    verifiedById?: string,
    notes?: string,
  ): Promise<void> {
    if (this.isVerified) throw new Error('Bank detail already verified');
    this.status = RootBankDetailStatus.VERIFIED;
    this.bankRejectionReason = null;
    this.metadata = {
      ...this.metadata,
      verifiedBy,
      verifiedById,
      verifiedAt: new Date(),
      verificationReason: notes,
    };
    await this.save();
  }

  async reject(
    reason: string,
    rejectedBy?: string,
    rejectedById?: string,
  ): Promise<void> {
    if (this.isRejected) throw new Error('Bank detail already rejected');
    this.status = RootBankDetailStatus.REJECTED;
    this.bankRejectionReason = reason;
    this.metadata = {
      ...this.metadata,
      rejectedBy,
      rejectedById,
      rejectedAt: new Date(),
      rejectionReason: reason,
    };
    await this.save();
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateAndCleanBankDetails(instance: RootBankDetail): void {
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
    instance: RootBankDetail,
  ): Promise<void> {
    const existing = await RootBankDetail.findOne({
      where: { accountNumber: instance.accountNumber },
    });
    if (existing) throw new Error('Account number already exists');
  }

  @BeforeSave
  static async validatePrimaryAccount(instance: RootBankDetail): Promise<void> {
    if (instance.isPrimary && instance.changed('isPrimary')) {
      const existingPrimary = await RootBankDetail.findOne({
        where: {
          rootId: instance.rootId,
          isPrimary: true,
          id: { [Op.ne]: instance.id },
        },
      });
      if (existingPrimary) await existingPrimary.update({ isPrimary: false });
    }
  }

  @AfterCreate
  static async setAsPrimaryIfFirst(instance: RootBankDetail): Promise<void> {
    const count = await RootBankDetail.count({
      where: { rootId: instance.rootId },
    });
    if (count === 1) await instance.markAsPrimary();
  }

  @BeforeSave
  static validateStatusChanges(instance: RootBankDetail): void {
    if (instance.changed('status')) {
      const previousStatus = instance.previous(
        'status',
      ) as RootBankDetailStatus | null;
      if (previousStatus === RootBankDetailStatus.VERIFIED)
        throw new Error('Cannot change status of verified bank account');
      if (previousStatus === RootBankDetailStatus.REJECTED)
        throw new Error('Cannot change status of rejected bank account');
      if (
        instance.status === RootBankDetailStatus.VERIFIED &&
        !instance.bankProofFile
      )
        throw new Error('Bank proof file is required for verification');
      if (
        instance.status === RootBankDetailStatus.REJECTED &&
        !instance.bankRejectionReason
      )
        throw new Error(
          'Rejection reason is required when rejecting bank account',
        );
    }
  }

  @BeforeSave
  static async validateRoot(instance: RootBankDetail): Promise<void> {
    const root = await Root.findByPk(instance.rootId);
    if (!root) throw new Error(`Root with ID ${instance.rootId} not found`);
    if (!root.isActive)
      throw new Error('Cannot add bank account for inactive root');
  }
}
