const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  installBrokenPipeProcessGuards,
  safeWriteStream,
  writeVerificationOutput,
} = require("./safe-script-output");

test("safeWriteStream ignores broken pipe errors", () => {
  const writes = [];
  const stream = {
    write(text) {
      writes.push(text);
      const error = new Error("write EPIPE");
      error.code = "EPIPE";
      throw error;
    },
  };

  assert.equal(safeWriteStream(stream, "result"), false);
  assert.deepEqual(writes, ["result"]);
});

test("safeWriteStream rethrows non broken pipe errors", () => {
  const stream = {
    write() {
      throw new Error("disk full");
    },
  };

  assert.throws(() => safeWriteStream(stream, "result"), /disk full/);
});

test("safeWriteStream handles broken pipe error events from streams", () => {
  const stream = new EventEmitter();
  stream.write = () => true;
  safeWriteStream(stream, "result");

  const error = new Error("write EPIPE");
  error.code = "EPIPE";

  assert.doesNotThrow(() => stream.emit("error", error));
});

test("installBrokenPipeProcessGuards ignores process-level broken pipe exceptions", () => {
  const processLike = new EventEmitter();
  const stdout = new EventEmitter();
  stdout.write = () => true;
  const stderr = new EventEmitter();
  stderr.write = () => true;

  installBrokenPipeProcessGuards({ processObject: processLike, stdout, stderr });

  const error = new Error("write EPIPE");
  error.code = "EPIPE";

  assert.doesNotThrow(() => stdout.emit("error", error));
  assert.doesNotThrow(() => stderr.emit("error", error));
  assert.doesNotThrow(() => processLike.emit("uncaughtException", error));
});

test("installBrokenPipeProcessGuards ignores direct broken pipe stream writes", () => {
  const processLike = new EventEmitter();
  const stdout = new EventEmitter();
  stdout.write = () => {
    const error = new Error("write EPIPE");
    error.code = "EPIPE";
    throw error;
  };

  installBrokenPipeProcessGuards({ processObject: processLike, stdout });

  assert.equal(stdout.write("result"), false);
});

test("installBrokenPipeProcessGuards rethrows direct non broken pipe stream writes", () => {
  const processLike = new EventEmitter();
  const stdout = new EventEmitter();
  stdout.write = () => {
    throw new Error("disk full");
  };

  installBrokenPipeProcessGuards({ processObject: processLike, stdout });

  assert.throws(() => stdout.write("result"), /disk full/);
});

test("installBrokenPipeProcessGuards captures broken pipe exceptions before Electron dialogs", () => {
  let captureCallback = null;
  const processLike = new EventEmitter();
  processLike.setUncaughtExceptionCaptureCallback = (callback) => {
    captureCallback = callback;
  };

  installBrokenPipeProcessGuards({ processObject: processLike });

  const error = new Error("write EPIPE");
  error.code = "EPIPE";

  assert.equal(typeof captureCallback, "function");
  assert.doesNotThrow(() => captureCallback(error));
  assert.throws(() => captureCallback(new Error("boom")), /boom/);
});

test("installBrokenPipeProcessGuards runs a cleanup callback for captured broken pipe exceptions", () => {
  let captureCallback = null;
  let cleanupCount = 0;
  const processLike = new EventEmitter();
  processLike.setUncaughtExceptionCaptureCallback = (callback) => {
    captureCallback = callback;
  };

  installBrokenPipeProcessGuards({
    processObject: processLike,
    onBrokenPipeException() {
      cleanupCount += 1;
    },
  });

  const error = new Error("write EPIPE");
  error.code = "EPIPE";

  captureCallback(error);

  assert.equal(cleanupCount, 1);
});

test("installBrokenPipeProcessGuards routes console writes through guarded streams", () => {
  const processLike = new EventEmitter();
  const stdoutWrites = [];
  const stderrWrites = [];
  const stdout = {
    write(text) {
      stdoutWrites.push(text);
      const error = new Error("write EPIPE");
      error.code = "EPIPE";
      throw error;
    },
  };
  const stderr = {
    write(text) {
      stderrWrites.push(text);
      const error = new Error("write EPIPE");
      error.code = "EPIPE";
      throw error;
    },
  };
  const consoleLike = {
    log() {
      throw new Error("original log should be replaced");
    },
    info() {
      throw new Error("original info should be replaced");
    },
    warn() {
      throw new Error("original warn should be replaced");
    },
    error() {
      throw new Error("original error should be replaced");
    },
  };

  installBrokenPipeProcessGuards({ processObject: processLike, stdout, stderr, consoleObject: consoleLike });

  assert.doesNotThrow(() => consoleLike.log("result", 1));
  assert.doesNotThrow(() => consoleLike.info("info"));
  assert.doesNotThrow(() => consoleLike.warn("warning"));
  assert.doesNotThrow(() => consoleLike.error("failure"));
  assert.deepEqual(stdoutWrites, ["result 1\n", "info\n"]);
  assert.deepEqual(stderrWrites, ["warning\n", "failure\n"]);
});

test("installBrokenPipeProcessGuards rethrows non broken pipe exceptions", () => {
  const processLike = new EventEmitter();

  installBrokenPipeProcessGuards({ processObject: processLike });

  assert.throws(() => processLike.emit("uncaughtException", new Error("boom")), /boom/);
});

test("writeVerificationOutput writes to the configured file instead of stdout", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "patch-console-output-"));
  const outputPath = path.join(tmpDir, "result.json");
  let stdoutText = "";

  const result = writeVerificationOutput({
    outputPath,
    text: "{\"ok\":true}\n",
    stdout: {
      write(text) {
        stdoutText += text;
      },
    },
  });

  assert.equal(result.target, "file");
  assert.equal(result.path, outputPath);
  assert.equal(fs.readFileSync(outputPath, "utf8"), "{\"ok\":true}\n");
  assert.equal(stdoutText, "");
});
