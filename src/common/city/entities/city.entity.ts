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

@Table({
  tableName: 'cities',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    { name: 'idx_city_code', fields: ['city_code'] },
    { name: 'idx_city_name', fields: ['city_name'] },
    { name: 'idx_state_id', fields: ['state_id'] },
    { name: 'idx_country_id', fields: ['country_id'] },
    { name: 'idx_is_active', fields: ['is_active'] },
  ],
})
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
    validate: { notEmpty: true, len: [2, 100] },
  })
  cityName: string;
  @Column({
    type: DataType.STRING(10),
    field: 'city_code',
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, is: /^[A-Z0-9]{2,10}$/i },
  })
  cityCode: string;
  @Column({ type: DataType.STRING(50), allowNull: true, field: 'state_id' })
  stateId: string | null;
  @Column({ type: DataType.STRING(50), allowNull: true, field: 'country_id' })
  countryId: string | null;
  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: 'is_active' })
  isActive: boolean;
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
    foreignKey: 'city_id',
    as: 'addresses',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  addresses: Address[];

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: City): void {
    instance.updatedAt = new Date();
  }
}
