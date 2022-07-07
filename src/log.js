import { MODULE_ID } from "./constants.js";

const LogLevel = Object.freeze({
  NOTHING: 0,
  FATAL: 5,
  ERROR: 10,
  WARNING: 15,
  INFO: 20,
  VERBOSE: 25,
});

export default class Log {
  static get _logLevel() {
    const _devMode = !!game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID)

    if (_devMode) return LogLevel.VERBOSE

    return LogLevel.WARNING
  }

  /**
   * Sends a general console message that will always be sent out unless the level is set to NOTHING.
   *
   * @param  {...any} args The arguments to print in the message.
   */
  static message(...args) {
    this._log(this._logLevel > LogLevel.NOTHING, "log", ...args)
  }

  static fatal(...args) {
    this._log(this._logLevel >= LogLevel.FATAL, "error", ...args)
  }

  static error(...args) {
    this._log(this._logLevel >= LogLevel.ERROR, "error", ...args)
  }

  static warn(...args) {
    this._log(this._logLevel >= LogLevel.WARNING, "warn", ...args)
  }

  static info(...args) {
    this._log(this._logLevel >= LogLevel.INFO, "log", ...args)
  }

  static verbose(...args) {
    this._log(this._logLevel >= LogLevel.VERBOSE, "log", ...args)
  }

  static _log(shouldLog, type, ...args) {
    if (shouldLog) {
      console[type](MODULE_ID, "|", ...args)
    }
  }
}