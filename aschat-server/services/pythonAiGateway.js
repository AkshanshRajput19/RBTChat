const { spawn } = require("child_process");
const path = require("path");

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90000);

const resolvePythonExecutable = () => {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE;
  }

  return process.platform === "win32" ? "python" : "python3";
};

const runPythonAi = (command, payload = {}, options = {}) => {
  const scriptPath = path.join(__dirname, "..", "ai_service.py");
  const pythonExecutable = resolvePythonExecutable();
  const timeoutMs =
    Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, [scriptPath, command], {
      cwd: path.join(__dirname, ".."),
      env: process.env,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      reject(
        new Error(
          `Python AI service timed out after ${timeoutMs}ms while running "${command}".`
        )
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      reject(
        new Error(
          `Unable to start Python AI service with "${pythonExecutable}". ${error.message}`
        )
      );
    });

    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);

      if (exitCode !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `Python AI service exited with code ${exitCode} while running "${command}".`
          )
        );
        return;
      }

      const rawOutput = stdout.trim();

      if (!rawOutput) {
        reject(new Error("Python AI service returned an empty response."));
        return;
      }

      try {
        resolve(JSON.parse(rawOutput));
      } catch (error) {
        reject(
          new Error(
            `Python AI service returned invalid JSON. ${error.message}. Output: ${rawOutput}`
          )
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
};

module.exports = {
  runPythonAi,
};
