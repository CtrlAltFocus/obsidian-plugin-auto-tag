import { App } from "obsidian";

export const getKnownTags = async (app: App): Promise<string[]> => {
    const { vault, metadataCache } = app;
    const tags: string[] = [];

    // // See how much text was processed:
    // const fileContents: string[] = await Promise.all(
    //     vault.getMarkdownFiles().map(async (file) => vault.cachedRead(file))
    // );
    // let totalLength = 0;
    // fileContents.forEach((content) => {
    //     totalLength += content.length;
    // });

    vault.getMarkdownFiles().forEach((file, index) => {
        metadataCache.getFileCache(file)?.tags?.forEach((tag) => {
            if (!tags.includes(tag.tag)) {
                tags.push(tag.tag);
            }
        });

        // TODO Separate #autotags/... from other tags

        // TODO Could also use this to get the autotags: from frontmatter
        // metadataCache.getFileCache(file)?.frontmatter?. ....
        // Can also get headings, list items, blocks, embeds, etc. see CachedMetadata
    });

    // AutoTagPlugin.Logger.debug(`Found ${tags.length} tags in ${fileContents.length} files with a total length of ${totalLength} characters.`);

    return tags;
}
