import pkg from '../../package.json';

export const appVersion = String(pkg.version ?? '0.0.0');
