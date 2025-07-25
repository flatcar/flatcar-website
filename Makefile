all: getdeps docs presentations
	hugo --theme=flatcar

getdeps:
	pip3 install --upgrade pyyaml

.PHONY: docs
docs:
	@python3 ./tools/fcl-fetch-version-data.py ./content/docs/_index.md.in > ./content/docs/_index.md

# Build all presentations (idempotent)
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
				marpteam/marp-cli:latest \
				$$topic/main.md \
				--html \
				--allow-local-files \
				--theme-set content/docs/latest/presentations \
				-o - | sed -E 's|body\s*\{\s*background\s*:\s*#[0-9a-fA-F]+\s*;|body{background:transparent;|g' > $$topic/index.html; \
		fi \
	done

run:
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --config ./config.yaml\,./tmp_modules.yaml

build-preview: getdeps docs
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
