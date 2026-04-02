<div style="text-align: center">

[![Flatcar OS](https://img.shields.io/badge/Flatcar-Website-blue?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNi4wLjMsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4wIiBpZD0ia2F0bWFuXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgODAwIDYwMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgODAwIDYwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6IzA5QkFDODt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQ0MCwxODIuOGgtMTUuOXYxNS45SDQ0MFYxODIuOHoiLz4NCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MDAuNSwzMTcuOWgtMzEuOXYxNS45aDMxLjlWMzE3Ljl6Ii8+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNTQzLjgsMzE3LjlINTEydjE1LjloMzEuOVYzMTcuOXoiLz4NCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik02NTUuMiw0MjAuOXYtOTUuNGgtMTUuOXY5NS40aC0xNS45VjI2MmgtMzEuOVYxMzQuOEgyMDkuNFYyNjJoLTMxLjl2MTU5aC0xNS45di05NS40aC0xNnY5NS40aC0xNS45djMxLjINCgloMzEuOXYxNS44aDQ3Ljh2LTE1LjhoMTUuOXYxNS44SDI3M3YtMTUuOGgyNTQuOHYxNS44aDQ3Ljh2LTE1LjhoMTUuOXYxNS44aDQ3Ljh2LTE1LjhoMzEuOXYtMzEuMkg2NTUuMnogTTQ4Ny44LDE1MWg3OS42djMxLjgNCgloLTIzLjZ2NjMuNkg1MTJ2LTYzLjZoLTI0LjJMNDg3LjgsMTUxTDQ4Ny44LDE1MXogTTIzMywyMTQuNlYxNTFoNjMuN3YyMy41aC0zMS45djE1LjhoMzEuOXYyNC4yaC0zMS45djMxLjhIMjMzVjIxNC42eiBNMzA1LDMxNy45DQoJdjE1LjhoLTQ3Ljh2MzEuOEgzMDV2NDcuN2gtOTUuNVYyODYuMUgzMDVMMzA1LDMxNy45eiBNMzEyLjYsMjQ2LjRWMTUxaDMxLjl2NjMuNmgzMS45djMxLjhMMzEyLjYsMjQ2LjRMMzEyLjYsMjQ2LjRMMzEyLjYsMjQ2LjR6DQoJIE00NDguMywzMTcuOXY5NS40aC00Ny44di00Ny43aC0zMS45djQ3LjdoLTQ3LjhWMzAyaDE1Ljl2LTE1LjhoOTUuNVYzMDJoMTUuOUw0NDguMywzMTcuOXogTTQ0MCwyNDYuNHYtMzEuOGgtMTUuOXYzMS44aC0zMS45DQoJdi03OS41aDE1Ljl2LTE1LjhoNDcuOHYxNS44aDE1Ljl2NzkuNUg0NDB6IE01OTEuNiwzMTcuOXY0Ny43aC0xNS45djE1LjhoMTUuOXYzMS44aC00Ny44di0zMS43SDUyOHYtMTUuOGgtMTUuOXY0Ny43aC00Ny44VjI4Ni4xDQoJaDEyNy4zVjMxNy45eiIvPg0KPC9zdmc+DQo=)](https://www.flatcar.org/)
[![Matrix](https://img.shields.io/badge/Matrix-Chat%20with%20us!-green?logo=matrix)](https://app.element.io/#/room/#flatcar:matrix.org)
[![Slack](https://img.shields.io/badge/Slack-Chat%20with%20us!-4A154B?logo=slack)](https://kubernetes.slack.com/archives/C03GQ8B5XNJ)
[![Twitter Follow](https://img.shields.io/twitter/follow/flatcar?style=social)](https://x.com/flatcar)
[![Mastodon Follow](https://img.shields.io/badge/Mastodon-Follow-6364FF?logo=mastodon)](https://hachyderm.io/@flatcar)
[![Bluesky](https://img.shields.io/badge/Bluesky-Follow-0285FF?logo=bluesky)](https://bsky.app/profile/flatcar.org)

</div>

# Flatcar Website

Flatcar's website is built with [Hugo](https://gohugo.io/).

## Installing Hugo

You should install Hugo Extended instead of the regular Hugo version (**check what Hugo version we are using in the [`.env`](./.env) file**).

So download [Hugo Extended](https://github.com/gohugoio/hugo/releases)
from the releases page, and/or follow
[these instructions](https://gohugo.io/getting-started/installing/)
in order to install it.

## Prerequisites

- Hugo Extended (see version in [`.env`](./.env) file)
- Python 3 with PyYAML (required for docs generation - installed via `make getdeps`)
- Docker (required for building presentations with Marp) (a `docker` symlink to `podman` works too)

## Adding content

Currently, you'll need to edit the text files under `content` in this repo to modify the site.

### Blog content

In order to add content for the blog you can use the `hugo new` command. The format is as follow.

`hugo new blog/YEAR-MONTH-DAY-example-content/index.md`

The following command will create a new blog post with the [front matter](https://gohugo.io/content-management/front-matter/) defined in the default [archetype](https://gohugo.io/content-management/archetypes/) from the `./archetype` directory.

The default front matter almost always needs to be modified to a category and tags. Here's an example.

```
---
title: "Example Content"
date: 2018-10-26T03:51:27+02:00
draft: true
tags:
- tag1
- tag1
categories:
- Announcement
---
```

*TODO: Add more content sections (events, job postings, etc.)*

## Documentation Versioning

Documentation versions are stored in `content/docs/` and sorted by a `weight` parameter in each version's `_index.md` frontmatter. Higher weight = newer version.

### Directory structure

- Current version: `content/docs/latest/` (highest weight)
- Snapshots: `content/docs/DD-MM-YYYY/` (date when they became outdated, lower weights)

### Creating a new version snapshot

When you need to snapshot the current documentation:

1. **Rename `latest` to today's date and lower its weight**:
   ```bash
   mv content/docs/latest content/docs/$(date +%d-%m-%Y)
   # Edit content/docs/DD-MM-YYYY/_index.md and set weight to previous value - 1
   ```

2. **Copy the snapshot back to `latest` with a higher weight**:
   ```bash
   cp -r content/docs/DD-MM-YYYY content/docs/latest
   # Edit content/docs/latest/_index.md and set weight to highest value (e.g., 40)
   ```

3. **Make your changes** in `content/docs/latest/`

### Presentations

Create HTML presentations from screenshots using Marp (requires Docker):

1. Create directory: `static/presentations/your-topic/`
2. Add screenshots (16:9 aspect ratio recommended) and `main.md` in the same directory
3. Use `theme: screenshot-guide` in your `main.md` for screenshot tutorials

#### Theme Classes
- **Slide themes** (affects pagination, header/footer defaults):
  - `<!-- _class: light-theme -->` - For light background slides (default)
  - `<!-- _class: dark-theme -->` - For dark background slides
  
- **Use Marp's built-in directives**:
  - `<!-- _header: "Your text" -->` - Adds header
  - `<!-- _footer: "Your text" -->` - Adds footer
  
- **Optional modifiers**:
  - `invert-header` or `invert-footer` - Swap colors
  - `solid-header` or `solid-footer` - Less transparent backgrounds

Example:
```markdown
<!-- _class: dark-theme -->
<!-- _footer: "Step 1: Instructions appear in a light strip at bottom" -->
![bg](./dark-screenshot.png)
```
4. Run `make presentations` to generate `index.html` in each presentation directory
5. Embed in docs with: `{{< presentation "your-topic" >}}`

Note: The custom theme is located at `static/presentations/screenshot-guide-theme.css`

## Testing

You should always test your changes locally before creating a pull request. Once you do createi a branch or a pull request, we use Azure Static Web Apps to create previews of the changes so that reviewers and yourself can easily review the changes.

### Testing locally

To test locally run the following command.

`make run`

The above command will run a server with the the site available at `http://localhost:1313`. It will also watch for any changes made to the site and regenerate and reload the site when changes are detected. In addition, it disables some caching that can sometimes have confusing results.

### Testing Pull requests

Each pull request will run some checks and create a new preview of the changes that can be access by clicking on the Github pull request status section.
