import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  HasMany,
  Default,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { CreatedByType } from '../enums/role.enum';
import { RolePermission } from 'src/common/role-permission/entities/role-permission.entity';
import { User } from 'src/user/entities/user.entity';
import { CommissionSetting } from 'src/common/commission-setting/entities/commission-setting.entity';
import { Root } from 'src/root/entities/root.entity';

// ========== ROLE ==========
@Table({
  tableName: 'roles',
  timestamps: true,
  underscored: true,
  modelName: 'Role',
  indexes: [
    { name: 'idx_created_by', fields: ['created_by_id', 'created_by_type'] },
    { name: 'idx_name_unique', unique: true, fields: ['name'] },
    {
      name: 'idx_hierarchy_level_unique',
      unique: true,
      fields: ['hierarchy_level'],
    },
  ],
})
export class Role extends Model<Role> {
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
    type: DataType.INTEGER,
    field: 'hierarchy_level',
    unique: true,
    allowNull: false,
    validate: { min: 1 },
  })
  hierarchyLevel: number;
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
  static async findByHierarchyLevel(level: number): Promise<Role | null> {
    return this.findOne({ where: { hierarchyLevel: level } });
  }
  static async findByName(name: string): Promise<Role | null> {
    return this.findOne({ where: { name } });
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static validateHierarchy(instance: Role): void {
    if (instance.hierarchyLevel < 1)
      throw new Error('Hierarchy level must be at least 1');
  }
}
