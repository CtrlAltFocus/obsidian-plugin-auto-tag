import {GptFunction} from './models/openai.models';
import AutoTagPlugin from 'src/plugin/autoTagPlugin';
import {Notice, requestUrl, RequestUrlParam, RequestUrlResponse} from "obsidian";
import {createDocumentFragment} from "../utils/utils";
import {AutoTagPluginSettings} from "../plugin/settings/settings";

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// const llmPromptTagSuggestionsAlternative  = 'You are ChatGPT, a helpful multi-lingual assistant and text analysis tool. You help with semantic understanding and text classification of received user input text and provide suggestions for tags that best allow to categorize and identify the text, for use in search engines or content linking and grouping or semantic search of related content. You will receive the input text from the user, delimited by the --start-- and --end-- tags. Consider the context of the text, reason step by step about what it is about, then suggest tags that best describe the user\'s text. Rather than specific to this text, it should grasp the topic and meaning so that the tags can help find other related similar content.';
const llmPromptTagSuggestions = 'You are ChatGPT, a helpful multi-lingual assistant and text analysis tool. You help with semantic understanding and text classification of received user input text and provide suggestions for tags that best allow to categorize and identify the text, for use in search engines or content linking and grouping or semantic search of related content. You will receive the input text from the user, delimited by the --start-- and --end-- tags. Consider the context of the text, what is it about if you take a step back? Suggest tags that best describe the user\'s text. Rather than specific to this text, it should grasp the topic and meaning so that the tags can help find other related similar content.';

const gptTagHandlingFunctionDescription = 'This function needs to receive a list of tags, that you suggest based on the best matching tags that describe the user-provided input text. Return at least 1 tag. Return at most 10 tags. The tags should be in the language of the user-provided input text.';

export async function getTagSuggestions(settings: AutoTagPluginSettings, inputText: string, openaiApiKey: string): Promise<string[] | null> {
	// console.debug('getTagSuggestions: settings', settings);
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
					description:
						'An array of utf8 unicode values representing tags. Tags ideally should only contain lowercase letters and underscores. Tags might represent strings in various languages and alphabets.',
					items: {
						type: 'string',
					},
				},
			},
			required: ['tags'],
		},
	};

	try {
		const responseData: {
			tags?: string[],
			error?: { type: string, message: string, param: any, code: any }
		} = await fetchOpenAIFunctionCall(settings, openaiApiKey, inputText, gptFunction);

		if (responseData?.tags) {
			AutoTagPlugin.Logger.debug('OpenAI API suggested tags:', JSON.stringify(responseData));
			return responseData.tags;
		} else if (responseData?.error) {
			AutoTagPlugin.Logger.error('OpenAI API response is missing a "tags" property.', JSON.stringify(responseData));
			new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: {{errorMessage}}`, {errorMessage: responseData.error.message}));
			throw new Error('OpenAI API response is missing a "tags" property.');
		}
	} catch (error) {
		throw Error(JSON.stringify(error, null, 2));
	}

	return [];
}

/**
 * Uses OpenAI's API to request tags for the given input text.
 * Uses Function Calling to easily handle the response.
 */
export async function fetchOpenAIFunctionCall(settings: AutoTagPluginSettings, openaiApiKey: string, inputText: string, gptFunction: GptFunction): Promise<{
	tags: string[]
}> {
	if (inputText.trim().length === 0) {
		AutoTagPlugin.Logger.warn('fetchOpenAIFunctionCall: invalid input text.', JSON.stringify(inputText));
		throw new Error('fetchOpenAIFunctionCall: invalid input text.');
	}

	const requestId = Math.random().toString(36).substring(2, 10).toUpperCase();

	try {
		const requestUrlParam: RequestUrlParam = {
			url: OPENAI_API_URL,
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${openaiApiKey}`,
			},
			body: JSON.stringify({
				model: settings.openaiModel.id,
				max_tokens: 500, // could set a multiple of the max number of tags desired
				temperature: settings.openaiTemperature,
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
		AutoTagPlugin.Logger.log(`OpenAI API request (ID ${requestId}) starting...`);
		const response: RequestUrlResponse = await requestUrl(
			requestUrlParam
		);
		AutoTagPlugin.Logger.log(`OpenAI API request (ID ${requestId}) response received.`);

		if (response.status === 200 && response.json?.choices?.[0]?.message?.function_call) {
			return JSON.parse(response.json.choices[0].message.function_call.arguments);
		} else if (response.json.error) {
			AutoTagPlugin.Logger.error("OpenAI API request (ID ${requestId}) Error:", JSON.stringify(response.json));
			return JSON.parse(response.json);
		} else {
			throw new Error('Error: Failed to get tags from OpenAI API.');
		}
	} catch (error) {
		AutoTagPlugin.Logger.warn(`OpenAI API request (ID ${requestId}) Error: ` + error?.response?.data?.error?.message || JSON.stringify(error, null, 2));
		throw new Error(`OpenAI API request (ID ${requestId}) Error: ` + error?.response?.data?.error?.message || JSON.stringify(error, null, 2));
	}
}
