#/bin/sh

set -eu

WEBSITE_DIR="$(git rev-parse --show-toplevel)"
FCL_RELEASE_SCRIPTS=${FCL_RELEASE_SCRIPTS:-$WEBSITE_DIR/../flatcar-linux-release-info}
# Note: Sice it does not pull, one should also prefix with "origin/" when overwritting
# except if one has an own local branch
BRANCH=${BRANCH:-origin/master}

if [ ! -d "$FCL_RELEASE_SCRIPTS" ]; then
    echo "Please get the flatcar-linux-release-info project"
    echo "  git clone https://github.com/kinvolk/flatcar-linux-release-info.git"
    echo ""
    echo "You can set its location by setting a FCL_RELEASE_SCRIPTS env var."
    exit 1
fi
git -C $FCL_RELEASE_SCRIPTS fetch
git -C $FCL_RELEASE_SCRIPTS checkout "${BRANCH}"

LTS_INFO=$(curl -sSfL https://lts.release.flatcar-linux.net/lts-info)
LTS_SUPPORTED=$(echo "${LTS_INFO}" | { grep -v unsupported || true ; } | cut -d : -f 2 | sed 's/^/lts-/')

FLATCAR_DATA="$WEBSITE_DIR"/data
# stable must be last
CHANNELS=(
    alpha
    beta
    lts
    ${LTS_SUPPORTED}
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
    FEED="all" $FCL_RELEASE_SCRIPTS/releases_as_feed.py $FLATCAR_DATA/releases/*/*.yml > $RELEASES_DIR/releases-feed/releases.xml

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
