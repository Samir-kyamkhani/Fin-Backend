import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  HasMany,
  Default,
  BeforeUpdate,
} from 'sequelize-typescript';
import { CreatedByType } from '../enums/department.enum';
import { Employee } from 'src/employee/entities/employee.entity';
import { DepartmentPermission } from 'src/common/department-permission/entities/department-permission.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  modelName: 'Department',
  indexes: [
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
    { name: 'idx_name_unique', unique: true, fields: ['name'] },
  ],
})
export class Department extends Model<Department> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
  @Column({
    type: DataType.STRING(50),
    unique: true,
    allowNull: false,
    validate: { notEmpty: true, len: [2, 50] },
  })
  name: string;
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    validate: { len: [0, 1000] },
  })
  description: string | null;
  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: 'created_by_type',
    allowNull: false,
    validate: { isIn: [Object.values(CreatedByType)] },
  })
  createdByType: CreatedByType;
  @Column({ type: DataType.UUID, field: 'created_by_id', allowNull: false })
  createdById: string;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  declare createdAt: Date;
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  declare updatedAt: Date;

  // Associations
  @HasMany(() => Employee, {
    foreignKey: 'department_id',
    as: 'employees',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  employees: Employee[];
  @HasMany(() => DepartmentPermission, {
    foreignKey: 'department_id',
    as: 'departmentPermissions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  departmentPermissions: DepartmentPermission[];
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
    scope: { created_by_type: CreatedByType.ROOT },
  })
  createdByRoot: Root | null;
  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByUser',
    scope: { created_by_type: CreatedByType.ADMIN },
  })
  createdByUser: User | null;

  // Instance methods
  getCreator(): Root | User | null | undefined {
    if (this.createdByType === CreatedByType.ROOT) return this.createdByRoot;
    if (this.createdByType === CreatedByType.ADMIN) return this.createdByUser;
    return undefined;
  }

  // Static methods
  static async findByName(name: string): Promise<Department | null> {
    return this.findOne({ where: { name } });
  }

  // Hooks
  @BeforeUpdate
  static updateTimestamp(instance: Department): void {
    instance.updatedAt = new Date();
  }
}
