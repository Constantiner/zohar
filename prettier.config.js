/** @type {import('prettier').Config} */
const config = {
	printWidth: 120,
	useTabs: true,
	tabWidth: 4,
	trailingComma: "none",
	arrowParens: "avoid",
	overrides: [
		{
			files: ".huskyrc",
			options: { parser: "json" }
		},
		{
			files: ".lintstagedrc",
			options: { parser: "json" }
		}
	],
	plugins: ["prettier-plugin-packagejson"],
	tailwindFunctions: ["clsx"]
};

export default config;
