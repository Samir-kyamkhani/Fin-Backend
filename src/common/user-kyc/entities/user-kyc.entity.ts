import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  DeletedAt,
} from 'sequelize-typescript';
import { Address } from 'src/common/address/entities/address.entity';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import {
  RoleType,
  UserGender,
  UserKycStatus,
  UserKycType,
  VerifiedByType,
} from '../enums/user-kyc.enum';

@Table({
  tableName: 'user_kyc',
  timestamps: true,
  underscored: true,
  paranoid: true,
  modelName: 'UserKyc',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['business_kyc_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['verified_by_id', 'verified_by_type'],
    },
  ],
})
export class UserKyc extends Model {
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
    type: DataType.STRING,
    field: 'first_name',
    allowNull: false,
  })
  firstName: string;

  @Column({
    type: DataType.STRING,
    field: 'last_name',
    allowNull: false,
  })
  lastName: string;

  @Column({
    type: DataType.STRING,
    field: 'father_name',
    allowNull: false,
  })
  fatherName: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  dob: Date;

  @Column({
    type: DataType.ENUM(...Object.values(UserGender)),
    allowNull: false,
  })
  gender: UserGender;

  @Column({
    type: DataType.ENUM(...Object.values(UserKycStatus)),
    defaultValue: UserKycStatus.PENDING,
  })
  status: UserKycStatus;

  @Column({
    type: DataType.ENUM(...Object.values(UserKycType)),
    defaultValue: UserKycType.USER_KYC,
  })
  type: UserKycType;

  @Column({
    type: DataType.TEXT,
    field: 'kyc_rejection_reason',
    allowNull: true,
  })
  kycRejectionReason: string;

  @ForeignKey(() => Address)
  @Column({
    type: DataType.UUID,
    field: 'address_id',
    allowNull: false,
  })
  addressId: string;

  @Column({
    type: DataType.STRING,
    field: 'pan_file',
    allowNull: false,
  })
  panFile: string;

  @Column({
    type: DataType.STRING,
    field: 'aadhaar_file',
    allowNull: false,
  })
  aadhaarFile: string;

  @Column({
    type: DataType.STRING,
    field: 'address_proof_file',
    allowNull: false,
  })
  addressProofFile: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  photo: string;

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

  @DeletedAt
  @Column({
    type: DataType.DATE,
    field: 'deleted_at',
    allowNull: true,
  })
  declare deletedAt: Date;

  @Column({
    type: DataType.ENUM(...Object.values(VerifiedByType)),
    field: 'verified_by_type',
    allowNull: true,
  })
  verifiedByType: VerifiedByType;

  @Column({
    type: DataType.UUID,
    field: 'verified_by_id',
    allowNull: true,
  })
  verifiedById: string;

  @Column({
    type: DataType.DATE,
    field: 'verified_at',
    allowNull: true,
  })
  verifiedAt: Date;

  @ForeignKey(() => BusinessKyc)
  @Column({
    type: DataType.UUID,
    field: 'business_kyc_id',
    allowNull: true,
  })
  businessKycId: string;

  @Column({
    type: DataType.ENUM(...Object.values(RoleType)),
    field: 'role_type',
    defaultValue: RoleType.PROPRIETOR,
  })
  roleType: RoleType;

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

  @BelongsTo(() => BusinessKyc, {
    foreignKey: 'business_kyc_id',
    as: 'businessKyc',
  })
  businessKyc: BusinessKyc;

  @HasMany(() => PiiConsent, {
    foreignKey: 'user_kyc_id',
    as: 'piiConsents',
  })
  piiConsents: PiiConsent[];

  // Polymorphic relations
  @BelongsTo(() => Root, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByRoot',
  })
  verifiedByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'verified_by_id',
    constraints: false,
    as: 'verifiedByUser',
  })
  verifiedByUser: User;
}
