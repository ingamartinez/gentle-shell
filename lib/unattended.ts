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

/**
 * Private material (.env, .ssh, keys, auth.json, secrets/, cloud credentials)
 * may be read, edited and used when the task needs it. Follows unattended
 * mode; set `GENTLE_PI_BLOCK_PRIVATE_PATHS=1` to restore the hard block.
 * Internal desktop-action paths stay protected regardless.
 */
export const BLOCK_PRIVATE_PATHS_ENV = "GENTLE_PI_BLOCK_PRIVATE_PATHS";

export function privatePathsAllowed(env: Record<string, string | undefined> = process.env): boolean {
	const block = env[BLOCK_PRIVATE_PATHS_ENV]?.trim().toLowerCase();
	if (block === "1" || block === "true" || block === "on" || block === "yes") return false;
	return unattendedEnabled(env);
}

export function unattendedEnabled(env: Record<string, string | undefined> = process.env): boolean {
	const value = env[UNATTENDED_ENV]?.trim().toLowerCase();
	return !(value === "0" || value === "false" || value === "off" || value === "no");
}
