import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  Default,
} from 'sequelize-typescript';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';
import { User } from 'src/user/entities/user.entity';

// ========== PII CONSENT ==========
@Table({
  tableName: 'pii_consents',
  timestamps: false,
  underscored: true,
  modelName: 'PiiConsent',
  indexes: [
    {
      name: 'idx_user_pii_type_scope_unique',
      unique: true,
      fields: ['user_id', 'pii_type', 'scope'],
    },
    { name: 'idx_user_kyc_id', fields: ['user_kyc_id'] },
    { name: 'idx_business_kyc_id', fields: ['business_kyc_id'] },
    { name: 'idx_expires_at', fields: ['expires_at'] },
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
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: false })
  userId: string;
  @ForeignKey(() => UserKyc)
  @Column({ type: DataType.UUID, field: 'user_kyc_id', allowNull: true })
  userKycId: string | null;
  @ForeignKey(() => BusinessKyc)
  @Column({ type: DataType.UUID, field: 'business_kyc_id', allowNull: true })
  businessKycId: string | null;
  @Column({
    type: DataType.STRING(50),
    field: 'pii_type',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  piiType: string;
  @Column({
    type: DataType.STRING(64),
    field: 'pii_hash',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 64] },
  })
  piiHash: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'provided_at', allowNull: false })
  providedAt: Date;
  @Column({ type: DataType.DATE, field: 'expires_at', allowNull: false })
  expiresAt: Date;
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  })
  scope: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }
  get isValid(): boolean {
    return !this.isExpired;
  }

  // Associations
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' }) user: User;
  @BelongsTo(() => UserKyc, { foreignKey: 'user_kyc_id', as: 'userKyc' })
  userKyc: UserKyc | null;
  @BelongsTo(() => BusinessKyc, {
    foreignKey: 'business_kyc_id',
    as: 'businessKyc',
  })
  businessKyc: BusinessKyc | null;

  // Hooks
  @BeforeCreate
  static validateExpiry(instance: PiiConsent): void {
    if (!instance.expiresAt)
      throw new Error('Expiry date is required for PII consent');
    if (instance.expiresAt <= new Date())
      throw new Error('PII consent expiry must be in the future');
  }
}
