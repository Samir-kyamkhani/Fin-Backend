import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Department } from 'src/common/department/entities/department.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { CreatedByType } from '../enums/department-permission.enum';

@Table({
  tableName: 'department_permissions',
  timestamps: true,
  underscored: true,
  modelName: 'DepartmentPermission',
  indexes: [
    {
      unique: true,
      fields: ['department_id', 'permission'],
      where: {
        is_active: true,
        revoked_at: null,
      },
    },
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      fields: ['department_id'],
    },
    {
      fields: ['is_active'],
    },
  ],
})
export class DepartmentPermission extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.UUID,
    field: 'department_id',
    allowNull: false,
  })
  departmentId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  permission: string;

  @Column({
    type: DataType.DATE,
    field: 'assigned_at',
    defaultValue: DataType.NOW,
  })
  assignedAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'revoked_at',
    allowNull: true,
  })
  revokedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(CreatedByType)),
    field: 'created_by_type',
    allowNull: false,
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
  @BelongsTo(() => Department, {
    foreignKey: 'department_id',
    as: 'department',
  })
  department: Department;

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
}
