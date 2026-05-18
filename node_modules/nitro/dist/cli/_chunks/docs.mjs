import { t as defineCommand } from "../../_libs/citty.mjs";
import { execSync } from "node:child_process";
//#region src/cli/commands/docs.ts
var docs_default = defineCommand({
	meta: {
		name: "docs",
		description: "Explore Nitro documentation"
	},
	args: { page: {
		type: "string",
		description: "Page path to open"
	} },
	run({ rawArgs }) {
		const runnerCmd = ([
			["bun", "x"],
			["pnpm", "dlx"],
			["npm", "x"]
		].find(([pkg]) => {
			try {
				execSync(`${pkg} -v`, { stdio: "ignore" });
				return true;
			} catch {}
		}) || ["npm", "x"]).join(" ");
		const docsDir = new URL("../../../skills/nitro/docs", import.meta.url).pathname;
		const args = rawArgs?.join(" ") || "";
		execSync(`${runnerCmd} mdzilla ${docsDir}${args ? ` ${args}` : ""}`, { stdio: "inherit" });
	}
});
//#endregion
export { docs_default as default };
