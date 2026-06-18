import { spawn } from 'child_process';

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Run a shell command with timeout; rejects on non-zero exit unless allowFailure */
export function runCommand(
  command: string,
  args: string[],
  options: { timeoutMs?: number; allowFailure?: boolean } = {}
): Promise<RunCommandResult> {
  const { timeoutMs = 120_000, allowFailure = false } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const exitCode = code ?? 1;

      if (timedOut) {
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
        return;
      }

      if (exitCode !== 0 && !allowFailure) {
        reject(
          new Error(
            `${command} exited with code ${exitCode}: ${stderr.trim() || stdout.trim() || 'unknown error'}`
          )
        );
        return;
      }

      resolve({ stdout, stderr, exitCode });
    });
  });
}
