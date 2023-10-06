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
