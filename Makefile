# Python tooling. Auto-detected but overridable. Examples:
#   make                     # uses whatever's on PATH (uv > python3 > python)
#   make PIP="uv pip"        # force uv
#   make PIP=pip             # force plain pip
#   make PYTHON=.venv/bin/python PIP=.venv/bin/pip
#   make PIP="poetry run pip"

# Pick a Python interpreter: python3, else python.
ifndef PYTHON
PYTHON := $(shell command -v python3 2>/dev/null || command -v python 2>/dev/null)
endif

# Pick an installer: prefer uv (fast, sandbox-friendly), else `$(PYTHON) -m pip`.
ifndef PIP
ifneq ($(shell command -v uv 2>/dev/null),)
PIP := uv pip
else
PIP := $(PYTHON) -m pip
endif
endif

VENV_DIR ?= .venv

.DEFAULT_GOAL := all

.PHONY: help all getdeps venv docs presentations run build-preview check-python

check-python:
	@if [ -z "$(PYTHON)" ]; then \
		echo "error: no python3 or python found in PATH." >&2; \
		echo "       install Python 3 or run: make PYTHON=/path/to/python <target>" >&2; \
		exit 1; \
	fi

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Detected tooling:"
	@echo "  PYTHON = $(PYTHON)"
	@echo "  PIP    = $(PIP)"

all: getdeps docs presentations ## Build docs, presentations, and the Hugo site
	hugo --theme=flatcar
	npx -y pagefind@1.4.0 --site public

PYTHON ?= python3

getdeps: check-python ## Install Python dependencies from requirements.txt
	$(PIP) install --upgrade -r requirements.txt

venv: check-python ## Create a local venv (VENV_DIR, default .venv) and install deps
	$(PYTHON) -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install --upgrade -r requirements.txt
	@echo ""
	@echo "Activate with:  source $(VENV_DIR)/bin/activate"
	@echo "Or invoke make: make PYTHON=$(VENV_DIR)/bin/python PIP='$(VENV_DIR)/bin/pip'"

docs: check-python ## Generate content/docs/_index.md from the template
	@$(PYTHON) ./tools/fcl-fetch-version-data.py ./content/docs/_index.md.in > ./content/docs/_index.md

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
				docker.io/marpteam/marp-cli:latest \
				$$topic/main.md \
				--html \
				--allow-local-files \
				--theme-set static/presentations \
				-o - | sed -E 's|body\s*\{\s*background\s*:\s*#[0-9a-fA-F]+\s*;|body{background:transparent;|g' > $$topic/index.html; \
		fi \
	done

run: ## Run the Hugo development server
	@echo "Hugo dev server: http://localhost:1313/"
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --baseURL http://localhost:1313/ --config ./config.yaml\,./tmp_modules.yaml

# Like 'run' but builds to disk first so pagefind search works locally.
# Note: no live-reload; re-run after content changes.
serve: docs
	hugo --theme=flatcar --buildFuture
	npx -y pagefind@1.4.0 --site public
	@echo "Static server: http://localhost:1313/"
	cd public && $(PYTHON) -m http.server 1313

build-preview: getdeps docs presentations ## Build a preview site (used by CI)
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
	npx -y pagefind@1.4.0 --site public
