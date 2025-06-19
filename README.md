# @labdigital/enviconf

A simple configuration library that loads configuration from environment
variables and provides a simple interface to access them.

Inspired by https://github.com/caarlos0/env


## Example

```ts

import { BaseConfig, EnviConfig, envfield } from "@labdigital/enviconf";

class SampleConfig extends BaseConfig {
	/** The port number to listen on */
	readonly HTTP_PORT: number = 4000

	config(): EnviConfig {
		return {
			HTTP_PORT: envfield.number({
				// optional, defaults to false. Sets empty value if no env variable is set
				optional: true,

				// optional, defaults to false. Unsets the env variable after reading
				unset: true,

				// optional, env variable to read the value from, defaults to the property name
				envName: "MY_HTTP_PORT",

				// optional, defaults to undefined. Allows setting a custom validator, should
				// throw an error if the value is invalid
				validator:  (value: number) => value > 0,
			}),
		}
	}
}
const config = SampleConfig.load()

config.HTTP_PORT === 4000
```
