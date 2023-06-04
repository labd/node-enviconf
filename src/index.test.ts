import { EnvVariable, BaseConfig } from "./index";

// Mock the dotenv.config() function
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("BaseConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("load", () => {
    it("should load environment variables and set instance properties with default values", () => {
      // Define a sample class that extends BaseConfig
      class SampleConfig extends BaseConfig {
        @EnvVariable({ type: "string" })
        public readonly MY_STRING_VARIABLE: string = "default value";

        @EnvVariable({ type: "number" })
        public readonly MY_NUMBER_VARIABLE: number = 123;
      }

      const config = new SampleConfig();
      config.load();

      // Verify that the instance properties are set correctly
      expect(config.MY_STRING_VARIABLE).toBe("default value");
      expect(config.MY_NUMBER_VARIABLE).toBe(123);
    });

    it("should load environment variables and set instance properties with values from process.env", () => {
      process.env.MY_STRING_VARIABLE = "custom value";
      process.env.MY_NUMBER_VARIABLE = "456";

      class SampleConfig extends BaseConfig {
        @EnvVariable({ type: "string" })
        public readonly MY_STRING_VARIABLE: string = "default value";

        @EnvVariable({ type: "number" })
        public readonly MY_NUMBER_VARIABLE: number;
      }

      const config = SampleConfig.load()

      expect(config.MY_STRING_VARIABLE).toBe("custom value");
      expect(config.MY_NUMBER_VARIABLE).toBe(456);
    });

    it("should throw an error for missing required environment variable", () => {
      class SampleConfig extends BaseConfig {
        @EnvVariable({ type: "string", required: true })
        public MY_REQUIRED_VARIABLE: string;
      }

      const config = new SampleConfig();

      expect(() => {
        config.load();
      }).toThrowError("Missing required env variable MY_REQUIRED_VARIABLE");
    });

    it("should throw an error for invalid type of environment variable", () => {
      process.env.MY_NUMBER_VARIABLE = "not a number";

      class SampleConfig extends BaseConfig {
        @EnvVariable({ type: "number" })
        public MY_NUMBER_VARIABLE: number;
      }

      const config = new SampleConfig();

      expect(() => {
        config.load();
      }).toThrowError(
        "Invalid type for MY_NUMBER_VARIABLE. Expected number but got string"
      );
    });
  });
});
