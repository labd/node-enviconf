import {
	KnownTypes,
	coerceValue,
	getDefaultValue,
	validateType,
} from "./parse";

type Validator = (value: any) => void;
const INTERNAL_KEY = "__envVariables";

type DecoratorArgs = {
	optional?: boolean;
	validator?: Validator;
	unset?: boolean;

	envName?: string;
	envSeparator?: string;
};

type PropertyOptions = {
	type: KnownTypes;
	prefix?: string;
} & DecoratorArgs;

type EnvVariableDict = Record<string, PropertyOptions>;

type LoadOptions = {
	prefix?: string;
};

/**
 * Decorator implementation. It only adds an item to the class property
 * `__envVariables` with the name of the property as key and the options passed
 * to the decorator as value. The property is then used by the `load` method
 * via `getConfigs` to process the options and load the environment variable.
 */
function decorate(options: PropertyOptions): PropertyDecorator {
	return function (target: object, propertyKey: string | symbol) {
		storePropertyOptions(target, propertyKey.toString(), options);
	};
}

// Store the options for the property in the class prototype. We have to do it
// this way because decorators are executed before the constructor is called.
// This means that we can't store the options in the instance because it doesn't
// exist yet.
const storePropertyOptions = (
	target: object,
	key: string,
	options: PropertyOptions
) => {
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
	envVariableConfigs[key] = options;
};



interface Constructor<M> {
	new (...args: any[]): M;
}

export class BaseConfig {
	private __configureCalled = false;

	public load(options?: LoadOptions): void {
		this.configure();
		if (!this.__configureCalled) {
			throw new Error(
				"configure() not called, did you forget to call super.configure()?"
			);
		}

		const properties = this.getConfigs();
		const instance = this as any;
		for (const [key, config] of Object.entries(properties)) {
			const propertyConfig: PropertyOptions = {
				...config,
				prefix: options?.prefix,
			};
			instance[key] = this.loadProperty(key, propertyConfig, instance[key]);
		}
	}

	protected configure(): void {
		this.__configureCalled = true;
	}

	protected registerProperty(
		propertyKey: string,
		options: PropertyOptions
	): void {
		const target = Object.getPrototypeOf(this);
		storePropertyOptions(target, propertyKey, options);
	}

	static load<T extends BaseConfig>(
		this: Constructor<T>,
		options?: LoadOptions
	): T {
		const instance = new this();
		instance.load(options);
		return instance;
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

	/**
	 * loadProperty is repsonsible for loading the environment variable, coercing
	 * it to the correct type and validating it.
	 */
	private loadProperty(
		propertyKey: string,
		options: PropertyOptions | undefined,
		currentValue: any
	): any {
		let envName = options?.envName || propertyKey;
		let envValue: string | undefined;

		// Fallback to the unprefixed env variable if the prefixed one is not set
		if (options?.prefix) {
			if (process.env[options.prefix + envName]) {
				envName = options.prefix + envName;
				envValue = process.env[envName];
			} else {
				envValue = process.env[envName];
			}
		} else {
			envValue = process.env[envName];
		}

		// Unset the value if needed
		if (options?.unset && envValue !== undefined) {
			delete process.env[envName];
		}

		// If the env variable is not set and the property is optional, return the
		// current (default) value. If the property is not optional and there is no
		// value set, throw an error.
		if (envValue === undefined) {
			if (currentValue !== undefined) {
				return currentValue;
			}

			if (options?.optional) {
				return getDefaultValue(options?.type || "string");
			}

			throw new Error(`Missing required env variable ${envName}`);
		}

		let parsedValue: any = envValue;

		// If envSeparate is defined we assume that the value is an array. Split the
		// value and coerce each value to the given type.
		if (options?.envSeparator) {
			parsedValue = parsedValue
				.split(options.envSeparator)
				.map((value: string) => coerceValue(options?.type, value.trim()));

			// Validate the type of each value
			parsedValue.forEach((value: any, index: number) => {
				try {
					validateType(options?.type, value);
				} catch (err: any) {
					throw new Error(
						`Invalid type for ${envName}[${index}] = ${JSON.stringify(
							value
						)}: ${err.message}`
					);
				}
			});
		} else {
			// Try to parse the value with JSON, if it fails then assume it's a string
			try {
				parsedValue = JSON.parse(envValue);
			} catch {
				parsedValue = envValue;
			}
			try {
				validateType(options?.type, parsedValue);
			} catch (err: any) {
				throw new Error(
					`Invalid type for ${envName} = ${JSON.stringify(parsedValue)}: ${
						err.message
					}`
				);
			}
		}

		if (options?.validator) {
			options?.validator(parsedValue);
		}

		return parsedValue;
	}
}

export const envprop = {
	number: (options?: DecoratorArgs) => decorate({ type: "number", ...options }),
	string: (options?: DecoratorArgs) => decorate({ type: "string", ...options }),
	object: (options?: DecoratorArgs) => decorate({ type: "object", ...options }),
	boolean: (options?: DecoratorArgs) =>
		decorate({ type: "boolean", ...options }),
};
