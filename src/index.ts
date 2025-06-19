import {
	coerceValue,
	getDefaultValue,
	type KnownTypes,
	validateType,
} from "./parse";

type Validator = (value: any) => void;

type FieldOptions = {
	optional?: boolean;
	validator?: Validator;
	unset?: boolean;

	envName?: string;
	envSeparator?: string;
};

type PropertyOptions = {
	type: KnownTypes;
	prefix?: string;
} & FieldOptions;

type EnvVariableDict = Record<string, PropertyOptions>;

type LoadOptions = {
	prefix?: string;
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
				"configure() not called, did you forget to call super.configure()?",
			);
		}

		const properties = this.config();
		const instance = this as any;
		for (const [key, config] of Object.entries(properties)) {
			const propertyConfig: PropertyOptions = {
				...config,
				prefix: options?.prefix,
			};
			instance[key] = this.loadProperty(key, propertyConfig, instance[key]);
		}
	}

	static load<T extends BaseConfig>(
		this: Constructor<T>,
		options?: LoadOptions,
	): T {
		const instance = new this();
		instance.load(options);
		return instance;
	}

	protected configure(): void {
		this.__configureCalled = true;
	}

	protected config(): EnvVariableDict {
		return {};
	}

	/**
	 * loadProperty is responsible for loading the environment variable, coercing
	 * it to the correct type and validating it.
	 */
	private loadProperty(
		propertyKey: string,
		options: PropertyOptions | undefined,
		currentValue: any,
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
					validateType(options?.type ?? "string", value);
				} catch (err: unknown) {
					throw new Error(
						`Invalid type for ${envName}[${index}] = ${JSON.stringify(
							value,
						)}: ${(err as Error).message}`,
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
				validateType(options?.type ?? "string", parsedValue);
			} catch (err: unknown) {
				throw new Error(
					`Invalid type for ${envName} = ${JSON.stringify(parsedValue)}: ${(err as Error).message}`,
				);
			}
		}

		if (options?.validator) {
			options?.validator(parsedValue);
		}

		return parsedValue;
	}
}

export const envfield = {
	number: (options?: FieldOptions) => ({
		type: "number" as KnownTypes,
		...options,
	}),
	string: (options?: FieldOptions) => ({
		type: "string" as KnownTypes,
		...options,
	}),
	object: (options?: FieldOptions) => ({
		type: "object" as KnownTypes,
		...options,
	}),
	boolean: (options?: FieldOptions) => ({
		type: "boolean" as KnownTypes,
		...options,
	}),
	secret: (options?: Omit<FieldOptions, "unset">) => ({
		type: "string" as KnownTypes,
		...options,
		unset: true,
	}),
};

export type EnviConfig = EnvVariableDict;
