# @labdigital/enviconf

[![npm](https://img.shields.io/npm/v/@labdigital/enviconf)](https://www.npmjs.com/package/@labdigital/enviconf)

A small, dependency-free library to load typed configuration from environment
variables. You describe your configuration as a class that extends
`BaseConfig`, declare each field with `envfield.*`, and `load()` reads
`process.env`, coerces and validates the values and assigns them to the
instance. Missing required variables and type mismatches throw an error at
startup. Inspired by [caarlos0/env](https://github.com/caarlos0/env).

## Installation

```sh
pnpm add @labdigital/enviconf
# or
npm install @labdigital/enviconf
```

## Requirements

- Node.js >= 22
- The package is ESM (`"type": "module"`) and ships its own TypeScript types.
- No peer dependencies.

## Usage

```ts
import { BaseConfig, type EnviConfig, envfield } from "@labdigital/enviconf";

class AppConfig extends BaseConfig {
	/** Defaults are used when the env variable is not set */
	readonly HTTP_PORT: number = 4000;
	readonly LOG_LEVEL: string = "info";
	readonly DEBUG: boolean = false;
	readonly ALLOWED_ORIGINS: string[] = [];
	readonly DATABASE_URL!: string;
	readonly API_TOKEN!: string;

	config(): EnviConfig {
		return {
			HTTP_PORT: envfield.number({
				validator: (value: number) => {
					if (value <= 0) throw new Error("HTTP_PORT must be positive");
				},
			}),
			LOG_LEVEL: envfield.string(),
			DEBUG: envfield.boolean(),
			ALLOWED_ORIGINS: envfield.string({ envSeparator: "," }),
			// Required: throws "Missing required env variable DATABASE_URL"
			DATABASE_URL: envfield.string(),
			// Read from MY_API_TOKEN and removed from process.env afterwards
			API_TOKEN: envfield.secret({ envName: "MY_API_TOKEN" }),
		};
	}
}

export const config = AppConfig.load();
```

`AppConfig.load(options)` is a shorthand for:

```ts
const config = new AppConfig();
config.load(options);
```

If you override `configure()`, call `super.configure()`, otherwise `load()`
throws.

### Field types

| Helper                | Type      | Default when `optional` |
| --------------------- | --------- | ----------------------- |
| `envfield.string()`   | `string`  | `""`                    |
| `envfield.number()`   | `number`  | `0`                     |
| `envfield.boolean()`  | `boolean` | `false`                 |
| `envfield.object()`   | `object`  | `{}`                    |
| `envfield.secret()`   | `string`  | `""` (always `unset`)   |

Values are parsed with `JSON.parse` (falling back to the raw string) and then
type checked, so `PORT=8080` becomes `8080`, `DEBUG=true` becomes `true` and
`OPTIONS={"a":1}` becomes an object. A value that does not match the declared
type throws, e.g. `Invalid type for HTTP_PORT = "abc": Expected number but got
string`.

### Resolution order

For each field `load()` uses, in order:

1. The env variable (with prefix first, see below), if set.
2. The value of the class property (its default), if not `undefined`.
3. The type's empty value if the field is `optional`.
4. Otherwise it throws `Missing required env variable <NAME>`.

## Configuration

### Field options

All `envfield.*` helpers accept the same options (`secret()` does not accept
`unset`, it is always on):

| Option         | Type                     | Description                                                                                                                         |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `optional`     | `boolean`                | Use the type's empty value instead of throwing when the variable is not set and the property has no default.                        |
| `envName`      | `string`                 | Name of the env variable to read. Defaults to the property name.                                                                    |
| `envSeparator` | `string`                 | Split the value on this separator into an array. Each item is trimmed and coerced to the field type (`number` uses `parseInt`).    |
| `unset`        | `boolean`                | Delete the variable from `process.env` after reading it. Useful for secrets.                                                        |
| `validator`    | `(value: any) => void`   | Custom validation, called with the parsed value. Throw an error to reject the value; the return value is ignored.                   |

### Load options

```ts
const config = AppConfig.load({
	prefix: "MY_APP_",
	disableUnset: true,
});
```

| Option         | Type      | Description                                                                                                      |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `prefix`       | `string`  | Look up `<prefix><NAME>` first and fall back to `<NAME>` when the prefixed variable is not set.                  |
| `disableUnset` | `boolean` | Ignore all `unset` flags, keeping variables in `process.env`. Handy in tests and local development.              |

## Development

```sh
pnpm install
pnpm test       # run the tests with vitest
pnpm test:ci    # run the tests with coverage
pnpm build      # build with tsdown
pnpm check      # biome check + tsc
pnpm lint       # biome lint
pnpm format     # biome format --write
```

## Release

Releases are managed with [changesets](https://github.com/changesets/changesets).
Add a changeset for every user-facing change:

```sh
pnpm changeset
```

When changes land on `main`, the release workflow opens a "version packages"
pull request; merging it publishes the new version to npm.

## License

[MIT](./LICENSE)
