import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
@Table({
  tableName: 'ip_whitelists',
  timestamps: true,
  underscored: true,
  modelName: 'IpWhitelist',
  indexes: [
    { name: 'idx_domain_name_unique', unique: true, fields: ['domain_name'] },
    { name: 'idx_local_ip_unique', unique: true, fields: ['local_ip'] },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_root_id', fields: ['root_id'] },
  ],
})
export class IpWhitelist extends Model<IpWhitelist> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(255),
    field: 'domain_name',
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  })
  domainName: string;
  @Column({
    type: DataType.STRING(45),
    field: 'server_ip',
    allowNull: false,
    validate: { notEmpty: true, isIP: true },
  })
  serverIp: string;
  @Column({
    type: DataType.STRING(45),
    field: 'local_ip',
    unique: true,
    allowNull: true,
    validate: { isIP: true },
  })
  localIp: string | null;
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id', allowNull: false })
  userId: string;
  @ForeignKey(() => Root)
  @Column({ type: DataType.UUID, field: 'root_id', allowNull: true })
  rootId: string | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' }) user: User;
  @BelongsTo(() => Root, { foreignKey: 'root_id', as: 'root' })
  root: Root | null;

  // Hooks
  @BeforeCreate
  static validateIPAddresses(instance: IpWhitelist): void {
    if (!instance.serverIp) throw new Error('Server IP is required');
    // Validate IP format is handled by Sequelize validation
  }

  @BeforeUpdate
  static updateTimestamp(instance: IpWhitelist): void {
    instance.updatedAt = new Date();
  }
}
