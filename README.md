# Auto Tag Plugin for Obsidian.md

Easily generate relevant tags for your Obsidian notes using the power of OpenAI.

## Overview

The Auto Tag plugin for Obsidian assists users in automatically generating tags for their notes. 
Whether you're unsure about which tags to use, forget to add them, or simply want to enhance your note's metadata, this plugin has got you covered.

## Features

- **Automatic Tag Generation**: Analyze the entire note or just a selected portion to generate relevant tags.
- **Frontmatter Integration**: Automatically inserts tags into the note's frontmatter. If frontmatter doesn't exist, the plugin creates it.
- **OpenAI Powered**: Utilizes OpenAI's API to ensure accurate and relevant tag suggestions.
- **Demo Mode**: Try out the plugin's functionality and settings combinations without needing an API key.

For tags:
- **Tag Format**: choose between kebak-case, snake_case, camelCase, PascalCase, and more.
- **Language detection**: returns tags in the detected language of the note.
- **Preview before insertion**: preview the tags before they are inserted into the note (and accept/ignore each tag).

## Beta notice

This plugin is considered in beta, until it has been tested by a larger number of users.

If you find bugs, or if the plugin did not do what you hoped or expected, you can go to github and [create an issue](https://github.com/CtrlAltFocus/obsidian-plugin-auto-tag/issues).
If you'd rather message me, that's OK too!

- Use the [Online feedback form](https://forms.gle/6XWpoHKXRqzSKyZj7)
- Email me (control.alt.focus@gmail.com)
- Message me on X (twitter) @ctrl_alt_focus

## Getting Started

- Installation: Install the Auto Tag plugin from Obsidian's community plugins list.
- Usage:
  - Open a note in Obsidian.
  - Optionally, select a portion of the text.
  - Trigger the "Auto Tag" command via the command dropdown.
- OpenAI API Setup:
  - Create a new API key at [https://platform.openai.com](https://platform.openai.com).
  - Set up your billing and set a maximum monthly spending limit (start with 1 USD for example).
  - Open the plugin settings and enter your API key.
  
## Keeping cost down

The plugin comes with a **demo** mode **enabled by default**, allowing users to experience its functionality before deciding to set up an OpenAI API key. Please be aware that using the OpenAI API requires setting up payment and will incur costs, so review OpenAI's pricing before enabling the full mode.

The GPT 3.5 model is very cheap to use and works well enough. You can start by setting a maximum cost **limit of 1 or 2 USD** per month and see how it goes.

If cheaper and good enough alternatives to OpenAI become available that you would like me to try out, let me know!

## Feedback & Support

If you have suggestions, issues, or just want to share your experience with the plugin, please create an issue on GitHub.

## Release Notes

- 0.3.0
  - Displays a loading state while tags are being fetched (otherwise, as openAI API can be really slow, this creates doubt about whether the plugin is working or not).
  - Improves the auto tag suggestions query, to return better quality tags.
  - Adds a choice regarding whether tag suggestions will be more predictable (similar results if you try several times) or more creative (in case you are not satisfied with the results and hope for something different by trying again).
  - Adds the possibility of having a cost estimation popup based on the selected text, before launching the auto tag suggestions (useful for the curious, or those with particularly large files or small budgets).
  - Removes the setting for choosing the max number of tags to fetch (as the cost of fetching more or less tags is minimal and not having this limit may improve the results).
- 0.2.11
  - Adds release notes to the readme file.
  - Multi-lingual tags: tags suggested in the language of the selected text or document.
- 0.2.10
  - New settings option to choose the tag format (for new tag suggestions).
  - Demo tags updated to have 1 tag for 10 different languages (to verify that tag format applies in all languages).
- 0.2.9
  - Fixes an issue where suggested tags could be made up of multiple words and the space in the tag would break the tag.
    - "#healthy and tasty" would count as "#healthy" before, but will now display as #healthy-and-tasty".
- 0.2.8
  - Adding a feedback form link to the settings and the Readme.
  - Improving log file handling; disabling "write to log file" setting by default.
- 0.2.7
  - Improving code based on pull request feedback from the Obsidian team reviewers.
- 0.2.6
  - First public release.
