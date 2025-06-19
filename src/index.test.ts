import { BaseConfig, envfield, EnviConfig } from "./index";
import { describe, afterEach, beforeEach, it, vi, expect } from "vitest";

beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllEnvs();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("initialization", () => {
	it("should load environment variables and set instance properties with default values", () => {
		// Define a sample class that extends BaseConfig
		class SampleConfig extends BaseConfig {
			public readonly MY_STRING_VARIABLE: string = "default value";

			public readonly MY_NUMBER_VARIABLE: number = 123;

			public readonly MY_ARRAY_VARIABLE: string[] = ["one"];

			config(): EnviConfig {
				return {
					MY_STRING_VARIABLE: envfield.string(),
					MY_NUMBER_VARIABLE: envfield.number(),
					MY_ARRAY_VARIABLE: envfield.string({
						envSeparator: ",",
					}),
				};
			}
		}

		const config = new SampleConfig();
		config.load();

		// Verify that the instance properties are set correctly
		expect(config.MY_STRING_VARIABLE).toBe("default value");
		expect(config.MY_NUMBER_VARIABLE).toBe(123);
		expect(config.MY_ARRAY_VARIABLE).toStrictEqual(["one"]);
	});

	it("should load environment variables and set instance properties with values from process.env", () => {
		vi.stubEnv("MY_STRING_VARIABLE", "custom value");
		vi.stubEnv("MY_NUMBER_VARIABLE", "456");
		vi.stubEnv("MY_ARRAY_VARIABLE", "one,two,three");

		class SampleConfig extends BaseConfig {
			readonly MY_STRING_VARIABLE: string = "default value";

			readonly MY_NUMBER_VARIABLE: number;

			readonly MY_ARRAY_VARIABLE: string[];

			config(): EnviConfig {
				return {
					MY_STRING_VARIABLE: envfield.string(),
					MY_NUMBER_VARIABLE: envfield.number(),
					MY_ARRAY_VARIABLE: envfield.string({
						envSeparator: ",",
					}),
				};
			}
		}

		const config = SampleConfig.load();

		expect(config.MY_STRING_VARIABLE).toBe("custom value");
		expect(config.MY_NUMBER_VARIABLE).toBe(456);
		expect(config.MY_ARRAY_VARIABLE).toStrictEqual(["one", "two", "three"]);
	});

	it("should load environment variables with prefix", () => {
		vi.stubEnv("MY_APP_MY_STRING_VARIABLE", "custom value");
		vi.stubEnv("MY_NUMBER_VARIABLE", "456");

		class SampleConfig extends BaseConfig {
			readonly MY_STRING_VARIABLE: string = "default value";

			readonly MY_NUMBER_VARIABLE: number;

			config: () => EnviConfig = () => ({
				MY_STRING_VARIABLE: envfield.string(),
				MY_NUMBER_VARIABLE: envfield.number(),
			});
		}

		const config = SampleConfig.load({
			prefix: "MY_APP_",
		});

		expect(config.MY_STRING_VARIABLE).toBe("custom value");
		expect(config.MY_NUMBER_VARIABLE).toBe(456);
	});
});

describe("validate", () => {
	it("should throw an error for missing required environment variable", () => {
		class SampleConfig extends BaseConfig {
			public MY_REQUIRED_VARIABLE: string;

			config(): EnviConfig {
				return {
					MY_REQUIRED_VARIABLE: envfield.string(),
				};
			}
		}

		const config = new SampleConfig();

		expect(() => {
			config.load();
		}).toThrowError("Missing required env variable MY_REQUIRED_VARIABLE");
	});

	it("should allow optional values for environment variable", () => {
		class SampleConfig extends BaseConfig {
			public MY_OPTIONAL_VARIABLE: string;

			config(): EnviConfig {
				return {
					MY_OPTIONAL_VARIABLE: envfield.string({ optional: true }),
				};
			}
		}

		const config = new SampleConfig();
		config.load();
		expect(config.MY_OPTIONAL_VARIABLE).toBe("");
	});

	it("should throw an error for invalid type of environment variable", () => {
		vi.stubEnv("MY_NUMBER_VARIABLE", "some-string");

		class SampleConfig extends BaseConfig {
			public MY_NUMBER_VARIABLE: number;

			config(): EnviConfig {
				return {
					MY_NUMBER_VARIABLE: envfield.number(),
				};
			}
		}

		const config = new SampleConfig();

		expect(() => {
			config.load();
		}).toThrowError(
			'Invalid type for MY_NUMBER_VARIABLE = "some-string": Expected number but got string'
		);
	});

	it("should throw an error for invalid type of item in environment variable", () => {
		vi.stubEnv("MY_NUMBERS", "1,two,3");

		class SampleConfig extends BaseConfig {
			public MY_NUMBERS: number[];

			config(): EnviConfig {
				return {
					MY_NUMBERS: envfield.number({
						envSeparator: ",",
					}),
				};
			}
		}

		const config = new SampleConfig();

		expect(() => {
			config.load();
		}).toThrowError(
			'Invalid type for MY_NUMBERS[1] = "two": Expected number but got string'
		);
	});

	it("should unset value after reading environment variable", () => {
		vi.stubEnv("MY_SECRET_VARIABLE", "some-secret");

		class SampleConfig extends BaseConfig {
			public MY_SECRET_VARIABLE: string;

			config(): EnviConfig {
				return {
					MY_SECRET_VARIABLE: envfield.string({ unset: true }),
				};
			}
		}

		const config = new SampleConfig();
		config.load();
		expect(config.MY_SECRET_VARIABLE).toBe("some-secret");
		expect(process.env.MY_SECRET_VARIABLE).toBeUndefined();
	});
});

describe("inheritance", () => {
	it("should load environment variables and set instance properties with default values", () => {
		// Define a sample class that extends BaseConfig
		class BaseSampleConfig extends BaseConfig {
			public readonly MY_STRING_VARIABLE: string = "default value";
		}

		class SampleConfig extends BaseSampleConfig {
			public readonly MY_NUMBER_VARIABLE: number = 123;

			public readonly MY_ARRAY_VARIABLE: string[] = ["one"];

			config(): EnviConfig {
				return {
					MY_STRING_VARIABLE: envfield.string(),
					MY_NUMBER_VARIABLE: envfield.number(),
					MY_ARRAY_VARIABLE: envfield.string({
						envSeparator: ",",
					}),
					...super.config(),
				};
			}
		}

		const config = new SampleConfig();
		config.load();

		// Verify that the instance properties are set correctly
		expect(config.MY_STRING_VARIABLE).toBe("default value");
		expect(config.MY_NUMBER_VARIABLE).toBe(123);
		expect(config.MY_ARRAY_VARIABLE).toStrictEqual(["one"]);
	});
});
