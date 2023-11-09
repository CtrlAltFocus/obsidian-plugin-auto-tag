import {LlmModel} from "../services/models/openai.models";
import {encodingForModel} from "js-tiktoken";

/**
 * Creates a DocumentFragment from a HTML string, safely injecting user-provided values.
 *
 * @param {string} htmlString - The HTML string with placeholders for user values.
 * @param {Record<string, string>} unsafeValues - An object where each key is a placeholder in the HTML string and each value is a user-provided string.
 *
 * @returns {DocumentFragment} - A DocumentFragment containing the HTML with safely injected user values.
 *
 * @example
 * const unsafeValues = {
 *     userValue1: "<script>alert('XSS1');</script>",
 *     userValue2: "<script>alert('XSS2');</script>"
 * };
 * const htmlString = "<strong>bold text</strong><br>user provided {{userValue1}} and a <a>link</a> and also {{userValue2}}";
 * const fragment = createFragment(htmlString, unsafeValues);
 */
export const createDocumentFragment = (htmlString: string, unsafeValues: Record<string, string> = {}): DocumentFragment => {
	const fragment = document.createDocumentFragment();
	let safeHtmlString = htmlString;

	for (const placeholder in unsafeValues) {
		const safeValue = document.createTextNode(unsafeValues[placeholder]).textContent || '';
		safeHtmlString = safeHtmlString.replace(new RegExp(`{{${placeholder}}}`, 'g'), safeValue);
	}

	const parser = new DOMParser();
	const parsedDoc = parser.parseFromString(safeHtmlString, 'text/html');

	while (parsedDoc.body.firstChild) {
		fragment.appendChild(parsedDoc.body.firstChild);
	}

	return fragment;
}

/**
 * Used when applying formatting to tags.
 * For some languages, the change-case library outputs a wrong result, so
 * we handle it in a simpler custom manner.
 *
 * @param tag
 * @param format
 */
export function customCaseConversion(tag: string, format: string): string {
	switch (format) {
		case 'kebabCase':
		case 'trainCase':
			return tag.replace(/\s+/g, '-');
		case 'snakeCase':
		case 'pascalSnakeCase':
			return tag.replace(/\s+/g, '_');
		default:
			return tag;  // No conversion for unsupported formats
	}
}

/**
 * Tokenizes a string and returns the tokens count.
 *
 * @param text
 */
export const getTokenCount = (text: string): number => {
	const enc = encodingForModel("gpt-3.5-turbo-0613");
	const tokens = enc.encode(text);
	return tokens.length;
}

/**
 * Given an input string and an LLM AI model data object with cost per token, returns the cost of the input string.
 *
 */
export const calculateTokenCost = (text: string, modelData: LlmModel): { tokenCount: number, cost: number } => {
	const tokenCount = getTokenCount(text);
	const queryCost = tokenCount / 1000 * modelData.inputCost1KTokens;
	const responseCost = tokenCount / 1000 * modelData.outputCost1KTokens;
	const cost = queryCost + responseCost;

	return {
		tokenCount,
		cost
	};
}
