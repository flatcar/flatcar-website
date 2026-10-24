# Python tooling: a local virtualenv is created automatically under VENV_DIR
# (default .venv) and kept in sync with requirements.txt, so `make docs` /
# `make getdeps` never touch anything outside the project. Examples:
#   make                        # uses python3/python on PATH to bootstrap .venv
#   make PYTHON=/path/to/python3 # use a specific interpreter to bootstrap the venv
#   make VENV_DIR=/tmp/myenv    # use a custom venv location

# Pick a Python interpreter: python3, else python. Only used to bootstrap the
# venv; everything else runs through $(VENV_DIR)/bin/python.
ifndef PYTHON
PYTHON := $(shell command -v python3 2>/dev/null || command -v python 2>/dev/null)
endif

VENV_DIR ?= .venv
MARP_CLI_IMAGE ?= docker.io/marpteam/marp-cli:v4.3.1

.DEFAULT_GOAL := all

.PHONY: help all getdeps venv docs presentations run serve build-preview check-python

check-python:
	@if [ -z "$(PYTHON)" ]; then \
		echo "error: no python3 or python found in PATH." >&2; \
		echo "       install Python 3 or run: make PYTHON=/path/to/python <target>" >&2; \
		exit 1; \
	fi
	@$(PYTHON) -c "import sys; raise SystemExit(0 if sys.version_info[0] >= 3 else 1)" 2>/dev/null || { \
		echo "error: $(PYTHON) is not Python 3." >&2; \
		echo "       install Python 3 or run: make PYTHON=/path/to/python3 <target>" >&2; \
		exit 1; \
	}

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Detected tooling:"
	@echo "  PYTHON   = $(PYTHON)"
	@echo "  VENV_DIR = $(VENV_DIR)"

all: getdeps docs presentations ## Build docs, presentations, and the Hugo site
	hugo --theme=flatcar
	npx -y pagefind@1.4.0 --site public

# Creates $(VENV_DIR) (if missing) and installs/refreshes requirements.txt
# into it. Re-run only when requirements.txt changes, so repeat builds stay
# fast and offline-friendly.
$(VENV_DIR)/.deps-installed: requirements.txt | check-python
	@test -d $(VENV_DIR) || $(PYTHON) -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install -r requirements.txt
	@touch $@

getdeps: $(VENV_DIR)/.deps-installed ## Install Python dependencies from requirements.txt into VENV_DIR

venv: getdeps ## Create/refresh the local venv (VENV_DIR, default .venv) and install deps
	@echo ""
	@echo "Activate with:  source $(VENV_DIR)/bin/activate"

docs: getdeps ## Generate content/docs/_index.md from the template
	@$(VENV_DIR)/bin/python ./tools/fcl-fetch-version-data.py ./content/docs/_index.md.in > ./content/docs/_index.md

# Build all presentations (idempotent)
presentations: ## Build Marp presentations under static/presentations
	@echo "Building presentations..."
	@for topic in $$(find static/presentations -maxdepth 1 -type d -not -path static/presentations); do \
		topic_name=$$(basename $$topic); \
		if [ -f "$$topic/main.md" ]; then \
			echo "Building $$topic_name..."; \
			docker run \
				--rm \
				-v $$(pwd):/home/marp/app \
				-w /home/marp/app \
				$(MARP_CLI_IMAGE) \
				$$topic/main.md \
				--html \
				--allow-local-files \
				--theme-set static/presentations \
				-o - | sed -E 's|body\s*\{\s*background\s*:\s*#[0-9a-fA-F]+\s*;|body{background:transparent;|g' > $$topic/index.html; \
		fi \
	done

run: presentations ## Run the Hugo development server
	@echo "Hugo dev server: http://localhost:1313/"
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --baseURL http://localhost:1313/ --config ./config.yaml\,./tmp_modules.yaml

# Like 'run' but builds to disk first so pagefind search works locally.
# Note: no live-reload; re-run after content changes.
serve: docs presentations
	hugo --theme=flatcar --buildFuture
	npx -y pagefind@1.4.0 --site public
	@echo "Static server: http://localhost:1313/"
	cd public && $(PYTHON) -m http.server 1313

build-preview: getdeps docs presentations ## Build a preview site (used by CI)
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
	npx -y pagefind@1.4.0 --site public
