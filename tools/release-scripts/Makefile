SHELL = bash

lint:
	flake8 flatcar_release_info.py releases_as_json.py || echo flake8 lint failed

.PHONY: lint

requirements.txt: requirements.in
	pip-compile --output-file $@ $<

requirements-dev.txt: requirements-dev.in
	pip-compile --output-file $@ $<
