#!/bin/bash

set -euo pipefail

LTS_INFO=$(curl -sSfL https://lts.release.flatcar-linux.net/lts-info)
mapfile -t LTS_SUPPORTED < <(echo "${LTS_INFO}" | { grep -v unsupported || true ; } | cut -d : -f 2 | sed 's/^/lts-/' || true)
if [ "${LTS_SUPPORTED[*]}" = "" ]; then
  echo "Error: lts-info file seems empty"
  exit 1
fi
for L in "${LTS_SUPPORTED[@]}"; do
  echo "Found active LTS: $L"
  if [ "$L" = "" ]; then
    echo "Error: empty line in lts-info file?"
    exit 1
  fi
done

WEBSITE_DIR="$(git rev-parse --show-toplevel)"
FCL_RELEASE_SCRIPTS="$WEBSITE_DIR"/tools/release-scripts
FLATCAR_DATA="$WEBSITE_DIR"/data
# stable must be last
CHANNELS=(
    alpha
    beta
    lts
    "${LTS_SUPPORTED[@]}"
    stable
)

generate-release-feeds() {
    RELEASES_DIR="$WEBSITE_DIR"/static/

    for CHANNEL in "${CHANNELS[@]}" ; do \
        "$FCL_RELEASE_SCRIPTS"/releases_as_json.py "$FLATCAR_DATA"/releases/"$CHANNEL"/*.yml > "$RELEASES_DIR"/releases-json/releases-"$CHANNEL".json;
        "$FCL_RELEASE_SCRIPTS"/releases_as_feed.py "$FLATCAR_DATA"/releases/"$CHANNEL"/*.yml > "$RELEASES_DIR"/releases-feed/releases-"$CHANNEL".xml;
    done

    # releases/*/ will resolve stable as last one so that it wins for the "current" entry
    "$FCL_RELEASE_SCRIPTS"/releases_as_json.py "$FLATCAR_DATA"/releases/*/*.yml > "$RELEASES_DIR"/releases-json/releases.json
    FEED="all" "$FCL_RELEASE_SCRIPTS"/releases_as_feed.py "$FLATCAR_DATA"/releases/*/*.yml > "$RELEASES_DIR"/releases-feed/releases.xml

    echo "Updated feeds"
}

fetch-current-releases() {
    for CHANNEL in "${CHANNELS[@]}"; do
        pushd "$FLATCAR_DATA" && "$FCL_RELEASE_SCRIPTS"/flatcar_release_info.py -c "$CHANNEL" -r current && popd
    done
    echo "Updated $FLATCAR_DATA/releases/*/*.yml"
}

fetch-current-releases
generate-release-feeds
