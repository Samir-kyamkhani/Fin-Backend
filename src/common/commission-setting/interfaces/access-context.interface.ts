export interface AccessContext {
  rootId: string;
  mode: 'ROOT' | 'ADMIN';
  ownerId: string;
}
