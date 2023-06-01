import { config as dotenvConfig } from "dotenv";

type Validator = (value: any) => void;
type KnownTypes = "string" | "number" | "boolean" | "object";
const INTERNAL_KEY = "__envVariables";

type EnvVariableOptions = {
  type: KnownTypes;
  required?: boolean;
  validator?: Validator;
  unset?: boolean;

  envName?: string;
  envSeparator?: string;
};

type EnvVariableDict = Record<string, EnvVariableOptions | undefined>;

export function EnvVariable(options?: EnvVariableOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    let envVariableConfigs: EnvVariableDict = (target as any)[INTERNAL_KEY];

    // eslint-disable-next-line no-prototype-builtins
    if (!target.hasOwnProperty(INTERNAL_KEY)) {
      envVariableConfigs = {};
      Object.defineProperty(target, INTERNAL_KEY, {
        value: envVariableConfigs,
        writable: false,
        enumerable: false,
        configurable: true,
      });
    }
    envVariableConfigs[propertyKey.toString()] = options;
  };
}

export class BaseConfig {
  constructor(private loadEnv: boolean = true) {}

  public load(): void {
    if (this.loadEnv) {
      dotenvConfig();
    }

    const properties = this.getConfigs();

    const instance = this as any;
    for (const [key, config] of Object.entries(properties)) {
      instance[key] = this.loadProperty(key, config, instance[key]);
    }
  }

  private getConfigs() {
    let result: EnvVariableDict = {};

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let target = this;
    while (target) {
      const configs: EnvVariableDict = (target as any)[INTERNAL_KEY] || {};

      result = { ...result, ...configs };
      target = Object.getPrototypeOf(target);
    }
    return result;
  }

  private loadProperty(
    propertyKey: string,
    options: EnvVariableOptions | undefined,
    currentValue: any
  ): any {
    const envName = options?.envName || propertyKey;
    const envValue = process.env[envName];

    if (!envValue) {
      if (options?.required) {
        throw new Error(`Missing required env variable ${envName}`);
      }

      return currentValue !== undefined
        ? currentValue
        : this.getDefaultValue(options?.type || "string");
    }

    let parsedValue = envValue;

    // Try to parse the value with JSON, if it fails then assume it's a string
    try {
      parsedValue = JSON.parse(envValue);
    } catch {
      parsedValue = envValue;
    }

    if (options?.type && typeof parsedValue !== options.type) {
      throw new Error(
        `Invalid type for ${propertyKey.toString()}. Expected ${
          options.type
        } but got ${typeof parsedValue}`
      );
    }

    if (options?.validator) {
      options?.validator(parsedValue);
    }

    return parsedValue;
  }

  private getDefaultValue(type: KnownTypes): any {
    switch (type) {
      case "string":
        return "";
      case "number":
        return 0;
      case "boolean":
        return false;
      case "object":
        return {};
      default:
        return undefined;
    }
  }
}
