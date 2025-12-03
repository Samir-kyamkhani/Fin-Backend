import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';

@Table({
  tableName: 'ip_whitelists',
  timestamps: true,
  underscored: true,
  modelName: 'IpWhitelist',
})
export class IpWhitelist extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    field: 'domain_name',
    unique: true,
    allowNull: false,
  })
  domainName: string;

  @Column({
    type: DataType.STRING,
    field: 'server_ip',
    allowNull: false,
  })
  serverIp: string;

  @Column({
    type: DataType.STRING,
    field: 'local_ip',
    unique: true,
    allowNull: true,
  })
  localIp: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: false,
  })
  userId: string;

  @ForeignKey(() => Root)
  @Column({
    type: DataType.UUID,
    field: 'root_id',
    allowNull: true,
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
  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user: User;

  @BelongsTo(() => Root, {
    foreignKey: 'root_id',
    as: 'root',
  })
  root: Root;
}
