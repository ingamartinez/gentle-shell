/**
 * Fork-only (ingamartinez/gentle-shell, branch `autonomo`): unattended mode.
 *
 * When enabled, host-owned permission dialogs that are not product
 * clarifications are answered automatically so a feature can run end to end
 * without a human at the keyboard:
 *   - native review consent (granted + stored as session standing permission),
 *   - reviewer model-run cost forecasts (acknowledged),
 *   - foreign clone subagent launches, cross-orchestrator messages and
 *     orchestrator helper model runs (allowed for the session).
 *
 * It never touches the sensitive-path guard or the code-level hard denies
 * (`git reset --hard`, forced clean, force push, `rm -rf` of root/home).
 *
 * ON by default in this fork. Set `GENTLE_PI_UNATTENDED=0` to restore upstream
 * behavior.
 */
export const UNATTENDED_ENV = "GENTLE_PI_UNATTENDED";

export function unattendedEnabled(env: Record<string, string | undefined> = process.env): boolean {
	const value = env[UNATTENDED_ENV]?.trim().toLowerCase();
	return !(value === "0" || value === "false" || value === "off" || value === "no");
}
