#!/bin/bash -e
#
# This scripts prepares a module that points to external docs in order
# to preview the documentation in an easy way.
#
# Authors:
#   Joaquim Rocha <joaquim@kinvolk.io>
#

MODULE_FILE_NAME=tmp_modules.yaml

delete_preview() {
  rm "$MODULE_FILE_NAME"
}

usage() {
    docs_folders=$(find ./content/docs/*/_index.md)

    folders=''
    for folder in $docs_folders; do
      tmp=$(dirname $folder)
      folder_name=$(basename $tmp)
      folders="${folder_name}, ${folders}"
    done
    cat <<EOF
Usage: $0 DOCS_FOLDER VERSION [ANOTHER_DOCS_FOLDER ANOTHER_DOCS_VERSION]
Link docs for previewing.

  DOCS_FOLDER                   Path to the external project containing the docs (should have an _index.md inside)
  VERSION                       The new version, currently there are already:
                                ${folders}

Optional:

  -h, --help                    Display this help and exit
  -d, --delete                  Delete the docs preview (doesn't affect published docs)

Example: $0 ../flatcar-docs/docs MyPreviewVersion

EOF
}

ARGS=$(getopt -o "hd" -l "help,delete" \
  -n "preview_docs.sh" -- "$@")
eval set -- "$ARGS"

while true; do
  case "$1" in
    -h|--help)
    usage
    exit 0
    ;;
    --)
      shift
      break
      ;;
  esac
  case "$1" in
    -d|--delete)
    delete_preview
    exit 0
    ;;
    --)
      shift
      break
      ;;
  esac
done

if (( $# == 0 )) || (( $# % 2 != 0 )); then
    echo "Error: Please give the pairs of EXTERNAL_DOCS_PATH -> DOCS_SECTION/VERSION"
    echo ""
    usage
    exit 1
fi

TMPL="
module:
  imports:"

echo "Creating ${MODULE_FILE_NAME}…:"

while (( "$#" >= 2 )); do
  echo "  ${1} -> localhost:1313/docs/${2}"

  TMPL+="
  - path: $(realpath ${1})
    mounts:
    - source: .
      target: ./content/docs/${2}"
  shift
  shift
done

echo "${TMPL}" > "${MODULE_FILE_NAME}"
