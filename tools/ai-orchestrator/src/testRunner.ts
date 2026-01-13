import { execSync } from "node:child_process";

const ALLOWED_TEST_COMMANDS = [
  'npm test',
  'npm run test',
  'npm run test:ci',
  'jest',
  'vitest',
];

export type TestResult = {
  success: boolean;
  output: string;
  command: string;
};

export function runTests(commands: string[]): TestResult[] {
  const results: TestResult[] = [];

  for (const command of commands) {
    // Validate command against allowlist
    const isAllowed = ALLOWED_TEST_COMMANDS.some(allowed => command.startsWith(allowed));

    if (!isAllowed) {
      console.warn(`Skipping potentially unsafe command: ${command}`);
      results.push({
        success: false,
        output: `Command not in allowlist: ${command}. Allowed commands: ${ALLOWED_TEST_COMMANDS.join(', ')}`,
        command,
      });
      continue;
    }

    try {
      const output = execSync(command, {
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      results.push({
        success: true,
        output: truncateOutput(output),
        command,
      });
    } catch (err: any) {
      results.push({
        success: false,
        output: truncateOutput(err.stdout || err.stderr || err.message || "Test failed"),
        command,
      });
    }
  }

  return results;
}

function truncateOutput(output: string, maxLines: number = 100): string {
  const lines = output.split("\n");
  if (lines.length <= maxLines) {
    return output;
  }

  const half = Math.floor(maxLines / 2);
  const truncated = [
    ...lines.slice(0, half),
    `\n... [${lines.length - maxLines} lines truncated] ...\n`,
    ...lines.slice(-half),
  ];

  return truncated.join("\n");
}

export function formatTestResults(results: TestResult[]): string {
  const sections = results.map((r) => {
    const status = r.success ? "✓ PASS" : "✗ FAIL";
    return [
      `${status}: ${r.command}`,
      "```",
      r.output,
      "```",
    ].join("\n");
  });

  return sections.join("\n\n");
}
