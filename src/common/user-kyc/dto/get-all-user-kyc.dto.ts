import { UserKycStatus } from '../enums/user-kyc.enum';

export class GetAllUserKycDto {
  page?: number;
  limit?: number;
  search?: string; // name, phone, email, customerId
  status?: UserKycStatus;
}
