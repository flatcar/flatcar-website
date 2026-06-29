---
name: "Flatcar Docs Style"
description: "Documentation style and formatting conventions for Flatcar Container Linux docs"
applyTo: "content/docs/**/*.md"
---
# Flatcar documentation style and formatting

Based on the project style guide at `content/docs/latest/contribute/docs.md`.

## English style
- Write short sentences. Use the active voice. Avoid jargon.
- Avoid the second person ("you"). Use the imperative impersonal tone: "Reboot the system" not "You should reboot your system."
- Italicize terms of art on first appearance: *Kubernetes*.
- One space after all punctuation marks.

## Markdown symbols
- Headings: ATX style (`#`, `##`, etc.), not underline style.
- Bulleted lists: use asterisk (`*`), not hyphen (`-`).
- Hyperlinks: use reference style (`[text][label]`) with labels defined at the end of the file, sorted alphabetically. Prefer relative links over absolute.
- Italic: `*italic*`. Bold: `**bold**`.
- Inline code: backticks for commands, file paths, and literal values.
- Code blocks: fenced with triple backticks and a language tag (e.g., ` ```yaml `).

## Headings
- Use Sentence case: capitalize only the first word and proper nouns.
- Each heading is preceded and followed by a blank line.
- `h1` (`#`) is reserved for the document title (set via front matter, so do not add `#` headings in body).
- `h2` (`##`) for primary concepts, `h3`/`h4` for sub-details.

## Code blocks and commands
- Include the shell prompt `$` to distinguish input from output.
- Break long command lines with backslash (`\`) continuations; do not indent wrapped lines.
- Add comments inline when possible, or on the line before the referenced code.

## Placeholders
- URLs: use `example.com` (RFC 2606).
- IP addresses: use `203.0.113.0/24` range (RFC 5737).

## Source formatting
- Do not manually wrap long lines with newlines.
- Do not add a line break between sentences; write natural paragraphs separated by blank lines.
- Files are UTF-8 encoded, named in lower case with hyphens, and suffixed with `.md`.

## Links
- Name hyperlinks with maximum context: "see the [style guide][style]" not "click [here][style]."
- Use relative URLs where possible for portability.
- Link to Markdown source (`.md` extension); deployment scripts rewrite to `.html`.
