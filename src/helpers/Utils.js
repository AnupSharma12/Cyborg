const { readdirSync, lstatSync } = require("fs");
const { join, extname } = require("path");

module.exports = class Utils {
  /**
   * Recursively read all files from a directory
   * @param {string} dir
   * @param {string[]} allowedExtensions
   * @returns {string[]}
   */
  static recursiveReadDirSync(dir, allowedExtensions = [".js"]) {
    const filePaths = [];
    const readDir = (directory) => {
      const files = readdirSync(join(process.cwd(), directory));
      files.forEach((file) => {
        const stat = lstatSync(join(process.cwd(), directory, file));
        if (stat.isDirectory()) {
          readDir(join(directory, file));
        } else {
          const extension = extname(file);
          if (!allowedExtensions.includes(extension)) return;
          const filePath = join(process.cwd(), directory, file);
          filePaths.push(filePath);
        }
      });
    };
    readDir(dir);
    return filePaths;
  }

  /**
   * Returns remaining time in days, hours, minutes and seconds
   * @param {number} timeInSeconds
   * @returns {string}
   */
  static timeformat(timeInSeconds) {
    const days = Math.floor((timeInSeconds % 31536000) / 86400);
    const hours = Math.floor((timeInSeconds % 86400) / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.round(timeInSeconds % 60);
    return (
      (days > 0 ? `${days} days, ` : "") +
      (hours > 0 ? `${hours} hours, ` : "") +
      (minutes > 0 ? `${minutes} minutes, ` : "") +
      (seconds > 0 ? `${seconds} seconds` : "")
    );
  }
};
