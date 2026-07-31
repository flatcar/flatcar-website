all: getdeps calendar docs presentations
	hugo --theme=flatcar
	npx -y pagefind@1.4.0 --site public

PYTHON ?= python3
REQUIREMENTS := ./tools/requirements.txt

getdeps:
	@if $(PYTHON) -c 'import yaml, icalendar, recurring_ical_events, pytz, urllib3' 2>/dev/null; then \
		echo "calendar/docs Python deps already installed for $(PYTHON)"; \
	elif command -v uv >/dev/null 2>&1; then \
		uv pip install --system -r $(REQUIREMENTS); \
	else \
		$(PYTHON) -m pip install --upgrade --user -r $(REQUIREMENTS) || \
		$(PYTHON) -m pip install --upgrade --break-system-packages -r $(REQUIREMENTS); \
	fi

.PHONY: calendar
calendar:
	@$(PYTHON) ./tools/import-calendar.py

.PHONY: docs
docs:
	@$(PYTHON) ./tools/fcl-fetch-version-data.py ./content/docs/_index.md.in > ./content/docs/_index.md

# Build all presentations (idempotent)
.PHONY: presentations
presentations:
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

run: getdeps calendar
	@echo "Hugo dev server: http://localhost:1313/"
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --baseURL http://localhost:1313/ --config ./config.yaml\,./tmp_modules.yaml

# Like 'run' but builds to disk first so pagefind search works locally.
# Note: no live-reload; re-run after content changes.
serve: getdeps calendar docs
	hugo --theme=flatcar --buildFuture
	npx -y pagefind@1.4.0 --site public
	@echo "Static server: http://localhost:1313/"
	cd public && $(PYTHON) -m http.server 1313

build-preview: getdeps calendar docs
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
	npx -y pagefind@1.4.0 --site public
