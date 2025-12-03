import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Default,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Address } from 'src/common/address/entities/address.entity';
import { City } from 'src/common/city/entities/city.entity';
@Table({
  tableName: 'states',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    { name: 'idx_state_code', fields: ['state_code'] },
    { name: 'idx_state_name', fields: ['state_name'] },
    { name: 'idx_country_id', fields: ['country_id'] },
    { name: 'idx_is_active', fields: ['is_active'] },
  ],
})
export class State extends Model<State> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(100),
    field: 'state_name',
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  })
  stateName: string;
  @Column({
    type: DataType.STRING(10),
    field: 'state_code',
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, is: /^[A-Z0-9]{2,10}$/i },
  })
  stateCode: string;
  @Column({ type: DataType.STRING(50), field: 'country_id', allowNull: false })
  countryId: string;
  @Column({ type: DataType.TEXT, allowNull: true, field: 'description' })
  description: string | null;
  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: 'is_active' })
  isActive: boolean;
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'timezone_offset' })
  timezoneOffset: number | null;
  @Column({ type: DataType.STRING(10), allowNull: true, field: 'abbreviation' })
  abbreviation: string | null;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;
  @Column({ type: DataType.DATE, field: 'deleted_at', allowNull: true })
  declare deletedAt: Date | null;

  // Associations
  @HasMany(() => Address, {
    foreignKey: 'state_id',
    as: 'addresses',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  addresses: Address[];
  @HasMany(() => City, {
    foreignKey: 'state_id',
    as: 'cities',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  cities: City[];

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: State): void {
    instance.updatedAt = new Date();
  }
}
