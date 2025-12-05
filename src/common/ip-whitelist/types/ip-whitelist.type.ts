export type IpWhitelistUserType = {
  id: string;
  domainName: string;
  serverIp: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IpWhitelistRootType = {
  id: string;
  domainName: string;
  serverIp: string;
  rootId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IpWhitelistRootTypeMap = {
  domainName: string;
  serverIp: string;
};

export type IpWhitelistCreateUserFields = {
  domainName: string;
  serverIp: string;
  userId: string;
};

export type IpWhitelistCreateRootFields = {
  domainName: string;
  serverIp: string;
  rootId: string;
};

export type IpWhitelistUpdateUserFields = {
  domainName?: string;
  serverIp?: string;
  userId?: string;
};

export type IpWhitelistUpdateRootFields = {
  domainName?: string;
  serverIp?: string;
  rootId?: string;
};
