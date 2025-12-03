import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Root } from 'src/root/entities/root.entity';

@Table({
  tableName: 'system_settings',
  timestamps: true,
  underscored: true,
  modelName: 'SystemSetting',
  indexes: [
    {
      fields: ['root_id'],
    },
  ],
})
export class SystemSetting extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    field: 'company_name',
    allowNull: false,
  })
  companyName: string;

  @Column({
    type: DataType.STRING,
    field: 'company_logo',
    allowNull: false,
  })
  companyLogo: string;

  @Column({
    type: DataType.STRING,
    field: 'fav_icon',
    allowNull: false,
  })
  favIcon: string;

  @Column({
    type: DataType.STRING,
    field: 'phone_number',
    allowNull: false,
  })
  phoneNumber: string;

  @Column({
    type: DataType.STRING,
    field: 'whatsapp_number',
    allowNull: false,
  })
  whatsappNumber: string;

  @Column({
    type: DataType.STRING,
    field: 'company_email',
    allowNull: false,
  })
  companyEmail: string;

  @Column({
    type: DataType.STRING,
    field: 'facebook_url',
    allowNull: false,
  })
  facebookUrl: string;

  @Column({
    type: DataType.STRING,
    field: 'instagram_url',
    allowNull: false,
  })
  instagramUrl: string;

  @Column({
    type: DataType.STRING,
    field: 'twitter_url',
    allowNull: false,
  })
  twitterUrl: string;

  @Column({
    type: DataType.STRING,
    field: 'linkedin_url',
    allowNull: false,
  })
  linkedinUrl: string;

  @Column({
    type: DataType.STRING,
    field: 'website_url',
    allowNull: false,
  })
  websiteUrl: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  settings: Record<string, any>;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'root_id',
    allowNull: false,
  })
  rootId: string;

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
  @BelongsTo(() => Root, {
    foreignKey: 'root_id',
    as: 'root',
  })
  root: Root;
}
