export interface AddressType {
  id: string;
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressCreateFields {
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
}

export interface AddressUpdateFields {
  address?: string;
  pinCode?: string;
  stateId?: string;
  cityId?: string;
}
