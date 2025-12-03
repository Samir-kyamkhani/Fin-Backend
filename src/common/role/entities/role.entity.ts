import {
  Table,
  Model,
  Column,
  DataType,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { RolePermission } from 'src/common/role-permission/entities/role-permission.entity';
import { CommissionSetting } from 'src/common/commission-setting/entities/commission-setting.entity';

// Define enums
export enum CreatedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

@Table({
  tableName: 'roles',
  timestamps: true,
  underscored: true,
  modelName: 'Role',
  indexes: [
    {
      fields: ['created_by_id', 'created_by_type'],
    },
    {
      unique: true,
      fields: ['name'],
    },
    {
      unique: true,
      fields: ['hierarchy_level'],
    },
  ],
})
export class Role extends Model {
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
    type: DataType.INTEGER,
    field: 'hierarchy_level',
    unique: true,
    allowNull: false,
    validate: {
      min: 1,
    },
  })
  hierarchyLevel: number;

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
  @HasMany(() => User, {
    foreignKey: 'role_id',
    as: 'users',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  users: User[];

  @HasMany(() => RolePermission, {
    foreignKey: 'role_id',
    as: 'rolePermissions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  rolePermissions: RolePermission[];

  @HasMany(() => CommissionSetting, {
    foreignKey: 'role_id',
    as: 'commissionSettings',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  commissionSettings: CommissionSetting[];

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
  static async findByHierarchyLevel(level: number): Promise<Role | null> {
    return this.findOne({ where: { hierarchyLevel: level } });
  }

  static async findByName(name: string): Promise<Role | null> {
    return this.findOne({ where: { name } });
  }
}
