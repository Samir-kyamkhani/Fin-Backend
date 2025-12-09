export const SettingScope = {
  ROOT: 'ROOT',
  USER: 'USER',
} as const;

export type SettingScope = (typeof SettingScope)[keyof typeof SettingScope];
