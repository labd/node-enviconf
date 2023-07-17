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
}

const config = SampleConfig.load({
  path: ".env", // optional
  loadEnv: true, // optional, defaults to true
})
```
