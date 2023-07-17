import { EnvVariable, BaseConfig, envprop } from './index'
import { describe, beforeEach, it, vi, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach } from 'node:test'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should load environment variables and set instance properties with default values', () => {
    // Define a sample class that extends BaseConfig
    class SampleConfig extends BaseConfig {
      @envprop.string()
      public readonly MY_STRING_VARIABLE: string = 'default value'

      @envprop.number()
      public readonly MY_NUMBER_VARIABLE: number = 123

      @envprop.string({ envSeparator: ',' })
      public readonly MY_ARRAY_VARIABLE: string[] = ['one']
    }

    const config = new SampleConfig()
    config.load()

    // Verify that the instance properties are set correctly
    expect(config.MY_STRING_VARIABLE).toBe('default value')
    expect(config.MY_NUMBER_VARIABLE).toBe(123)
    expect(config.MY_ARRAY_VARIABLE).toStrictEqual(['one'])
  })

  it('should load environment variables and set instance properties with values from process.env', () => {
    vi.stubEnv('MY_STRING_VARIABLE', 'custom value')
    vi.stubEnv('MY_NUMBER_VARIABLE', '456')
    vi.stubEnv('MY_ARRAY_VARIABLE', 'one,two,three')

    class SampleConfig extends BaseConfig {
      @envprop.string()
      readonly MY_STRING_VARIABLE: string = 'default value'

      @envprop.number()
      readonly MY_NUMBER_VARIABLE: number

      @envprop.string({ envSeparator: ',' })
      readonly MY_ARRAY_VARIABLE: string[]
    }

    const config = SampleConfig.load()

    expect(config.MY_STRING_VARIABLE).toBe('custom value')
    expect(config.MY_NUMBER_VARIABLE).toBe(456)
    expect(config.MY_ARRAY_VARIABLE).toStrictEqual(['one', 'two', 'three'])
  })

  it('should load environment variables from path', () => {
    const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/`)
    const tmpFile = path.join(tmpDir, 'my-dot-env')
    fs.writeFileSync(tmpFile, `MY_STRING_VARIABLE=custom .env value\n`)

    // Define a sample class that extends BaseConfig
    class SampleConfig extends BaseConfig {
      @envprop.string()
      public readonly MY_STRING_VARIABLE: string = 'default value'

      @envprop.number()
      public readonly MY_NUMBER_VARIABLE: number = 123

      @envprop.string({ envSeparator: ',' })
      public readonly MY_ARRAY_VARIABLE: string[] = ['one']
    }

    const config = new SampleConfig()
    config.load({ path: tmpFile })

    fs.rmSync(tmpDir, { recursive: true })

    // Verify that the instance properties are set correctly
    expect(config.MY_STRING_VARIABLE).toBe('custom .env value')
    expect(config.MY_NUMBER_VARIABLE).toBe(123)
    expect(config.MY_ARRAY_VARIABLE).toStrictEqual(['one'])

    // cleanup
    delete process.env.MY_STRING_VARIABLE
  })

  it('should NOT load environment variables from path', () => {
    const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/`)
    const tmpFile = path.join(tmpDir, 'my-dot-env')
    fs.writeFileSync(tmpFile, `MY_STRING_VARIABLE=custom .env value\n`)

    expect(process.env.MY_STRING_VARIABLE).toBeUndefined()

    // Define a sample class that extends BaseConfig
    class SampleConfig extends BaseConfig {
      @envprop.string()
      public readonly MY_STRING_VARIABLE: string = 'default value'

      @envprop.number()
      public readonly MY_NUMBER_VARIABLE: number = 123

      @envprop.string({ envSeparator: ',' })
      public readonly MY_ARRAY_VARIABLE: string[] = ['one']
    }

    const config = new SampleConfig()
    config.load({ path: tmpFile, loadEnv: false })

    fs.rmSync(tmpDir, { recursive: true })

    // Verify that the instance properties are set correctly
    expect(config.MY_STRING_VARIABLE).toBe('default value')
    expect(config.MY_NUMBER_VARIABLE).toBe(123)
    expect(config.MY_ARRAY_VARIABLE).toStrictEqual(['one'])
  })

})

describe('validate', () => {
  it('should throw an error for missing required environment variable', () => {
    class SampleConfig extends BaseConfig {
      @envprop.string()
      public MY_REQUIRED_VARIABLE: string
    }

    const config = new SampleConfig()

    expect(() => {
      config.load()
    }).toThrowError('Missing required env variable MY_REQUIRED_VARIABLE')
  })

  it('should allow optional values for environment variable', () => {
    class SampleConfig extends BaseConfig {
      @envprop.string({ optional: true })
      public MY_OPTIONAL_VARIABLE: string
    }

    const config = new SampleConfig()
    config.load()
    expect(config.MY_OPTIONAL_VARIABLE).toBe('')
  })

  it('should throw an error for invalid type of environment variable', () => {
    vi.stubEnv('MY_NUMBER_VARIABLE', 'some-string')

    class SampleConfig extends BaseConfig {
      @EnvVariable({ type: 'number' })
      public MY_NUMBER_VARIABLE: number
    }

    const config = new SampleConfig()

    expect(() => {
      config.load()
    }).toThrowError(
      'Invalid type for MY_NUMBER_VARIABLE = "some-string": Expected number but got string'
    )
  })

  it('should throw an error for invalid type of item in environment variable', () => {
    vi.stubEnv('MY_NUMBERS', '1,two,3')

    class SampleConfig extends BaseConfig {
      @envprop.number({ envSeparator: ',' })
      public MY_NUMBERS: number[]
    }

    const config = new SampleConfig()

    expect(() => {
      config.load()
    }).toThrowError(
      'Invalid type for MY_NUMBERS[1] = "two": Expected number but got string'
    )
  })
})
