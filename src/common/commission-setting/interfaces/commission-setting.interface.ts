import {
  CommissionScope,
  CommissionType,
  CreatorType,
} from '../enums/commission-setting.enum';

/**
 * ✅ Main Commission Entity (Service Layer)
 */
export interface CommissionSettingEntity {
  id: string;

  scope: CommissionScope;
  roleId?: string | null;
  targetUserId?: string | null;
  serviceId?: string | null;

  // COMMISSION
  commissionType?: CommissionType | null;
  commissionValue?: number | null;

  // SURCHARGE
  surchargeType?: CommissionType | null;
  surchargeValue?: number | null;

  // SLAB
  minAmount?: bigint | null;
  maxAmount?: bigint | null;

  // TAX
  applyTDS: boolean;
  tdsPercent?: number | null;
  applyGST: boolean;
  gstPercent?: number | null;

  // STATUS
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date | null;

  // AUDIT
  createdByType: CreatorType;
  createdByRootId: string;
  createdByUserId?: string | null;
  createdByEmployeeId?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ✅ Query / Filter interface (used in service)
 */
export interface CommissionSettingQuery {
  scope?: CommissionScope;
  roleId?: string;
  targetUserId?: string;
  serviceId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CommissionSettingWhere {
  createdByRootId: string;
  scope?: CommissionScope;
  roleId?: string;
  targetUserId?: string;
  serviceId?: string;
  isActive?: boolean;
}

/**
 * ✅ Audit mapping interface
 */
export interface CommissionSettingAudit {
  createdByType: CreatorType;
  createdByRootId: string;
  createdByUserId?: string;
  createdByEmployeeId?: string;
}
