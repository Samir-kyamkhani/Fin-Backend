import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';
import { City } from 'src/common/city/entities/city.entity';
import { State } from 'src/common/state/entities/state.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';

@Table({
  tableName: 'addresses',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
@Index(['cityId'])
@Index(['stateId'])
@Index(['pinCode'])
export class Address extends Model<Address> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      len: [5, 500],
    },
  })
  address: string;

  @Column({
    type: DataType.STRING(10),
    field: 'pin_code',
    allowNull: false,
    validate: {
      is: /^[0-9]{5,10}$/,
    },
  })
  pinCode: string;

  @ForeignKey(() => State)
  @Column({
    type: DataType.UUID,
    field: 'state_id',
    allowNull: false,
  })
  stateId: string;

  @ForeignKey(() => City)
  @Column({
    type: DataType.UUID,
    field: 'city_id',
    allowNull: false,
  })
  cityId: string;

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
  @BelongsTo(() => City, {
    foreignKey: 'city_id',
    as: 'city',
    constraints: false,
  })
  city: City;

  @BelongsTo(() => State, {
    foreignKey: 'state_id',
    as: 'state',
    constraints: false,
  })
  state: State;

  @HasMany(() => UserKyc, {
    foreignKey: 'address_id',
    as: 'userKycs',
    constraints: false,
  })
  userKycs: UserKyc[];

  @HasMany(() => BusinessKyc, {
    foreignKey: 'address_id',
    as: 'businessKycs',
    constraints: false,
  })
  businessKycs: BusinessKyc[];
}
