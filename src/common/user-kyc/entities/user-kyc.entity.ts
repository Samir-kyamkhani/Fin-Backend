import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  BeforeCreate,
  BeforeUpdate,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import {
  RoleType,
  UserGender,
  UserKycStatus,
  UserKycType,
  VerifiedByType,
} from '../enums/user-kyc.enum';
import { Address } from 'src/common/address/entities/address.entity';
import { Root } from 'src/root/entities/root.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';

// ========== USER KYC ==========

@Table({
  tableName: 'user_kyc',
  timestamps: true,
  underscored: true,
  paranoid: true,
  modelName: 'UserKyc',
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_business_kyc_id', fields: ['business_kyc_id'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_verified_by', fields: ['verified_by_id', 'verified_by_type'] },
    { name: 'idx_address_id', fields: ['address_id'] },
    { name: 'idx_role_type', fields: ['role_type'] },
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
    field: 'user_id',
    unique: true,
    allowNull: false,
  })
  userId: string;
  @Column({
    type: DataType.STRING(100),
    field: 'first_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  firstName: string;
  @Column({
    type: DataType.STRING(100),
    field: 'last_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  })
  lastName: string;
  @Column({
    type: DataType.STRING(100),
    field: 'father_name',
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
  @Column({ type: DataType.TEXT, field: 'kyc_rejection_reason' })
  kycRejectionReason: string | null;
  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, field: 'address_id', allowNull: false })
  addressId: string;
  @Column({
    type: DataType.STRING(500),
    field: 'pan_file',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  panFile: string;
  @Column({
    type: DataType.STRING(500),
    field: 'aadhaar_file',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  aadhaarFile: string;
  @Column({
    type: DataType.STRING(500),
    field: 'address_proof_file',
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
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;
  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deletedAt: Date | null;
  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    field: 'verified_by_type',
  })
  verifiedByType: VerifiedByType | null;
  @Column({ type: DataType.UUID, field: 'verified_by_id' }) verifiedById:
    | string
    | null;
  @Column({ type: DataType.DATE, field: 'verified_at' })
  verifiedAt: Date | null;
  @ForeignKey(() => BusinessKyc)
  @Column({ type: DataType.UUID, field: 'business_kyc_id' })
  businessKycId: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(RoleType)),
    field: 'role_type',
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
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' }) user: User;
  @BelongsTo(() => Address, { foreignKey: 'address_id', as: 'address' })
  address: Address;
  @BelongsTo(() => BusinessKyc, {
    foreignKey: 'business_kyc_id',
    as: 'businessKyc',
  })
  businessKyc: BusinessKyc | null;
  @HasMany(() => PiiConsent, { foreignKey: 'user_kyc_id', as: 'piiConsents' })
  piiConsents: PiiConsent[];
  @BelongsTo(() => Root, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByRoot',
  })
  verifiedByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByUser',
  })
  verifiedByUser: User | null;

  // Hooks
  @BeforeCreate
  static validateAge(instance: UserKyc): void {
    const age = instance.age;
    if (age < 18) throw new Error('User must be at least 18 years old for KYC');
    if (age > 120) throw new Error('Invalid date of birth');
  }

  @BeforeUpdate
  static updateTimestamp(instance: UserKyc): void {
    instance.updatedAt = new Date();
  }
}
