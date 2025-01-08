export type KnownTypes = "string" | "number" | "boolean" | "object" | "hash";

// validateType is a helper function to validate the type of a value. Throws
// an error if the type is invalid.
export const validateType = (type: KnownTypes = "string", value: any): void => {
	switch (type) {
		case "hash":
		case "string":
			if (typeof value !== "string") {
				throw new Error(`Expected string but got ${typeof value}`);
			}
			break;
		case "number":
			if (typeof value !== "number") {
				throw new Error(`Expected number but got ${typeof value}`);
			}
			if (isNaN(value)) {
				throw new Error(`Expected number but got ${typeof value}`);
			}
			break;
		case "boolean":
			if (typeof value !== "boolean") {
				throw new Error(`Expected boolean but got ${typeof value}`);
			}
			break;
		case "object":
			if (typeof value !== "object") {
				throw new Error(`Expected object but got ${typeof value}`);
			}
			break;
		default:
			throw new Error(`Invalid type ${type}`);
	}
};

export const getDefaultValue = (type: KnownTypes): any => {
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
};

export const coerceValue = (type: KnownTypes, value: string): any => {
	switch (type) {
		case "string":
			return value.toString();
		case "number": {
			const result = parseInt(value, 10);
			if (isNaN(result)) {
				return value.toString();
			}
			return result;
		}
		case "boolean":
			return value.toLowerCase() === "true";
		case "object":
			return JSON.parse(value);
		default:
			return value.toString();
	}
};
