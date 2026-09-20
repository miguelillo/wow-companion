export * from './primitives';
export * from './step';
export * from './progress';
export * from './content';

/**
 * Version of the step/progress contract shared by the web, the addon and the desktop
 * client. Bumped only for breaking changes, together with a migration.
 */
export const CONTRACT_VERSION = 1;
