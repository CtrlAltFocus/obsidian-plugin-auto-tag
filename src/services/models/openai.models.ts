export type GptFunctionParameter = {
    type: "string" | "number" | "integer" | "boolean" | "array" | "object";
    description?: string;
    enum?: string[]; // For type: "string"
    items?: GptFunctionParameter; // For type: "array"
    properties?: Record<string, GptFunctionParameter>; // For type: "object"
    required?: string[]; // Required properties for type: "object"
};

export type GptFunction = {
    name: string;
    description?: string;
    parameters?: GptFunctionParameter;
};

export interface LlmModel {
	id: string;
	name: string;
	description?: string;
	features: ("function-calling")[];
	context: number;
	inputCost1KTokens: number;
	outputCost1KTokens: number;
	parameters?: {
		maxTokens: number;
		temperature: number;
		topP: number;
		presencePenalty: number;
		frequencyPenalty: number;
		stop: string[];
	};
}
