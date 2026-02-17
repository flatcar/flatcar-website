---
title: Release guide
weight: 60
aliases:
    - ../../os/release-guide
---

This guide covers the complete Flatcar Container Linux release process from preparation through publication.
It is intended for Flatcar maintainers and contributors who need to prepare and execute official releases.

## Quick Reference

**Key Dependencies:**

* WireGuard access to Jenkins
* HSM key for update payload signing
* GitHub repository access (flatcar-linux, flatcar-nebraska)
* GPG key in Jenkins keyring

**Critical Path:**

{{< mermaid >}}
flowchart LR
    A[Tag Preparation] --> B[Jenkins Build]
    B --> C[Testing]
    C --> D[Release Job]
    D --> E[Artifact Distribution]
    E --> F[Update Payloads]
    F --> G[Publication]
{{< /mermaid >}}

## Prerequisites

Ensure the following requirements are satisfied before starting the release process:

### Required Access

* **GitHub Organizations:**
  * Read-write access to [flatcar](https://github.com/flatcar) organization (for updating source code repositories)
  * Member of [flatcar-nebraska](https://github.com/flatcar-nebraska) organization:
    * `nebraska-ro` group: Read access to Nebraska
    * `nebraska-rw` group: Promote new Flatcar versions

**Verify access:**

Make sure the [GitHub CLI `gh`](https://cli.github.com/manual/) is installed and authenticated:

```bash
# Check flatcar-linux access
gh api /orgs/flatcar/members/$(gh api user -q .login) 2>/dev/null && echo "✓ Access confirmed" || echo "✗ Access denied"
```

### GPG Key Setup

* Your GPG public key for signing release tags must be added to the `os/keyring` in Jenkins
* The GPG key fingerprint must be added to the keyring job (run at least once)
* Submit your GPG public key to <https://keys.openpgp.org> and enable discovery by email address

**Verify GPG setup:**

```bash
# List your GPG keys
gpg --list-secret-keys --keyid-format=long

# Export public key
gpg --armor --export YOUR_KEY_ID

# Verify key on keyserver
gpg --keyserver hkps://keys.openpgp.org --search-keys your.email@example.com
```

### Git Configuration

* Configure a git merge tool in `~/.gitconfig`:

  ```bash
  git config --global merge.tool vimdiff
  ```

## Access the Jenkins Dashboard

The Jenkins master runs in a VM without direct service exposure. Access requires local WireGuard configuration.

### Setup Steps

1. Configure WireGuard for `hub.pub.kinvolk.io`
2. Access the dashboard at: <http://jenkins.infra.kinvolk.io:8080>
3. Find the admin password in [flatcar/flatcar-linux-build-secrets](https://github.com/flatcar/flatcar-linux-build-secrets)

## Branch Management

### Prepare Branches for New Major Versions (Feature Alpha Release)

Create a new Alpha release with a new major version by branching `flatcar-MAJOR` from `main` for the `scripts` repository.

**The `flatcar-MAJOR` branch:**

* Contains release tags for all channels as it progresses from Alpha to Stable
* Is maintained until a Stable release is done from a newer `flatcar-MAJOR` branch or promoted to LTS channel

**Create the branch:**

```bash
# Calculate the major version (days since Fedora's 2013-07-01 release)
datediff 2013-07-01 today  # for Fedora, use ddiff on Debian
# Result example: 4564 days = version 4564

# Create the branch (replace <MAJOR> with calculated version)
./mirror-repos-branch main flatcar-<MAJOR>

# Example for version 4564:
# ./mirror-repos-branch main flatcar-4564
```

This creates branches in `flatcar/scripts`.

### Prepare a New LTS Major Version

Creating a new LTS major release is similar to the Beta-to-Stable transition, with additional steps for marking the new LTS `<YEAR>` stream.

**The year is used for:**

* LTS stream's Nebraska channel name (LTS group points to the latest LTS channel)
* `current-YEAR` symlink on Origin

**Required steps:**

First, update the OS codename by setting `OS_CODENAME=LTS 20xy` in `scripts:build_library/set_lsb_release` on the `flatcar-3xyz` branch. For example, use `OS_CODENAME="LTS 2025"` for a 2025 LTS release.

Next, update the LTS info manually in <https://flatcar.cdn.cncf.io/channel-info.txt> and add a redirection on the Origin servers.

**Verification:**

```bash
# Check the version file after building
cat sdk_container/.repo/manifests/version.txt | grep FLATCAR_VERSION
```

## Build Preparation

### Prepare the Build Tags for Jenkins Builds

Releases are built from release tags on the `flatcar-MAJOR` branches of the `scripts` repository.

**Important:** Unless propagating a major version between channels, use the major version currently assigned to the target channel.

#### Query Current Major Version

Check the Flatcar website or use the command line:

```bash
# Set the channel (alpha, beta, stable, or lts-YEAR)
CHANNEL=stable

# Get the current version
curl -s -S -f -L "https://$CHANNEL.release.flatcar-linux.net/amd64-usr/current/version.txt" | grep -m 1 FLATCAR_BUILD= | cut -d = -f 2-

# Get multiple channel versions at once
for CHANNEL in alpha beta stable; do
  VERSION=$(curl -s -S -f -L "https://$CHANNEL.release.flatcar-linux.net/amd64-usr/current/version.txt" | grep -m 1 FLATCAR_BUILD= | cut -d = -f 2-)
  echo "$CHANNEL: $VERSION"
done
```

#### Version Numbering

* **New major version on Alpha:** Starts with `MAJOR.0.0`
* **Point releases:** Increment the patch version (same channel) or minor version (channel promotion)

**Version Constraints:**

* Typically, no new releases are created for previous channels on a maintenance branch (e.g., a Beta release would duplicate Stable content)
* For critical security updates in Alpha/Beta when major version promotion isn't possible, increment the patch version
* **Version uniqueness is critical:** Update payloads are stored per version; path clashes are not supported
* Unique version requirements also apply to website links and RSS/JSON feeds

#### SDK Version Management

The SDK version typically matches the first Alpha release of the major channel, though updated point release SDKs may be available.

**Requirements:**

* The first Alpha release of a new major channel must build a new SDK
* The release uses this new SDK to build itself (using an older seed SDK for bootstrapping)

**Query the latest SDK version:**

```bash
# For the current Alpha release
CHANNEL=alpha
VERSION=current
curl -s -S -f -L "https://$CHANNEL.release.flatcar-linux.net/amd64-usr/$VERSION/version.txt" | grep -m 1 FLATCAR_SDK_VERSION= | cut -d = -f 2-

# Output example: 4564.0.0
```

**Query SDK version for an unpublished release:**

```bash
# Replace with your target channel and version
CHANNEL=beta
VERSION=4564.1.0

curl -s -S -f -L "https://raw.githubusercontent.com/flatcar/scripts/${CHANNEL}-${VERSION}/sdk_container/.repo/manifests/version.txt" | grep -m 1 FLATCAR_SDK_VERSION= | cut -d = -f 2-
```

#### Create Release Tags

Run `tag-release` in `flatcar-build-scripts` to create release tags on the `flatcar-MAJOR` branches:

```bash
# Standard release (replace values with your versions)
VERSION=<VERSION> SDK_VERSION=<SDK_VERSION> CHANNEL=<CHANNEL> ./tag-release

# Example for stable release:
VERSION=4564.3.0 SDK_VERSION=4564.0.0 CHANNEL=stable ./tag-release

# Example for LTS release:
VERSION=4564.4.0 SDK_VERSION=4564.0.0 CHANNEL=lts ./tag-release

# New major Alpha release (SDK version matches VERSION):
VERSION=4564.0.0 SDK_VERSION=4564.0.0 CHANNEL=alpha ./tag-release
```

**What this does:**

* Creates tags based on the current state of `flatcar-MAJOR` branch in each repository
* Updates the version file in `sdk_container/.repo/manifests/version.txt`

**Verify tags were created:**

```bash
# Check the tags in each repository
for REPO in scripts coreos-overlay portage-stable; do
  echo "$REPO:"
  git -C $REPO tag -l "*$VERSION"
done
```

## Build Process

Navigate to the Jenkins dashboard to start the build.

### Build Without SDK (Regular Release)

For regular releases without a new SDK build, start a `container/packages_all_arches` job:

**Parameters:**

```yaml
version: beta-4564.1.0              # Format: CHANNEL-MAJOR.MINOR.PATCH
scripts_ref: beta-4564.1.0          # Must match version
test_formats_amd64: ""              # Empty string to run all tests
test_formats_arm64: ""              # Empty string to run all tests
PIPELINE_BRANCH: flatcar-master    # Branch with Jenkins pipeline definitions
```

### Build With SDK (New Major Release)

For new major releases or releases requiring a new SDK build, start a `container/sdk` job.

**Requirements:**

* Same value for `SDK_VERSION` and `VERSION` used with `create-manifest`
* Seed SDK version must be the previous major version's SDK (typically `*.0.0`, but check for available point releases)

**Parameters:**

```yaml
version: alpha-4564.0.0             # New major version
scripts_ref: alpha-4564.0.0         # Must match version
seed_version: 4500.0.0              # Previous major version's SDK
test_formats_amd64: ""              # Empty string to run all tests
test_formats_arm64: ""              # Empty string to run all tests
Architecture: amd64                 # Build for amd64 first
PIPELINE_BRANCH: flatcar-master    # Branch with Jenkins pipeline definitions
```

**Build Process:**

1. The new SDK is built using the seed SDK
2. New SDK is used to build the release
3. Both amd64 and arm64 artifacts are generated
4. Test suite runs for all platforms

> **Note:** This process takes 6-10 hours. The build includes compiling the SDK, building packages, creating images for all formats, and running comprehensive test suites.

## Testing and Quality Assurance

### Check Essential Job Status

Not every job must succeed during the build process, but you should ensure these critical jobs have completed successfully: `container/image_changes` for package diff and size analysis, `container/vms` for VM image generation across all formats, and `container/test` for all vendor tests including AWS, Azure, GCP, and others.

### Re-run Failed Tests

Tests may fail for transient reasons such as IaaS provider provisioning failures, networking issues, or external service outages (e.g., quay.io). Re-run tests as necessary to verify actual failures versus infrastructure issues.

### Quality Assurance Review

While QA should occur during PRs and nightly builds, perform a final review before release to catch any overlooked issues.

**Review checklist:**

* Compare release to previous version
* Check updated packages
* Verify image changes (files shipped, files deleted, image size, etc.)

**Get package changes:**

View the `container/image_changes` job output (select `Timestamps: None` to copy).

**Key things to check:**

* No unexpected package downgrades
* Image size remains within acceptable limits (±500MB from previous release)
* Critical packages updated to secure versions (kernel, systemd, Docker)
* No missing dependencies
* No important deleted files 

### Monitor Pipeline Builds

Navigate the downstream job tree:

* Click the **Downstream View** button in the left sidebar
* Or access via `/cldsv/` URL suffix
* Requires the [plugin](https://github.com/flatcar/jenkins-os/tree/flatcar-master/plugins) to be installed

**Test reports:**

* Review output to identify failures (e.g., provisioning failures)
* Full test report summary available at [bincache](https://bincache.flatcar-linux.net/testing/)
* All tests are re-run (no selective test execution currently)

## Release Execution

### Generate Release Notes

After the build and testing are complete, generate release notes in preparation for the go/no-go meeting that will approve the release.

**Source:**

* Output from `show-changes` tool in `container/image_changes` job
* Select `Timestamps: None` in the sidebar before copying

**Template:**

Use the Flatcar [HackMD template](https://hackmd.io/IOXhY5GAQeKEdGk0JXG4sw) to create release notes and run the "go/no-go" meeting once the release notes are done.

### Go/No-go meeting

This is an async and offline meeting on Matrix. The goal of this meeting is to validate, by the rest of the maintainers, the current state of the release before public promotion. To be reviewed:
* tests summary
* changelog / release notes
* social posts

The content of the message to trigger the Go/No-go meeting is available in the HackMD document release template.

_NOTES_:
* Time the go/no-go meeting (e.g lazy consensus in 3 hours)
* Don't wait for all maintainers to vote (more than 50% is enough)

### Run the Release Job

Once the release build is ready and the Go/No-go meeting result is "Go", run the `container/release` job to publish AWS, Azure, and GCP images and store the AMI lists in the bincache release folder.

**Parameters:**

```yaml
scripts_ref: alpha-4564.0.0         # Your release version tag
PIPELINE_BRANCH: flatcar-master    # Branch with Jenkins pipeline definitions
```

**Success criteria:** Verify that all AMI IDs are generated and stored, Azure VHD blobs are uploaded, GCE images are published to the project, and there are no upload failures in the job log.

**Output artifacts:**

* AMI lists: `bincache/boards/$VERSION/`
* Image checksums: `bincache/boards/$VERSION/flatcar_production_*.DIGESTS`

**Artifact distribution:** The pipeline automatically handles copying build artifacts from bincache to the CloudFlare CDN bucket for distribution via `{alpha,beta,stable}.release.flatcar-linux.net`.

### Publish Cloud Provider Images

#### Azure SKUs

* **Process:** Requires manual interaction with Azure Marketplace portal

#### AWS Marketplace

* **Process:** Plume automatically submits marketplace images
* **Verification:** Check submission status in the [AWS Marketplace portal](https://aws.amazon.com/marketplace/management/requests/)

#### GCP Marketplace

* **Process:** Requires manual steps via GCP console

### Generate and Upload Update Payload

> **Important:** Generate update payloads **before** publishing release notes to avoid user confusion.

**Requirements:** This step requires a person with a Flatcar HSM key and physical access to a secure laptop with Tails. The process is currently manual and not automated.

**Timing:** You can start this process as soon as the release is ready without waiting for the `container/release` job or Origin sync to finish. However, it should be completed before making releases public.

**Verification:**

After upload, verify payloads are available in Nebraska:

```bash
# Check Nebraska has the payload
curl -s https://public.update.flatcar-linux.net/v1/update/ \
  -H "Content-Type: application/json" \
  -d '{"appid":"e96281a6-d1af-4bde-9a0a-97b76e56dc57","version":"4500.0.0"}' | jq
```

## Post-Release Tasks

### Create GitHub Release

> **Important:** Complete this **before** updating the website, as it serves as the data source.

**Requirements:**

* `gh` GitHub CLI must be installed
* Release notes in Markdown format

**Steps:**

1. Run the `create-github-release` tool for each release:

   ```bash
   # Navigate to flatcar-build-scripts directory
   cd flatcar-build-scripts

   # Create releases (they will be in draft mode)
   ./create-github-release alpha-4564.0.0
   ./create-github-release beta-4500.2.0
   ./create-github-release stable-4450.3.0
   ```

2. Review the releases in your browser:
   * Visit: <https://github.com/flatcar/scripts/releases>
   * Check formatting, links, and content
   * Verify version numbers are correct

3. Promote from draft to published:
   * Click "Edit" on each release
   * Uncheck "Save as draft"
   * Click "Publish release"

**Tips:**

* Review the release notes in preview mode before publishing
* Check that all CVEs are properly linked
* Verify changelog section is complete

### Update the Website

**Prerequisites:** GitHub releases must be published (not in draft) in the `scripts` repo.

**Steps:**

1. Manually trigger the [Create Flatcar releases PR](https://github.com/flatcar/flatcar-website/actions/workflows/flatcar-releases-pr.yml) workflow in GitHub Actions
2. Wait for the workflow to create a pull request automatically
3. Review the staging site (link appears in PR after a few moments)
4. Merge the PR to publish changes to the live site

### Send Announcements

#### Release Notes Distribution

Post release notes to:

* **Open Flatcar users group:** <https://groups.google.com/g/flatcar-linux-user>

**Posting guidelines:**

* Select the mailing list as sender (not your personal account)
* Subscribe and lock the topic (announcements aren't for feedback)
* Ensure proper formatting with line breaks before listing release changes

#### Additional Channels

* Social media accounts
* [Matrix](https://matrix.to/#/#flatcar:matrix.org)
* [Kubernetes Slack](https://kubernetes.slack.com/archives/C03GQ8B5XNJ)
