import { config as dotenvConfig } from 'dotenv'

type Validator = (value: any) => void
type KnownTypes = 'string' | 'number' | 'boolean' | 'object'
const INTERNAL_KEY = '__envVariables'

type EnvVariableOptions = {
  type: KnownTypes
  required?: boolean
  validator?: Validator
  unset?: boolean

  envName?: string
  envSeparator?: string
}

type EnvVariableDict = Record<string, EnvVariableOptions | undefined>

export function EnvVariable(options?: EnvVariableOptions): PropertyDecorator {
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
    options: EnvVariableOptions | undefined,
    currentValue: any
  ): any {
    const envName = options?.envName || propertyKey
    const envValue = process.env[envName]

    if (!envValue) {
      if (options?.required) {
        throw new Error(`Missing required env variable ${envName}`)
      }

      return currentValue !== undefined
        ? currentValue
        : this.getDefaultValue(options?.type || 'string')
    }

    let parsedValue: any = envValue

    // If envSeparate is defined we assume that the value is an array. Split the
    // value and coerce each value to the given type.
    if (options?.envSeparator) {
      parsedValue = parsedValue
        .split(options.envSeparator)
        .map((value: string) => this.coerceValue(options?.type, value.trim()))

      // Validate the type of each value
      parsedValue.forEach((value: any, index: number) => {
        try {
          this.validateType(options?.type, value)
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
        this.validateType(options?.type, parsedValue)
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

  // validateType is a helper function to validate the type of a value. Throws
  // an error if the type is invalid.
  private validateType(type: KnownTypes = 'string', value: any): void {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Expected string but got ${typeof value}`)
        }
        break
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Expected number but got ${typeof value}`)
        }
        if (isNaN(value)) {
          throw new Error(`Expected number but got ${typeof value}`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Expected boolean but got ${typeof value}`)
        }
        break
      case 'object':
        if (typeof value !== 'object') {
          throw new Error(`Expected object but got ${typeof value}`)
        }
        break
      default:
        throw new Error(`Invalid type ${type}`)
    }
  }

  private getDefaultValue(type: KnownTypes): any {
    switch (type) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'object':
        return {}
      default:
        return undefined
    }
  }

  private coerceValue(type: KnownTypes, value: string): any {
    switch (type) {
      case 'string':
        return value.toString()
      case 'number': {
        const result = parseInt(value, 10)
        if (isNaN(result)) {
          return value.toString()
        }
        return result
      }
      case 'boolean':
        return value.toLowerCase() === 'true'
      case 'object':
        return JSON.parse(value)
      default:
        return value.toString()
    }
  }
}
