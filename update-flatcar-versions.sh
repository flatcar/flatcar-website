#/bin/sh

set -eu

WEBSITE_DIR="$(git rev-parse --show-toplevel)"
FCL_RELEASE_SCRIPTS=${FCL_RELEASE_SCRIPTS:-$WEBSITE_DIR/../flatcar-linux-release-info}

if [ ! -d "$FCL_RELEASE_SCRIPTS" ]; then
    echo "Please get the flatcar-linux-release-info project"
    echo "  git clone https://github.com/kinvolk/flatcar-linux-release-info.git"
    echo ""
    echo "You can set its location by setting a FCL_RELEASE_SCRIPTS env var."
    exit 1
fi
git -C $FCL_RELEASE_SCRIPTS checkout master
git -C $FCL_RELEASE_SCRIPTS pull

FLATCAR_DATA="$WEBSITE_DIR"/data
CHANNELS=(
    alpha
    beta
    edge
    lts
    lts-2021
    lts-2022
    stable
)

generate-release-feeds() {
    RELEASES_DIR=$WEBSITE_DIR/static/

    for CHANNEL in ${CHANNELS[@]} ; do \
        $FCL_RELEASE_SCRIPTS/releases_as_json.py $FLATCAR_DATA/releases/$CHANNEL/*.yml > $RELEASES_DIR/releases-json/releases-$CHANNEL.json;
        $FCL_RELEASE_SCRIPTS/releases_as_feed.py $FLATCAR_DATA/releases/$CHANNEL/*.yml > $RELEASES_DIR/releases-feed/releases-$CHANNEL.xml;
    done

    # releases/*/ will resolve stable as last one so that it wins for the "current" entry
    $FCL_RELEASE_SCRIPTS/releases_as_json.py $FLATCAR_DATA/releases/*/*.yml > $RELEASES_DIR/releases-json/releases.json
    $FCL_RELEASE_SCRIPTS/releases_as_feed.py $FLATCAR_DATA/releases/*/*.yml > $RELEASES_DIR/releases-feed/releases.xml

    echo "Updated feeds"
}

fetch-current-releases() {
    for CHANNEL in ${CHANNELS[@]}; do
        pushd $FLATCAR_DATA && $FCL_RELEASE_SCRIPTS/flatcar_release_info.py -c $CHANNEL -r current && popd
    done
    echo "Updated $FLATCAR_DATA/releases/*/*.yml"
}

fetch-current-releases
generate-release-feeds
