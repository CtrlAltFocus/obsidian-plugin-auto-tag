export const createDocumentFragment = (htmlString: string): DocumentFragment => {
    const template = document.createElement("template");
    template.innerHTML = htmlString.trim();
    return template.content;
}