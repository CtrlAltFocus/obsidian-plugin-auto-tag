import {LlmModel} from "./models/openai.models";

export const OPENAI_API_MODELS: LlmModel[] = [
	{
		id: "gpt-3.5-turbo-1106",
		name: "GPT-3.5 Turbo (1106)",
		features: ["function-calling"],
		context: 16000,
		inputCost1KTokens: 0.0010,
		outputCost1KTokens: 0.0020
	}
	// For now no point in using GPT-4, it's not much better than GPT-3.5 Turbo for this task and more expensive
	// {
	// 	id: "gpt-4",
	// 	name: "GPT-4",
	// 	features: ["function-calling"],
	// 	context: 8000,
	// 	inputCost1KTokens: 0.03,
	// 	outputCost1KTokens: 0.06
	// },
	// {
	// 	id: "gpt-4-32k",
	// 	name: "GPT-4 (32K context)",
	// 	features: ["function-calling"],
	// 	context: 32000,
	// 	inputCost1KTokens: 0.06,
	// 	outputCost1KTokens: 0.12
	// }
];
