import { config as dotenvConfig } from 'dotenv'
import { KnownTypes, coerceValue, getDefaultValue, validateType } from './parse'

type Validator = (value: any) => void
const INTERNAL_KEY = '__envVariables'

type EnvVariableOptions = {
  optional?: boolean
  validator?: Validator
  unset?: boolean

  envName?: string
  envSeparator?: string
}

type decorateOpts = {
  type: KnownTypes
} & EnvVariableOptions

type EnvVariableDict = Record<string, decorateOpts | undefined>

function decorate(options?: decorateOpts): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    let envVariableConfigs: EnvVariableDict = (target as any)[INTERNAL_KEY]

    // eslint-disable-next-line no-prototype-builtins
    if (!target.hasOwnProperty(INTERNAL_KEY)) {
      envVariableConfigs = {}
      Object.defineProperty(target, INTERNAL_KEY, {
        value: envVariableConfigs,
        writable: false,
        enumerable: false,
        configurable: true,
      })
    }
    envVariableConfigs[propertyKey.toString()] = options
  }
}

interface Constructor<M> {
  new (...args: any[]): M
}

export class BaseConfig {
  constructor(private loadEnv: boolean = true) {}

  public load(): void {
    if (this.loadEnv) {
      dotenvConfig()
    }

    const properties = this.getConfigs()

    const instance = this as any
    for (const [key, config] of Object.entries(properties)) {
      instance[key] = this.loadProperty(key, config, instance[key])
    }
  }

  static load<T extends BaseConfig>(this: Constructor<T>): T {
    const instance = new this()
    instance.load()
    return instance
  }

  private getConfigs() {
    let result: EnvVariableDict = {}

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let target = this
    while (target) {
      const configs: EnvVariableDict = (target as any)[INTERNAL_KEY] || {}

      result = { ...result, ...configs }
      target = Object.getPrototypeOf(target)
    }
    return result
  }

  private loadProperty(
    propertyKey: string,
    options: decorateOpts | undefined,
    currentValue: any
  ): any {
    const envName = options?.envName || propertyKey
    const envValue = process.env[envName]

    if (envValue === undefined) {
      if (currentValue !== undefined) {
        return currentValue
      }

      if (options?.optional) {
        return getDefaultValue(options?.type || 'string')
      }

      throw new Error(`Missing required env variable ${envName}`)
    }

    let parsedValue: any = envValue

    // If envSeparate is defined we assume that the value is an array. Split the
    // value and coerce each value to the given type.
    if (options?.envSeparator) {
      parsedValue = parsedValue
        .split(options.envSeparator)
        .map((value: string) => coerceValue(options?.type, value.trim()))

      // Validate the type of each value
      parsedValue.forEach((value: any, index: number) => {
        try {
          validateType(options?.type, value)
        } catch (err: any) {
          throw new Error(
            `Invalid type for ${envName}[${index}] = ${JSON.stringify(
              value
            )}: ${err.message}`
          )
        }
      })
    } else {
      // Try to parse the value with JSON, if it fails then assume it's a string
      try {
        parsedValue = JSON.parse(envValue)
      } catch {
        parsedValue = envValue
      }
      try {
        validateType(options?.type, parsedValue)
      } catch (err: any) {
        throw new Error(
          `Invalid type for ${envName} = ${JSON.stringify(parsedValue)}: ${
            err.message
          }`
        )
      }
    }

    if (options?.validator) {
      options?.validator(parsedValue)
    }

    return parsedValue
  }
}

export const EnvVariable = decorate

export const envprop = {
  number: (options?: EnvVariableOptions) =>
    decorate({ type: 'number', ...options }),
  string: (options?: EnvVariableOptions) =>
    decorate({ type: 'string', ...options }),
}
