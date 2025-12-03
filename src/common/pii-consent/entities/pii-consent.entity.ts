import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';

@Table({
  tableName: 'pii_consents',
  timestamps: false,
  underscored: true,
  modelName: 'PiiConsent',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'pii_type', 'scope'],
    },
    {
      fields: ['user_kyc_id'],
    },
  ],
})
export class PiiConsent extends Model {
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
    allowNull: false,
  })
  userId: string;

  @ForeignKey(() => UserKyc)
  @Column({
    type: DataType.UUID,
    field: 'user_kyc_id',
    allowNull: true,
  })
  userKycId: string;

  @ForeignKey(() => BusinessKyc)
  @Column({
    type: DataType.UUID,
    field: 'business_kyc_id',
    allowNull: true,
  })
  businessKycId: string;

  @Column({
    type: DataType.STRING,
    field: 'pii_type',
    allowNull: false,
  })
  piiType: string;

  @Column({
    type: DataType.STRING,
    field: 'pii_hash',
    allowNull: false,
  })
  piiHash: string;

  @Column({
    type: DataType.DATE,
    field: 'provided_at',
    defaultValue: DataType.NOW,
  })
  providedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'expires_at',
    allowNull: false,
  })
  expiresAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  scope: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  // No updatedAt field since timestamps: false

  // Associations
  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user: User;

  @BelongsTo(() => UserKyc, {
    foreignKey: 'user_kyc_id',
    as: 'userKyc',
  })
  userKyc: UserKyc;

  @BelongsTo(() => BusinessKyc, {
    foreignKey: 'business_kyc_id',
    as: 'businessKyc',
  })
  businessKyc: BusinessKyc;
}
