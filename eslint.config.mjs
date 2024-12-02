import eslint from "@eslint/js";
import stylisticTs from "@stylistic/eslint-plugin-ts"
import tseslint from 'typescript-eslint';

export default tseslint.config(
{"ignores": ["**/*.js", "**/*.mjs", "**/*.d.ts", "**/*.d.mts"]},
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		"languageOptions": {
			"parser": tseslint.parser,
			"parserOptions": {
				"project": [
					"./tsconfig.json"
				]
			},
		},
		"plugins": {
			"@stylistic/ts": stylisticTs,
			"@typescript-eslint": tseslint.plugin,
		},
		"rules": {
			"camelcase": "off",
			"default-param-last": "off",
			"no-constant-condition": "off",
			"no-empty-function": "off",
			"no-shadow": "off",
			"no-unused-vars": "off",
			"dot-notation": "off",
			"no-duplicate-imports": ["warn"],
			"curly": ["warn","all"],
			"no-else-return": ["warn"],
			"no-template-curly-in-string": ["warn"],
			"no-unneeded-ternary": ["warn"],
			"spaced-comment": ["warn", "always", { "exceptions": ["-", "+", "/"] }],
			"@typescript-eslint/default-param-last": ["warn"],
			"@typescript-eslint/naming-convention": [
				"warn",
				{
					"selector": "default",
					"format": ["camelCase"]
				},
				{
					"selector": ["objectLiteralMethod","objectLiteralProperty"],
					"format": null,
					"filter": {
						"regex": "^\\d+$",
						"match": true
					}
				},
				{
					"selector": "variable",
					"format": ["camelCase"]
				},
				// {
				// 	"selector": "variable",
				// 	"modifiers": ["global","const"],
				// 	"format": ["UPPER_CASE"]
				// },
				{
					"selector": "variable",
					"types": ["boolean"],
					"format": ["PascalCase"],
					"prefix": ["is", "should", "has", "can", "did", "will"]
				},
				{
					"selector": "parameter",
					"format": ["camelCase"]
				},
				{
					"selector": "variable",
					"modifiers": ["unused"],
					"format": ["camelCase"],
					"leadingUnderscore": "require"
				},
				{
					"selector": "parameter",
					"modifiers": ["unused"],
					"format": ["camelCase"],
					"leadingUnderscore": "require"
				},
				{
					"selector": "memberLike",
					"modifiers": ["private"],
					"format": ["camelCase"],
					"leadingUnderscore": "require"
				}
			],
			"@typescript-eslint/no-empty-function": ["warn"],
			"@typescript-eslint/no-shadow": ["warn"],
			"@typescript-eslint/dot-notation": ["warn"],
			"@typescript-eslint/no-unnecessary-condition": ["warn",{
				"allowConstantLoopConditions": true
			}],
			"@typescript-eslint/no-unused-vars": ["warn",{
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_"
			}],
			"@typescript-eslint/restrict-template-expressions": ["error",{
				"allowBoolean": true
			}],
			"@typescript-eslint/switch-exhaustiveness-check": ["warn"],
			"array-bracket-newline": ["warn", "consistent"],
			"array-element-newline": ["warn", "consistent"],
			"eol-last": ["warn"],
			"function-paren-newline": ["warn", "consistent"],
			"indent": ["warn", "tab", {"SwitchCase":1}],
			"no-multiple-empty-lines": ["warn", { "max": 2, "maxEOF": 1 }],
			"no-trailing-spaces": ["warn"],
			"@stylistic/ts/block-spacing": ["warn","never"],
			"@stylistic/ts/brace-style": ["warn", "1tbs", {"allowSingleLine":true}],
			"@stylistic/ts/comma-dangle": ["warn", "always-multiline"],
			"@stylistic/ts/comma-spacing": ["warn"],
			"@stylistic/ts/func-call-spacing": ["warn"],
			"@stylistic/ts/key-spacing": ["warn"],
			"@stylistic/ts/keyword-spacing": ["warn"],
			"@stylistic/ts/member-delimiter-style": ["warn"],
			"@typescript-eslint/no-base-to-string": ["error",{
				"ignoredTypeNames": [
					"Error",
					"RegExp",
					"URL",
					"URLSearchParams",
					"Boolean",
					"boolean"
				]
			}],
			"@stylistic/ts/no-extra-parens": ["warn"],
			"@stylistic/ts/object-curly-spacing": ["warn"],
			"@stylistic/ts/quotes": ["warn"],
			"@stylistic/ts/semi": ["warn"],
			"@stylistic/ts/space-before-blocks": ["warn"],
			"@stylistic/ts/space-before-function-paren": ["warn","never"],
			"@stylistic/ts/type-annotation-spacing": ["warn"]
		}
	}
)
