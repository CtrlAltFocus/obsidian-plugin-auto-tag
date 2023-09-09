# Auto Tag Plugin for Obsidian.md

Easily generate relevant tags for your Obsidian notes using the power of OpenAI.

## Overview

The Auto Tag plugin for Obsidian assists users in automatically generating tags for their notes. Whether you're unsure about which tags to use, forget to add them, or simply want to enhance your note's metadata, this plugin has got you covered.

## Features

- **Automatic Tag Generation**: Analyze the entire note or just a selected portion to generate relevant tags.
- **Frontmatter Integration**: Automatically inserts tags into the note's frontmatter. If frontmatter doesn't exist, the plugin creates it.
- **OpenAI Powered**: Utilizes OpenAI's API to ensure accurate and relevant tag suggestions.
- **Demo Mode**: Try out the plugin's functionality and settings combinations without needing an API key.

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
