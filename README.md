# Flatcar Website

Flatcar's website is built with [Hugo](https://gohugo.io/) and is deployed via [Netlify](https://netlify.com).

## Installing Hugo

You should install Hugo Extended instead of the regular Hugo version.

So download [Hugo Extended](https://github.com/gohugoio/hugo/releases)
from the releases page, and/or follow
[these instructions](https://gohugo.io/getting-started/installing/)
in order to install it.

## Adding content

Currently, you'll need to edit the text files under `content` in this repo to modify the site.

### Blog content

In order to add content for the blog you can use the `hugo new` command. The format is as follow.

`hugo new blog/YEAR-MONTH-DAY-example-content.md`

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

## Testing

You should always test your changes locally before creating a pull request. Once you do createi a branch or a pull request, we use Netlify to create previes of the changes so that reviewers and yourself can easily review the changes.

### Testing locally

To test locally run the following command.

`make run`

The above command will run a server with the the site available at `http://localhost:1313`. It will also watch for any changes made to the site and regenerate and reload the site when changes are detected. In addition, it disables some caching that can sometimes have confusing results.

### Testing Pull requests

Each pull request will run some checks and create a new preview of the changes that can be access by clicking on the Github pull request status section.

### Testing documentation locally

If you are working on documentation and would like to see the changes
be reflected in a local run of the website, then you need to generate a
module to import the docs and run the website locally with it.

You can use the `tools/preview_docs.sh` script for conveniently generating
an import module, e.g.:

`./tools/preview_docs.sh ../flatcar-docs/docs new_latest`

(this creates a `tmp_modules.yaml`)

and then start the local server again with `make run`.

## Changing the published documentation

The documentation is set under `params.docs` in [config.yaml](./config.yaml) and
should look similar to:

```
github_edit_url: https://github.com/flatcar-linux/flatcar-docs/edit/main/docs/
issues_url: https://github.com/kinvolk/flatcar/issues/new?labels=kind/docs
external_docs:
- repo: https://github.com/flatcar-linux/flatcar-docs.git
    name: "latest"
    branch: "main"
    dir: "docs"
```

If you want to add a new version of the documentation, this can be done by adding a new entry to external_docs:
```
external_docs:
- repo: https://github.com/flatcar-linux/flatcar-docs.git
    name: "latest"
    branch: "main"
    dir: "docs"
- repo: https://github.com/flatcar-linux/flatcar-docs.git
    name: "old"
    branch: "tag-1.2.3"
    dir: "docs"
```

This will pull the docs that were versioned by the `tag-1.2.3` and place them under a version called `old`.

By default, the first version in the list of `external_docs` is considered to be
the latest version and so it is the one linked to automatically in the site.