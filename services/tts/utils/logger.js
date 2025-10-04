import pino from "pino";

const isLocal = process.env.NODE_ENV !== "Production" && process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL || (isLocal ? "debug" : "info");

const log = pino({
  level,
  base: undefined,
  transport: isLocal
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
});

export { log };
export default log;
