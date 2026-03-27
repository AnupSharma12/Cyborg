const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLevel = LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

module.exports = class Logger {
  static setLevel(level) {
    if (LEVELS[level] !== undefined) currentLevel = LEVELS[level];
  }

  /** @param {string} content */
  static success(content) {
    if (currentLevel > LEVELS.info) return;
    console.log(`[${timestamp()}] [SUCCESS] ${content}`);
  }

  /** @param {string} content */
  static log(content) {
    if (currentLevel > LEVELS.info) return;
    console.log(`[${timestamp()}] [LOG] ${content}`);
  }

  /** @param {string} content */
  static info(content) {
    if (currentLevel > LEVELS.info) return;
    console.log(`[${timestamp()}] [INFO] ${content}`);
  }

  /** @param {string} content */
  static warn(content) {
    if (currentLevel > LEVELS.warn) return;
    console.warn(`[${timestamp()}] [WARN] ${content}`);
  }

  /**
   * @param {string} content
   * @param {object} [ex]
   */
  static error(content, ex) {
    if (ex) {
      console.error(`[${timestamp()}] [ERROR] ${content}: ${ex?.message}`);
      if (ex.stack) console.error(ex.stack);
    } else {
      console.error(`[${timestamp()}] [ERROR] ${content}`);
    }

    // Send to webhook (deferred to next tick to avoid circular dependency)
    const errorContent = content;
    const errorEx = ex;
    setImmediate(() => {
      try {
        const WebhookLogger = require("./WebhookLogger");
        WebhookLogger.logError(errorContent, errorEx);
      } catch {}
    });
  }

  /** @param {string} content */
  static debug(content) {
    if (currentLevel > LEVELS.debug) return;
    console.log(`[${timestamp()}] [DEBUG] ${content}`);
  }
};
