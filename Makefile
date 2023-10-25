all: getdeps docs
	hugo --theme=flatcar

getdeps:
	pip3 install --upgrade pyyaml

.PHONY: docs
docs:
	@python3 ./tools/fcl-fetch-version-data.py ./content/docs/_index.md.in > ./content/docs/_index.md

run:
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender --config ./config.yaml\,./tmp_modules.yaml

build-preview: getdeps docs
	hugo --theme=flatcar -F -b ${DEPLOY_PRIME_URL}
