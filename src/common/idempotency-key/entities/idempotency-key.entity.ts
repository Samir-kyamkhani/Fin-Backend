import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'idempotency_keys',
  timestamps: false,
  underscored: true,
  modelName: 'IdempotencyKey',
})
export class IdempotencyKey extends Model {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  declare key: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'user_id',
    allowNull: true,
  })
  userId: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'expired_at',
    allowNull: false,
  })
  expiresAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  used: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  meta: Record<string, any>;
}
