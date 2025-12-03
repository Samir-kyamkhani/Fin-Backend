import {
  Table,
  Model,
  Column,
  DataType,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { DepartmentPermission } from 'src/common/department-permission/entities/department-permission.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

// Define enums
export enum CreatedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

@Table({
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  modelName: 'Department',
  indexes: [
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      unique: true,
      fields: ['name'],
    },
  ],
})
export class Department extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50],
    },
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000],
    },
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: 'created_by_type',
    allowNull: false,
    validate: {
      isIn: [Object.values(CreatedByType)],
    },
  })
  createdByType: CreatedByType;

  @Column({
    type: DataType.UUID,
    field: 'created_by_id',
    allowNull: false,
  })
  createdById: string;

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

  // Polymorphic relations
  @BelongsTo(() => Root, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByRoot',
    scope: {
      created_by_type: CreatedByType.ROOT,
    },
  })
  createdByRoot: Root;

  @BelongsTo(() => User, {
    foreignKey: 'created_by_id',
    constraints: false,
    as: 'createdByUser',
    scope: {
      created_by_type: CreatedByType.ADMIN,
    },
  })
  createdByUser: User;

  // Instance methods
  getCreator(): Root | User | undefined {
    if (this.createdByType === CreatedByType.ROOT) {
      return this.createdByRoot;
    } else if (this.createdByType === CreatedByType.ADMIN) {
      return this.createdByUser;
    }
    return undefined;
  }

  // Static methods
  static async findByName(name: string): Promise<Department | null> {
    return this.findOne({ where: { name } });
  }
}
