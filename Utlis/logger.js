import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';
export const log = pino({ level, base: null });
