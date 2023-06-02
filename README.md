# @labdigital/enviconf

A simple configuration library that loads configuration from environment
variables and provides a simple interface to access them.

Inspired by https://github.com/caarlos0/env


## Example

```ts

import { EnvVariable, BaseConfig } from "@labdigital/enviconf";

class SampleConfig extends BaseConfig {
  @EnvVariable({ type: "string" })
  public readonly MY_STRING_VARIABLE: string = "default value";

  @EnvVariable({ type: "number" })
  public readonly MY_NUMBER_VARIABLE: number = 123;
}

const config = new SampleConfig();
config.load()
```
