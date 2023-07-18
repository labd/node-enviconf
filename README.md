# @labdigital/enviconf

A simple configuration library that loads configuration from environment
variables and provides a simple interface to access them.

Inspired by https://github.com/caarlos0/env


## Example

```ts

import { BaseConfig, envprop } from "@labdigital/enviconf";

class SampleConfig extends BaseConfig {
  @envprop.string()
  public readonly MY_STRING_VARIABLE: string = "default value";

  @envprop.number()
  public readonly MY_NUMBER_VARIABLE: number = 123;

  // Read JSON values
  @envprop.object()
  public readonly MY_OBJECT_VALUE: object = { foo: "bar" };

  @envprop.number({
    // optional, defaults to false. Sets empty value if no env variable is set
    optional: true,

    // optional, defaults to false. Unsets the env variable after reading
    unset: true,

    // optional, env variable to read the value from, defaults to the property name
    envName: "MY_OTHER_ENV_VARIABLE",

    // optional, defaults to ", ". Allows setting a custom separator for array values
    envSeparator: ", ",

    // optional, defaults to undefined. Allows setting a custom validator, should
    // throw an error if the value is invalid
    validator:  (value: number) => value > 0,
  })
  public readonly ALL_OPTIONS: number = 123;
}

const config = SampleConfig.load({
  // optional, path to the .env values, defaults to ".env"
  path: ".env",

  // optional, indicates if a .env file should be read, defaults to true
  loadEnv: true,

  // optional, if set, will be used as prefix for all env variables while
  // falling back to the original name if the prefixed variable is not set
  envPrefix: "MY_APP_",
})
```
