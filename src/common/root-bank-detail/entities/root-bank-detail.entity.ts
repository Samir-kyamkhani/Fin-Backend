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

import { Root } from 'src/root/entities/root.entity';
import type { IRootBankMetadata } from '../interface/root-bank-detail.interface';
import {
  RootBankAccountType,
  RootBankDetailStatus,
} from '../enums/root-bank-detail.enums';
import { Op } from 'sequelize';

@Table({
  tableName: 'root_bank_details',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['root_id'],
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
    {
      unique: true,
      fields: ['account_number'],
    },
  ],
})
export class RootBankDetail extends Model<RootBankDetail> {
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
      is: /^[6-9]\d{9}$/,
    },
  })
  phoneNumber: string;

  @AllowNull(false)
  @Column({
    field: 'account_type',
    type: DataType.ENUM(...Object.values(RootBankAccountType)),
  })
  accountType: RootBankAccountType;

  @AllowNull(false)
  @Column({
    field: 'ifsc_code',
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [11, 11],
      is: /^[A-Z]{4}0[A-Z0-9]{6}$/,
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

  @AllowNull(true)
  @Column({
    field: 'bank_rejection_reason',
    type: DataType.TEXT,
  })
  bankRejectionReason: string | null;

  @AllowNull(false)
  @Column({
    field: 'bank_proof_file',
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  bankProofFile: string;

  @Default(RootBankDetailStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(RootBankDetailStatus)),
  })
  status: RootBankDetailStatus;

  @Default(false)
  @Index
  @Column({
    field: 'is_primary',
    type: DataType.BOOLEAN,
  })
  isPrimary: boolean;

  @ForeignKey(() => Root)
  @AllowNull(false)
  @Index
  @Column({
    field: 'root_id',
    type: DataType.UUID,
  })
  rootId: string;

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
    type: DataType.JSON,
  })
  metadata: IRootBankMetadata;

  // Virtual properties
  get maskedAccountNumber(): string {
    if (!this.accountNumber || this.accountNumber.length < 4) {
      return '****';
    }
    const last4 = this.accountNumber.slice(-4);
    return `****${last4}`;
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
  @BelongsTo(() => Root)
  root: Root;

  // Instance methods
  async markAsPrimary(): Promise<void> {
    // First, unset primary for all other bank accounts of this root
    await RootBankDetail.update(
      { isPrimary: false },
      {
        where: {
          rootId: this.rootId,
          id: { [Op.ne]: this.id },
        },
      },
    );

    // Set this as primary
    this.isPrimary = true;
    await this.save();
  }

  async verify(
    verifiedBy?: string,
    verifiedById?: string,
    notes?: string,
  ): Promise<void> {
    if (this.isVerified) {
      throw new Error('Bank detail already verified');
    }

    this.status = RootBankDetailStatus.VERIFIED;
    this.bankRejectionReason = null;

    // Update metadata
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
    if (this.isRejected) {
      throw new Error('Bank detail already rejected');
    }

    this.status = RootBankDetailStatus.REJECTED;
    this.bankRejectionReason = reason;

    // Update metadata
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
  static validateBankDetails(instance: RootBankDetail) {
    // Clean and validate account number
    if (instance.accountNumber) {
      instance.accountNumber = instance.accountNumber.replace(/\s/g, '');
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
  static async validateUniqueAccountNumber(instance: RootBankDetail) {
    const existing = await RootBankDetail.findOne({
      where: { accountNumber: instance.accountNumber },
    });

    if (existing) {
      throw new Error('Account number already exists');
    }
  }

  @BeforeSave
  static async validatePrimaryAccount(instance: RootBankDetail) {
    if (instance.isPrimary && instance.changed('isPrimary')) {
      // Check if root has any other primary account
      const existingPrimary = await RootBankDetail.findOne({
        where: {
          rootId: instance.rootId,
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
  static async setAsPrimaryIfFirst(instance: RootBankDetail) {
    // If this is the first bank account for the root, set it as primary
    const count = await RootBankDetail.count({
      where: { rootId: instance.rootId },
    });

    if (count === 1) {
      await instance.markAsPrimary();
    }
  }

  @BeforeSave
  static validateStatusChanges(instance: RootBankDetail) {
    if (instance.changed('status')) {
      const previousStatus = instance.previous(
        'status',
      ) as RootBankDetailStatus | null;

      // Only allow status changes from PENDING to VERIFIED or REJECTED
      if (previousStatus === RootBankDetailStatus.VERIFIED) {
        throw new Error('Cannot change status of verified bank account');
      }

      if (previousStatus === RootBankDetailStatus.REJECTED) {
        throw new Error('Cannot change status of rejected bank account');
      }

      // If marking as verified, ensure all required fields are present
      if (instance.status === RootBankDetailStatus.VERIFIED) {
        if (!instance.bankProofFile) {
          throw new Error('Bank proof file is required for verification');
        }
      }

      // If marking as rejected, ensure rejection reason is provided
      if (
        instance.status === RootBankDetailStatus.REJECTED &&
        !instance.bankRejectionReason
      ) {
        throw new Error(
          'Rejection reason is required when rejecting bank account',
        );
      }
    }
  }

  @BeforeSave
  static async validateRoot(instance: RootBankDetail) {
    // Verify root exists
    const root = await Root.findByPk(instance.rootId);
    if (!root) {
      throw new Error(`Root with ID ${instance.rootId} not found`);
    }

    // Only active roots can have bank accounts
    if (!root.isActive) {
      throw new Error('Cannot add bank account for inactive root');
    }
  }
}
