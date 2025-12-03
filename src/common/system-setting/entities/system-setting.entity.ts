import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Root } from 'src/root/entities/root.entity';
@Table({
  tableName: 'system_settings',
  timestamps: true,
  underscored: true,
  modelName: 'SystemSetting',
  indexes: [{ name: 'idx_root_id', fields: ['root_id'] }],
})
export class SystemSetting extends Model<SystemSetting> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(200),
    field: 'company_name',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 200] },
  })
  companyName: string;
  @Column({
    type: DataType.STRING(500),
    field: 'company_logo',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  companyLogo: string;
  @Column({
    type: DataType.STRING(500),
    field: 'fav_icon',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  favIcon: string;
  @Column({
    type: DataType.STRING(15),
    field: 'phone_number',
    allowNull: false,
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  phoneNumber: string;
  @Column({
    type: DataType.STRING(15),
    field: 'whatsapp_number',
    allowNull: false,
    validate: { notEmpty: true, is: /^[0-9]{10,15}$/ },
  })
  whatsappNumber: string;
  @Column({
    type: DataType.STRING(255),
    field: 'company_email',
    allowNull: false,
    validate: { notEmpty: true, isEmail: true },
  })
  companyEmail: string;
  @Column({
    type: DataType.STRING(500),
    field: 'facebook_url',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  facebookUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: 'instagram_url',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  instagramUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: 'twitter_url',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  twitterUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: 'linkedin_url',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  linkedinUrl: string;
  @Column({
    type: DataType.STRING(500),
    field: 'website_url',
    allowNull: false,
    validate: { notEmpty: true, len: [1, 500] },
  })
  websiteUrl: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) settings: Record<
    string,
    unknown
  >;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: 'root_id', allowNull: false })
  rootId: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Root, { foreignKey: 'root_id', as: 'root' }) root: Root;

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: SystemSetting): void {
    instance.updatedAt = new Date();
  }
}
