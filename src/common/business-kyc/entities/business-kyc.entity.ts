import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  BeforeUpdate,
  BeforeSave,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import {
  BusinessType,
  KycStatus,
  VerifiedByType,
} from '../enums/business-kyc.enum';
import { Address } from 'src/common/address/entities/address.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';
import { Root } from 'src/root/entities/root.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';

// ========== BUSINESS KYC ==========

@Table({
  tableName: 'business_kycs',
  timestamps: true,
  underscored: true,
  modelName: 'BusinessKyc',
  indexes: [
    { name: 'business_kycs_user_id_unique', unique: true, fields: ['user_id'] },
    { name: 'idx_user_status', fields: ['user_id', 'status'] },
    { name: 'idx_verified_by', fields: ['verified_by_id'] },
    { name: 'idx_pan_number', fields: ['pan_number'] },
    { name: 'idx_gst_number', fields: ['gst_number'] },
    { name: 'idx_business_type', fields: ['business_type'] },
    { name: 'idx_address_id', fields: ['address_id'] },
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
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  userId: string;
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    field: 'business_name',
    validate: { notEmpty: true, len: [1, 200] },
  })
  businessName: string;
  @Column({
    type: DataType.ENUM(...Object.values(BusinessType)),
    allowNull: false,
    field: 'business_type',
    validate: { isIn: [Object.values(BusinessType)] },
  })
  businessType: BusinessType;
  @Column({
    type: DataType.ENUM(...Object.values(KycStatus)),
    defaultValue: KycStatus.PENDING,
    validate: { isIn: [Object.values(KycStatus)] },
  })
  status: KycStatus;
  @Column({ type: DataType.TEXT, field: 'rejection_reason' }) rejectionReason:
    | string
    | null;
  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, allowNull: false, field: 'address_id' })
  addressId: string;
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    field: 'pan_number',
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
    field: 'gst_number',
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
    field: 'pan_file',
    validate: { notEmpty: true, len: [1, 500] },
  })
  panFile: string;
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    field: 'gst_file',
    validate: { notEmpty: true, len: [1, 500] },
  })
  gstFile: string;
  @Column({
    type: DataType.STRING(20),
    field: 'udhyam_aadhar',
    validate: { len: [0, 20] },
  })
  udhyamAadhar: string | null;
  @Column({
    type: DataType.STRING(500),
    field: 'br_doc',
    validate: { len: [0, 500] },
  })
  brDoc: string | null;
  @Column({
    type: DataType.STRING(500),
    field: 'partnership_deed',
    validate: { len: [0, 500] },
  })
  partnershipDeed: string | null;
  @Column({
    type: DataType.INTEGER,
    field: 'partner_kyc_numbers',
    validate: { min: 1, max: 20 },
  })
  partnerKycNumbers: number | null;
  @Column({
    type: DataType.STRING(25),
    field: 'cin',
    validate: { len: [0, 25] },
  })
  cin: string | null;
  @Column({
    type: DataType.STRING(500),
    field: 'moa_file',
    validate: { len: [0, 500] },
  })
  moaFile: string | null;
  @Column({
    type: DataType.STRING(500),
    field: 'aoa_file',
    validate: { len: [0, 500] },
  })
  aoaFile: string | null;
  @Column({
    type: DataType.INTEGER,
    field: 'authorized_member_count',
    validate: { min: 1, max: 20 },
  })
  authorizedMemberCount: number;
  @Column({
    type: DataType.STRING(500),
    field: 'director_shareholding_file',
    validate: { len: [0, 500] },
  })
  directorShareholding: string | null;
  @Column({ type: DataType.UUID, field: 'verified_by_id' }) verifiedById:
    | string
    | null;
  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    field: 'verified_by_type',
  })
  verifiedByType: VerifiedByType | null;
  @Column({ type: DataType.DATE, field: 'verified_at' })
  verifiedAt: Date | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
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
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' }) user: User;
  @BelongsTo(() => Address, { foreignKey: 'address_id', as: 'address' })
  address: Address;
  @HasMany(() => UserKyc, { foreignKey: 'business_kyc_id', as: 'userKycs' })
  userKycs: UserKyc[];
  @HasMany(() => PiiConsent, {
    foreignKey: 'business_kyc_id',
    as: 'piiConsents',
  })
  piiConsents: PiiConsent[];
  @BelongsTo(() => Root, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByRoot',
    scope: { verified_by_type: VerifiedByType.ROOT },
  })
  verifiedByRoot: Root | null;
  @BelongsTo(() => Employee, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByEmployee',
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
      throw new Error('Partnership requires minimum 2 authorized members');
    }
  }

  @BeforeUpdate
  static updateTimestamp(instance: BusinessKyc): void {
    instance.updatedAt = new Date();
  }
}
