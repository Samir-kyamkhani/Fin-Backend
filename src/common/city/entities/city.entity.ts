import {
  Table,
  Model,
  Column,
  DataType,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { Address } from 'src/common/address/entities/address.entity';

@Table({
  tableName: 'cities',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
@Index(['cityCode'])
@Index(['cityName'])
export class City extends Model<City> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    field: 'city_name',
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  cityName: string;

  @Column({
    type: DataType.STRING(10),
    field: 'city_code',
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[A-Z0-9]{2,10}$/i,
    },
  })
  cityCode: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'state_id',
  })
  stateId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'country_id',
  })
  countryId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  })
  isActive: boolean;

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

  @Column({
    type: DataType.DATE,
    field: 'deleted_at',
    allowNull: true,
  })
  declare deletedAt: Date;

  @HasMany(() => Address, {
    foreignKey: 'city_id',
    as: 'addresses',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  addresses: Address[];
}
