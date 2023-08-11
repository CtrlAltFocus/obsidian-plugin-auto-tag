import axios from 'axios';
import { GptFunction } from './models/openai.models';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const OPENAI_API_MODELS = [
    {
        id: "gpt-3.5-turbo-0613",
        name: "GPT-3.5 Turbo (0613)",
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
    },
    // Fallback to default model, in case they update them and remove the above ones.
    {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        features: [],
        context: 4000,
        inputCost1KTokens: 0.0015,
        outputCost1KTokens: 0.002

    },
    {
        id: "gpt-3.5-turbo-16",
        name: "GPT-3.5 Turbo (16K context)",
        features: [],
        context: 16000,
        inputCost1KTokens: 0.003,
        outputCost1KTokens: 0.004
    },
    {
        id: "gpt-4",
        name: "GPT-4 (8K context)",
        features: [],
        context: 8000,
        inputCost1KTokens: 0.03,
        outputCost1KTokens: 0.06
    },
    {
        id: "gpt-4-32k",
        name: "GPT-4 (32K context)",
        features: [],
        context: 32000,
        inputCost1KTokens: 0.06,
        outputCost1KTokens: 0.12
    }
];

export async function getTagSuggestions(inputText: string, openaiApiKey: string): Promise<string[] | null> {
    const gptFunction: GptFunction = {
        name: 'getTagSuggestions',
        description: 'Suggest the best matching tags that describe the provided input text. At least 1 tag returned.',
        parameters: {
            type: 'object',
            properties: {
                tags: {
                    type: 'array',
                    description:
                        'An array of tags. Come up with 2 to 10 tags. These can be used to tag the input text to help with search engines or grouping with related tag content.',
                    items: {
                        type: 'string',
                    },
                },
            },
        },
    };

    try {
        const responseData: { tags: string[] } = await fetchOpenAIFunctionCall(openaiApiKey, inputText, gptFunction);
        console.log('OpenAI API suggested tags:', JSON.stringify(responseData));

        // throw error if responseData is not an object that contains "tags" property
        if (!responseData?.tags) {
            throw new Error('OpenAI API response is missing a "tags" property.');
        }

        return responseData.tags;
    } catch (error) {
        throw Error(error?.message);
    }
}

/**
 * Uses OpenAI's API to request tags for the given input text.
 * Uses Function Calling to easily handle the response.
 */
export async function fetchOpenAIFunctionCall(openaiApiKey: string, inputText: string, gptFunction: GptFunction): Promise<{ tags: string[] }> {
    if (typeof inputText !== 'string' || inputText.trim().length === 0) {
        console.warn('fetchOpenAIFunctionCall: invalid input text.', JSON.stringify(inputText));
        throw new Error('fetchOpenAIFunctionCall: invalid input text.');
    }

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-3.5-turbo-0613',
                // model: 'gpt-4-0613',
                max_tokens: 2048,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are ChatGPT, a helpful code assistant and text analysis tool. You help with semantic understanding of input text and providing suggestions for tags that best allow to categorize and identify the text, for use in search engines or content link grouping. You will receive the input text from the user.',
                    },
                    {
                        role: 'user',
                        content: inputText,
                    },
                ],
                functions: [gptFunction],
                function_call: { name: gptFunction.name },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openaiApiKey}`,
                },
            }
        );

        if (response.status === 200 && response.data?.choices?.[0]?.message?.function_call) {
            return JSON.parse(response.data.choices[0].message.function_call.arguments);
        } else {
            throw new Error('fetchOpenAIFunctionCall: Error: Failed to get tags from OpenAI API.');
        }
    } catch (error) {
        console.warn(error);
        throw new Error('fetchOpenAIFunctionCall: Error: ' + error?.response?.data?.error?.message || 'unknown error');
    }
}
