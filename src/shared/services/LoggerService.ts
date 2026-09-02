import path from 'path';

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { env } from '@configs/envConfig';

const { combine, timestamp, printf, splat, errors, json } = winston.format;

const customLevels = {
  levels: {
    error: 0,
    notice: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    error: 'red bold',
    notice: 'magenta bold',
    warn: 'yellow bold',
    info: 'green bold',
    debug: 'blue bold',
  },
};

winston.addColors(customLevels.colors);

function resolveLevel(): string {
  if (env.server.NODE_ENV === 'dev') return 'info';
  if (env.server.NODE_ENV === 'debug') return 'debug';
  return 'notice';
}

const TIMESTAMP_FORMAT = 'DD/MM/YYYY - HH:mm:ss';

const fileFormat = combine(timestamp({ format: TIMESTAMP_FORMAT }), errors({ stack: true }), splat(), json());

const defaultRotateOptions = {
  datePattern: 'DD_MM_YYYY',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '10d',
  handleExceptions: true,
  format: fileFormat,
};

const consoleFormat = combine(
  errors({ stack: true }),
  splat(),
  timestamp({ format: TIMESTAMP_FORMAT }),
  printf(({ level, message, timestamp: ts, stack, prefix, ...meta }) => {
    // O `prefix` vem do `logger.child({ prefix })` e identifica o contexto no
    // lugar do nível; sem ele o rótulo cai para o próprio nível.
    const label = typeof prefix === 'string' ? prefix.toUpperCase() : level.toUpperCase();
    const coloredLabel = winston.format.colorize().colorize(level, `[${label}]`);
    const displayMessage = typeof stack === 'string' ? stack : String(message);
    const metaData = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const grayTimestamp = `\x1b[90m${String(ts)}\x1b[0m`;

    return `${grayTimestamp} | ${coloredLabel}: ${displayMessage}${metaData}`;
  }),
);

export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: resolveLevel(),
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
    new DailyRotateFile({
      ...defaultRotateOptions,
      level: 'error',
      filename: path.resolve('logs', 'errors', 'error_%DATE%.log'),
    }),
    new DailyRotateFile({
      ...defaultRotateOptions,
      level: 'notice',
      filename: path.resolve('logs', 'notices', 'notice_%DATE%.log'),
    }),
  ],
});
