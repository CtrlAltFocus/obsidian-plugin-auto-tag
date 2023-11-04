import {GptFunction} from './models/openai.models';
import AutoTagPlugin from 'src/plugin/autoTagPlugin';
import {Notice, requestUrl, RequestUrlParam, RequestUrlResponse} from "obsidian";
import {createDocumentFragment} from "../utils/utils";

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const llmPromptTagSuggestions = 'You are ChatGPT, a helpful multi-lingual assistant and text analysis tool. You help with semantic understanding and text classification of received user input text and provide suggestions for tags that best allow to categorize and identify the text, for use in search engines or content link grouping. You will receive the input text from the user, delimited by the --start-- and --end-- tags.';

const gptTagHandlingFunctionDescription = 'This function needs to receive a list of tags, that you suggest based on the best matching tags that describe the user-provided input text. Return at least 1 tag. Return at most 10 tags. The tags should be in the language of the user-provided input text.';

export const OPENAI_API_MODELS = [
	{
		id: "gpt-3.5-turbo-0613",
		name: "GPT-3.5 Turbo (0613) [recommended]",
		features: ["function-calling"],
		context: 4000,
		inputCost1KTokens: 0.0015,
		outputCost1KTokens: 0.002
	},
	{
		id: "gpt-3.5-turbo-16-0613",
		name: "GPT-3.5 Turbo (0613) (16K context)",
		features: ["function-calling"],
		context: 16000,
		inputCost1KTokens: 0.003,
		outputCost1KTokens: 0.004
	},
	{
		id: "gpt-4-0613",
		name: "GPT-4 (0613)",
		features: ["function-calling"],
		context: 8000,
		inputCost1KTokens: 0.03,
		outputCost1KTokens: 0.06
	},
	{
		id: "gpt-4-32k-0613",
		name: "GPT-4 (0613) (32K context)",
		features: ["function-calling"],
		context: 32000,
		inputCost1KTokens: 0.06,
		outputCost1KTokens: 0.12
	}
];

export async function getTagSuggestions(inputText: string, openaiApiKey: string): Promise<string[] | null> {
	if (openaiApiKey === '' || !openaiApiKey) {
		new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: OpenAI API key is missing. Please add it in the plugin settings.`));
		return [];
	}

	const gptFunction: GptFunction = {
		name: 'handleTagSuggestions',
		// TODO set max number of tags to return based on value in settings
		description: gptTagHandlingFunctionDescription,
		parameters: {
			type: 'object',
			properties: {
				tags: {
					type: 'array',
					// TODO Adjust prompt to allow tagging in asian languages, arabic, etc.
					description:
						'An array of utf8 unicode values representing tags. Tags ideally should only contain lowercase letters and underscores. Tags might represent strings in various languages and alphabets.',
					items: {
						type: 'string',
					},
				},
			},
		},
	};

	try {
		const responseData: {
			tags?: string[],
			error?: { type: string, message: string, param: any, code: any }
		} = await fetchOpenAIFunctionCall(openaiApiKey, inputText, gptFunction);

		if (responseData?.tags) {
			AutoTagPlugin.Logger.debug('OpenAI API suggested tags:', JSON.stringify(responseData));
			return responseData.tags;
		} else if (responseData?.error) {
			AutoTagPlugin.Logger.error('OpenAI API response is missing a "tags" property.', JSON.stringify(responseData));
			new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: {{errorMessage}}`, {errorMessage: responseData.error.message}));
			throw new Error('OpenAI API response is missing a "tags" property.');
		}
	} catch (error) {
		throw Error(error?.message);
	}

	return [];
}

/**
 * Uses OpenAI's API to request tags for the given input text.
 * Uses Function Calling to easily handle the response.
 */
export async function fetchOpenAIFunctionCall(openaiApiKey: string, inputText: string, gptFunction: GptFunction): Promise<{
	tags: string[]
}> {
	if (inputText.trim().length === 0) {
		AutoTagPlugin.Logger.warn('fetchOpenAIFunctionCall: invalid input text.', JSON.stringify(inputText));
		throw new Error('fetchOpenAIFunctionCall: invalid input text.');
	}

	try {
		const requestUrlParam: RequestUrlParam = {
			url: OPENAI_API_URL,
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${openaiApiKey}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo-0613', // TODO set based on settings value
				max_tokens: 2048,
				messages: [
					{
						role: 'system',
						content: llmPromptTagSuggestions
					},
					{
						role: 'user',
						content: "--start--\n" + inputText + "\n--end--",
					},
				],
				functions: [gptFunction],
				function_call: {name: gptFunction.name},
			})
		};
		const response: RequestUrlResponse = await requestUrl(
			requestUrlParam
		);

		if (response.status === 200 && response.json?.choices?.[0]?.message?.function_call) {
			return JSON.parse(response.json.choices[0].message.function_call.arguments);
		} else if (response.json.error) {
			AutoTagPlugin.Logger.error("fetchOpenAIFunctionCall Error:", JSON.stringify(response.json));
			return JSON.parse(response.json);
		} else {
			throw new Error('fetchOpenAIFunctionCall: Error: Failed to get tags from OpenAI API.');
		}
	} catch (error) {
		AutoTagPlugin.Logger.warn(error);
		throw new Error('fetchOpenAIFunctionCall: Error: ' + error?.response?.data?.error?.message || 'unknown error');
	}
}
