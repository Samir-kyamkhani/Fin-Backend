import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  BeforeUpdate,
  BeforeSave,
  AfterCreate,
  Index,
  Default,
  AllowNull,
  PrimaryKey,
  Unique,
} from 'sequelize-typescript';
import { Op } from 'sequelize';

import { User } from 'src/user/entities/user.entity';
import { BankAccountType, BankDetailStatus } from '../enums/bank-detail.enum';

@Table({
  tableName: 'bank_details',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_primary'],
    },
    {
      fields: ['created_at'],
    },
  ],
})
export class BankDetail extends Model<BankDetail> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    field: 'account_holder',
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  accountHolder: string;

  @AllowNull(false)
  @Unique
  @Column({
    field: 'account_number',
    type: DataType.STRING(18),
    validate: {
      notEmpty: true,
      len: [9, 18],
      isNumeric: true,
    },
  })
  accountNumber: string;

  @AllowNull(false)
  @Column({
    field: 'phone_number',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
      is: /^[6-9]\d{9}$/, // Indian mobile number validation
    },
  })
  phoneNumber: string;

  @AllowNull(false)
  @Column({
    field: 'account_type',
    type: DataType.ENUM(...Object.values(BankAccountType)),
  })
  accountType: BankAccountType;

  @AllowNull(false)
  @Column({
    field: 'ifsc_code',
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [11, 11],
      is: /^[A-Z]{4}0[A-Z0-9]{6}$/, // IFSC code validation
    },
  })
  ifscCode: string;

  @AllowNull(false)
  @Column({
    field: 'bank_name',
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  bankName: string;

  @Column({
    field: 'bank_rejection_reason',
    type: DataType.TEXT,
  })
  bankRejectionReason: string;

  @AllowNull(false)
  @Column({
    field: 'bank_proof_file',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  bankProofFile: string;

  @Default(BankDetailStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(BankDetailStatus)),
  })
  status: BankDetailStatus;

  @Default(false)
  @Index
  @Column({
    field: 'is_primary',
    type: DataType.BOOLEAN,
  })
  isPrimary: boolean;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column({
    field: 'user_id',
    type: DataType.UUID,
  })
  userId: string;

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

  // Virtual properties
  get maskedAccountNumber(): string {
    if (!this.accountNumber || this.accountNumber.length < 4) {
      return '****';
    }
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
  @BelongsTo(() => User)
  user: User;

  // Instance methods
  async markAsPrimary(): Promise<void> {
    // First, unset primary for all other bank accounts of this user
    await BankDetail.update(
      { isPrimary: false },
      {
        where: {
          userId: this.userId,
          id: { [Op.ne]: this.id },
        },
      },
    );

    // Set this as primary
    this.isPrimary = true;
    await this.save();
  }

  async verify(rejectionReason: string): Promise<void> {
    if (this.status === BankDetailStatus.VERIFIED) {
      throw new Error('Bank detail already verified');
    }

    this.status = BankDetailStatus.VERIFIED;
    this.bankRejectionReason = rejectionReason;
    await this.save();
  }

  async reject(reason: string): Promise<void> {
    if (this.status === BankDetailStatus.REJECTED) {
      throw new Error('Bank detail already rejected');
    }

    this.status = BankDetailStatus.REJECTED;
    this.bankRejectionReason = reason;
    await this.save();
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateBankDetails(instance: BankDetail) {
    // Clean and validate account number
    if (instance.accountNumber) {
      instance.accountNumber = instance.accountNumber.replace(/\s/g, ''); // Remove spaces
    }

    // Clean and validate IFSC code
    if (instance.ifscCode) {
      instance.ifscCode = instance.ifscCode.toUpperCase().trim();
    }

    // Clean and validate bank name
    if (instance.bankName) {
      instance.bankName = instance.bankName.trim();
    }

    // Clean and validate account holder name
    if (instance.accountHolder) {
      instance.accountHolder = instance.accountHolder.trim();
    }

    // Clean and validate phone number
    if (instance.phoneNumber) {
      instance.phoneNumber = instance.phoneNumber.replace(/\s/g, '');
    }
  }

  @BeforeCreate
  static async validateUniqueAccountNumber(instance: BankDetail) {
    const existing = await BankDetail.findOne({
      where: { accountNumber: instance.accountNumber },
    });

    if (existing) {
      throw new Error('Account number already exists');
    }
  }

  @BeforeSave
  static async validatePrimaryAccount(instance: BankDetail) {
    if (instance.isPrimary && instance.changed('isPrimary')) {
      // Check if user has any other primary account
      const existingPrimary = await BankDetail.findOne({
        where: {
          userId: instance.userId,
          isPrimary: true,
          id: { [Op.ne]: instance.id },
        },
      });

      if (existingPrimary) {
        // Automatically demote the existing primary account
        await existingPrimary.update({ isPrimary: false });
      }
    }
  }

  @AfterCreate
  static async setAsPrimaryIfFirst(instance: BankDetail) {
    // If this is the first bank account for the user, set it as primary
    const count = await BankDetail.count({
      where: { userId: instance.userId },
    });

    if (count === 1) {
      await instance.markAsPrimary();
    }
  }

  @BeforeSave
  static validateStatusChanges(instance: BankDetail) {
    if (instance.changed('status')) {
      const previousStatus = instance.previous(
        'status',
      ) as BankDetailStatus | null;

      // Only allow status changes from PENDING to VERIFIED or REJECTED
      if (previousStatus === BankDetailStatus.VERIFIED) {
        throw new Error('Cannot change status of verified bank account');
      }

      if (previousStatus === BankDetailStatus.REJECTED) {
        throw new Error('Cannot change status of rejected bank account');
      }

      // If marking as verified, ensure all required fields are present
      if (instance.status === BankDetailStatus.VERIFIED) {
        if (!instance.bankProofFile) {
          throw new Error('Bank proof file is required for verification');
        }
      }

      // If marking as rejected, ensure rejection reason is provided
      if (
        instance.status === BankDetailStatus.REJECTED &&
        !instance.bankRejectionReason
      ) {
        throw new Error(
          'Rejection reason is required when rejecting bank account',
        );
      }
    }
  }
}
