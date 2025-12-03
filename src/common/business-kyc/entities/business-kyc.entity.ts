import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeSave,
} from 'sequelize-typescript';
import { Address } from 'src/common/address/entities/address.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BusinessType,
  KycStatus,
  VerifiedByType,
} from '../enums/business-kyc.enum';

@Table({
  tableName: 'business_kycs',
  timestamps: true,
  underscored: true,
  modelName: 'BusinessKyc',
  indexes: [
    {
      name: 'business_kycs_user_id_unique',
      unique: true,
      fields: ['user_id'],
    },
    {
      name: 'idx_user_status',
      fields: ['user_id', 'status'],
    },
    {
      name: 'idx_verified_by',
      fields: ['verified_by_id'],
    },
    {
      name: 'idx_pan_number',
      fields: ['pan_number'],
    },
    {
      name: 'idx_gst_number',
      fields: ['gst_number'],
    },
    {
      name: 'idx_business_type',
      fields: ['business_type'],
    },
  ],
})
export class BusinessKyc extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'business_name',
  })
  businessName: string;

  @Column({
    type: DataType.ENUM(...Object.values(BusinessType)),
    allowNull: false,
    field: 'business_type',
  })
  businessType: BusinessType;

  @Column({
    type: DataType.ENUM(...Object.values(KycStatus)),
    defaultValue: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({
    type: DataType.TEXT,
    field: 'rejection_reason',
  })
  rejectionReason: string;

  @ForeignKey(() => Address)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'address_id',
  })
  addressId: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    field: 'pan_number',
  })
  panNumber: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: 'gst_number',
  })
  gstNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'pan_file',
  })
  panFile: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'gst_file',
  })
  gstFile: string;

  @Column({
    type: DataType.STRING,
    field: 'udhyam_aadhar',
  })
  udhyamAadhar: string;

  @Column({
    type: DataType.STRING,
    field: 'br_doc',
  })
  brDoc: string;

  @Column({
    type: DataType.STRING,
    field: 'partnership_deed',
  })
  partnershipDeed: string;

  @Column({
    type: DataType.INTEGER,
    field: 'partner_kyc_numbers',
    validate: { min: 1, max: 20 },
  })
  partnerKycNumbers: number;

  @Column({
    type: DataType.STRING,
    field: 'cin',
  })
  cin: string;

  @Column({
    type: DataType.STRING,
    field: 'moa_file',
  })
  moaFile: string;

  @Column({
    type: DataType.STRING,
    field: 'aoa_file',
  })
  aoaFile: string;

  @Column({
    type: DataType.INTEGER,
    field: 'authorized_member_count',
    validate: {
      min: 1,
      max: 20,
    },
  })
  authorizedMemberCount: number;

  @Column({
    type: DataType.STRING,
    field: 'director_shareholding_file',
  })
  directorShareholding: string;

  // Polymorphic verified fields
  @Column({
    type: DataType.UUID,
    field: 'verified_by_id',
  })
  verifiedById: string;

  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    allowNull: true,
    field: 'verified_by_type',
  })
  verifiedByType: VerifiedByType;

  @Column({
    type: DataType.DATE,
    field: 'verified_at',
  })
  verifiedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user: User;

  @BelongsTo(() => Address, {
    foreignKey: 'address_id',
    as: 'address',
  })
  address: Address;

  @HasMany(() => UserKyc, {
    foreignKey: 'business_kyc_id',
    as: 'userKycs',
  })
  userKycs: UserKyc[];

  @HasMany(() => PiiConsent, {
    foreignKey: 'business_kyc_id',
    as: 'piiConsents',
  })
  piiConsents: PiiConsent[];

  // Polymorphic relations
  @BelongsTo(() => Root, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByRoot',
    scope: { verified_by_type: VerifiedByType.ROOT },
  })
  verifiedByRoot: Root;

  @BelongsTo(() => Employee, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByEmployee',
    scope: { verified_by_type: VerifiedByType.EMPLOYEE },
  })
  verifiedByEmployee: Employee;

  @BeforeSave
  static setAuthorizedMemberCount(businessKyc: BusinessKyc): void {
    // Handle the authorized member count based on business type
    if (businessKyc.businessType === BusinessType.PROPRIETORSHIP) {
      businessKyc.authorizedMemberCount = 1;
    }

    // Additional validation for partnership
    if (
      businessKyc.businessType === BusinessType.PARTNERSHIP &&
      businessKyc.authorizedMemberCount < 2
    ) {
      throw new Error('Partnership requires minimum 2 authorized members');
    }
  }
}
