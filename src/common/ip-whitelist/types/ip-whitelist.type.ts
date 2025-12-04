export type IpWhitelistType = {
  id: string;
  domainName: string;
  serverIp: string;
  userId: string;
  rootId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IpWhitelistCreateFields = {
  domainName: string;
  serverIp: string;
  userId: string;
  rootId?: string | null;
};

export type IpWhitelistUpdateFields = {
  domainName?: string;
  serverIp?: string;
  userId?: string;
  rootId?: string | null;
};

export type IpWhitelistFilter = {
  userId?: string;
  search?: string; // domainName, serverIp, firstName, lastName search
};
