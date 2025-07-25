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
	@mkdir -p static/presentations
	@for topic in $$(find content/docs/latest/presentations -maxdepth 1 -type d -not -path content/docs/latest/presentations); do \
		topic_name=$$(basename $$topic); \
		if [ -f "$$topic/main.md" ]; then \
			echo "Building $$topic_name..."; \
			docker run \
				--rm \                                         # Remove container after execution
				--user $$(id -u):$$(id -g) \                   # Run as current user to avoid permission issues
				-v $$(pwd):/home/marp/app \                    # Mount project directory
				marpteam/marp-cli:latest \
				$$topic/main.md \                              # Input: main.md from topic directory
				--html \                                       # Generate HTML output
				--allow-local-files \                          # Allow referencing local images
				-o static/presentations/$$topic_name.html; \   # Output: writes to host filesystem
		fi \
	done

run:
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --config ./config.yaml\,./tmp_modules.yaml

build-preview: getdeps docs
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
