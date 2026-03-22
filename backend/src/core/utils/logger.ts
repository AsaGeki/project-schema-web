/* eslint-disable no-control-regex */
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, splat, errors, json } = winston.format;

// 1. Definição de Níveis, Cores e Emojis
const customLevels = {
	levels: {
		error: 0,
		notice: 1,
		warn: 2, // Warn fica entre notice e info
		info: 3,
		debug: 4
	},
	colors: {
		error: 'red bold',
		notice: 'magenta bold', // Magenta é o 'roxo' padrão de terminal
		warn: 'yellow bold',
		info: 'green bold',
		debug: 'blue bold'
	}
};

const emojis: Record<string, string> = {
	error: '❌',
	notice: '📢',
	warn: '⚠️',
	info: '✨',
	debug: '🔍'
};

winston.addColors(customLevels.colors);

// 2. Lógica de Ambiente para o Nível de Log
const env = process.env.NODE_ENV || 'prod';
// Se for prod, o nível é 1 (notice), ocultando warn(2), info(3) e debug(4)
const currentLevel = env === 'dev' ? 'info' : env === 'debug' ? 'debug' : 'notice';

const TIMESTAMP_FORMAT = 'DD/MM/YYYY - HH:mm:ss';

// 3. Formatação Customizada (Console)
const consoleFormat = combine(
	errors({ stack: true }),
	splat(),
	timestamp({ format: TIMESTAMP_FORMAT }),
	printf(({ level, message, timestamp, stack, prefix, ...meta }) => {
		// Removemos os códigos ANSI do level para pegar o nome puro para o mapa de emojis
		const plainLevel = level.replace(/\u001b\[[0-9;]*m/g, '').toLowerCase();
		const emoji = emojis[plainLevel] || '📝';

		// Lógica do Prefix: Se existir, usa em UPPERCASE. Senão, usa o Level.
		const label = prefix ? String(prefix).toUpperCase() : plainLevel.toUpperCase();

		// Aplicamos a cor manualmente para que o prefixo também herde a cor do nível
		const coloredLabel = winston.format.colorize().colorize(plainLevel, `[${label}]`);

		const displayMessage = stack || message;
		const metaData = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';

		// Formato: DD/MM/YYYY - HH:mm:ss | "emoji" [TIPO]: mensagem
		const grayTimestamp = `\x1b[90m${timestamp}\x1b[0m`;
		return `${grayTimestamp} | ${emoji} ${coloredLabel}: ${displayMessage}${metaData}`;
	})
);

// 4. Formatação para Arquivos (JSON para Produção)
const fileFormat = combine(timestamp({ format: TIMESTAMP_FORMAT }), errors({ stack: true }), splat(), json());

const logger = winston.createLogger({
	levels: customLevels.levels,
	level: currentLevel,
	exitOnError: false,
	transports: [
		new winston.transports.Console({
			format: consoleFormat,
			handleExceptions: true,
			handleRejections: true
		}),
		new DailyRotateFile({
			level: 'error',
			filename: 'logs/errors/error-%DATE%.log',
			datePattern: 'DD_MM_YYYY',
			zippedArchive: true,
			maxSize: '10m',
			maxFiles: '14d',
			format: fileFormat
		}),
		new DailyRotateFile({
			level: 'notice',
			filename: 'logs/combined/combined-%DATE%.log',
			datePattern: 'DD_MM_YYYY',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '7d',
			format: fileFormat
		})
	]
});

export { logger };
