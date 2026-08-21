const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");

const streamsWithBrokenPipeHandler = new WeakSet();
const streamsWithBrokenPipeWriteGuard = new WeakSet();
const processesWithBrokenPipeHandler = new WeakSet();
const consolesWithBrokenPipeGuard = new WeakSet();

function isBrokenPipeError(error) {
  return Boolean(
    error &&
      (error.code === "EPIPE" ||
        error.errno === "EPIPE" ||
        String(error.message || "").includes("EPIPE"))
  );
}

function attachBrokenPipeErrorHandler(stream) {
  if (!stream || typeof stream.on !== "function" || streamsWithBrokenPipeHandler.has(stream)) {
    return;
  }
  stream.on("error", (error) => {
    if (!isBrokenPipeError(error)) {
      throw error;
    }
  });
  streamsWithBrokenPipeHandler.add(stream);
}

function guardBrokenPipeWrites(stream) {
  if (
    !stream ||
    typeof stream.write !== "function" ||
    streamsWithBrokenPipeWriteGuard.has(stream)
  ) {
    return;
  }

  const originalWrite = stream.write;
  stream.write = function guardedWrite(...args) {
    try {
      return originalWrite.apply(this, args);
    } catch (error) {
      if (isBrokenPipeError(error)) {
        return false;
      }
      throw error;
    }
  };
  streamsWithBrokenPipeWriteGuard.add(stream);
}

function safeWriteStream(stream, text) {
  attachBrokenPipeErrorHandler(stream);
  guardBrokenPipeWrites(stream);
  try {
    return stream.write(text) !== false;
  } catch (error) {
    if (isBrokenPipeError(error)) {
      return false;
    }
    throw error;
  }
}

function guardBrokenPipeConsole(consoleObject, stdout, stderr) {
  if (!consoleObject || consolesWithBrokenPipeGuard.has(consoleObject)) {
    return;
  }

  for (const [methodName, stream] of [
    ["log", stdout],
    ["info", stdout],
    ["warn", stderr],
    ["error", stderr],
  ]) {
    if (typeof consoleObject[methodName] !== "function") {
      continue;
    }
    consoleObject[methodName] = (...args) => {
      safeWriteStream(stream, `${util.format(...args)}\n`);
    };
  }

  consolesWithBrokenPipeGuard.add(consoleObject);
}

function installBrokenPipeProcessGuards({
  processObject = process,
  stdout = process.stdout,
  stderr = process.stderr,
  consoleObject = null,
  onBrokenPipeException = null,
} = {}) {
  attachBrokenPipeErrorHandler(stdout);
  attachBrokenPipeErrorHandler(stderr);
  guardBrokenPipeWrites(stdout);
  guardBrokenPipeWrites(stderr);
  guardBrokenPipeConsole(consoleObject, stdout, stderr);

  if (
    !processObject ||
    typeof processObject.on !== "function" ||
    processesWithBrokenPipeHandler.has(processObject)
  ) {
    return;
  }

  processObject.on("uncaughtException", (error) => {
    if (!isBrokenPipeError(error)) {
      throw error;
    }
    if (typeof onBrokenPipeException === "function") {
      onBrokenPipeException(error);
    }
  });

  if (typeof processObject.setUncaughtExceptionCaptureCallback === "function") {
    processObject.setUncaughtExceptionCaptureCallback((error) => {
      if (!isBrokenPipeError(error)) {
        throw error;
      }
      if (typeof onBrokenPipeException === "function") {
        onBrokenPipeException(error);
      }
    });
  }

  processesWithBrokenPipeHandler.add(processObject);
}

function writeVerificationOutput({ outputPath, defaultOutputPath, text, stdout = process.stdout }) {
  const targetPath = outputPath || defaultOutputPath;
  if (targetPath) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, text, "utf8");
    return { target: "file", path: targetPath };
  }
  safeWriteStream(stdout, text);
  return { target: "stdout" };
}

module.exports = {
  installBrokenPipeProcessGuards,
  isBrokenPipeError,
  safeWriteStream,
  writeVerificationOutput,
};
