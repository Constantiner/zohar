// @ts-nocheck
import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import jest from "eslint-plugin-jest";
import nodePlugin from "eslint-plugin-n";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, configs } from "typescript-eslint";

const project = "./tsconfig.json";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended
});

/**
 * @link https://github.com/import-js/eslint-plugin-import/issues/2948#issuecomment-2148832701
 * @param {string} name the plugin name
 * @param {string} alias the plugin alias
 * @returns {import("eslint").ESLint.Plugin}
 */
function legacyPlugin(name, alias = name) {
	const plugin = compat.plugins(name)[0]?.plugins?.[alias];

	if (!plugin) {
		throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
	}

	return fixupPluginRules(plugin);
}

/** @type {import('eslint').Linter.FlatConfig[]} */
export default config(
	{
		// Top-level ignores aka .eslintignore replacement for flat config
		ignores: [".vscode/**", "build/**", "dist/**", "out/**", "node_modules/**", "coverage/**"]
	},
	js.configs.recommended,
	...configs.recommended,
	...compat.extends("plugin:import/typescript"),
	{
		files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
		rules: { "@typescript-eslint/explicit-function-return-type": ["error"] }
	},
	{
		rules: {
			"no-console": ["error"],
			"no-restricted-syntax": [
				"error",
				{
					selector: "ExportDefaultDeclaration",
					message: "Prefer named exports"
				}
			],
			"no-else-return": ["error", { allowElseIf: false }]
		}
	},
	eslintPluginPrettierRecommended,
	eslintPluginUnicorn.configs["flat/recommended"],
	{
		// Unicorn
		rules: {
			"unicorn/filename-case": ["error", { case: "camelCase" }],
			"unicorn/no-fn-reference-in-iterator": "off",
			"unicorn/no-reduce": "off",
			"unicorn/no-null": "off",
			"unicorn/switch-case-braces": "off",
			"unicorn/prefer-at": "off",
			"unicorn/no-array-reduce": "off",
			"unicorn/no-array-for-each": "off",
			"unicorn/no-array-callback-reference": "off",
			"unicorn/prefer-node-protocol": "off",
			"unicorn/prefer-object-from-entries": ["off"],
			"unicorn/no-useless-undefined": "off"
		}
	},
	{
		plugins: {
			import: legacyPlugin("eslint-plugin-import", "import")
		},
		languageOptions: {
			// parser: tsParser,
			parserOptions: {
				project,
				tsconfigRootDir: import.meta.dirname,
				sourceType: "module",
				ecmaVersion: 2020
			}
		},
		settings: {
			// This will do the trick
			"import/parsers": {
				espree: [".js", ".cjs", ".mjs", ".jsx"]
			},
			"import/resolver": {
				typescript: {
					alwaysTryTypes: true,
					project
				}
			}
		},
		rules: {
			...pluginImport.configs.recommended.rules,
			"import/no-cycle": "error"
		}
	},
	{
		// Jest
		files: ["__tests__/**"],
		...jest.configs["flat/recommended"],
		rules: {
			...jest.configs["flat/recommended"].rules
		}
	},
	{
		files: ["**/*.cjs"],
		languageOptions: {
			globals: globals.node,
			sourceType: "commonjs"
		}
	},
	{
		files: ["**/*.d.ts"],
		rules: {
			"@typescript-eslint/triple-slash-reference": ["off"],
			"@typescript-eslint/no-namespace": ["off"],
			"unicorn/prevent-abbreviations": ["off"],
			"no-restricted-syntax": ["off"],
			"unicorn/filename-case": ["off"]
		}
	},
	{
		...nodePlugin.configs["flat/recommended"],
		rules: {
			...nodePlugin.configs["flat/recommended"].rules,
			"no-restricted-syntax": ["off"],
			"n/no-unsupported-features/es-syntax": [
				"error",
				{
					ignores: ["modules"]
				}
			],
			"n/no-missing-import": [
				"error",
				{
					tryExtensions: [".js", ".jsx", ".ts", ".tsx"],
					tsconfigPath: "./tsconfig.json"
				}
			]
		},
		languageOptions: {
			globals: globals.node
		}
	},
	{
		files: ["eslint.config.js"],
		rules: {
			"@typescript-eslint/ban-ts-comment": "off"
		}
	},
	{
		files: ["jest.config*.ts"],
		rules: {
			"unicorn/prefer-module": ["off"]
		}
	}
);
