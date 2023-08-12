import { KnownTypes, coerceValue, getDefaultValue, validateType } from './parse'

type Validator = (value: any) => void
const INTERNAL_KEY = '__envVariables'

type PropertyOptions = {
  optional?: boolean
  validator?: Validator
  unset?: boolean

  envName?: string
  envSeparator?: string
}

type decorateOpts = {
  type: KnownTypes
  prefix?: string
} & PropertyOptions

type EnvVariableDict = Record<string, decorateOpts>

type LoadOptions = {
  prefix?: string
}

function decorate(options: decorateOpts): PropertyDecorator {
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
  public load(options?: LoadOptions): void {
    const properties = this.getConfigs()
    const instance = this as any
    for (const [key, config] of Object.entries(properties)) {
      const propertyConfig: decorateOpts = {
        ...config,
        prefix: options?.prefix,
      }
      instance[key] = this.loadProperty(key, propertyConfig, instance[key])
    }
  }

  static load<T extends BaseConfig>(
    this: Constructor<T>,
    options?: LoadOptions
  ): T {
    const instance = new this()
    instance.load(options)
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
    let envName = options?.envName || propertyKey
    let envValue: string | undefined

    // Fallback to the unprefixed env variable if the prefixed one is not set
    if (options?.prefix) {
      if (process.env[options.prefix + envName]) {
        envName = options.prefix + envName
        envValue = process.env[envName]
      } else {
        envValue = process.env[envName]
      }
    } else {
      envValue = process.env[envName]
    }

    // Unset the value if needed
    if (options?.unset && envValue !== undefined) {
      delete process.env[envName]
    }

    // If the env variable is not set and the property is optional, return the
    // current (default) value. If the property is not optional and there is no
    // value set, throw an error.
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

export const envprop = {
  number: (options?: PropertyOptions) =>
    decorate({ type: 'number', ...options }),
  string: (options?: PropertyOptions) =>
    decorate({ type: 'string', ...options }),
  object: (options?: PropertyOptions) =>
    decorate({ type: 'object', ...options }),
  boolean: (options?: PropertyOptions) =>
    decorate({ type: 'boolean', ...options }),
}
