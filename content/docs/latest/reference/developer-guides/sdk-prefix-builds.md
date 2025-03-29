---
title: Using Prefix Builds in the Flatcar SDK
weight: 10
aliases:
    - ../../os/sdk-prefix-builds
---

# Building Portable Applications with Prefix Builds

The Flatcar SDK includes experimental support for "Prefix Builds". This feature allows you to build applications along with *all* their runtime dependencies into a self-contained directory structure, known as a "prefix".

**Key Benefits:**

*   **Portability:** The resulting prefix directory contains the application and all its necessary libraries, isolated from the host system's libraries. This makes the application portable across different Linux distributions or Flatcar versions.
*   **System Extensions:** Prefix builds are particularly well-suited for creating distro-independent [system extensions (sysexts)](https://www.flatcar.org/docs/latest/provisioning/sysext/).
*   **Conflict Avoidance:** By using libraries located within the custom prefix path (e.g., `/opt/my-app/lib`), applications avoid conflicts with potentially different library versions present on the host system (`/usr/lib`).

!!! note "Experimental Feature"
    Prefix build support in the Flatcar SDK is currently **experimental**. It relies on external tooling (`cross-boss`) and uses SDK toolchains differently than standard board builds. Use with caution and expect potential changes. See the [Path to Stabilization](#path-to-stabilization) section for details.

## Prerequisites

1.  **Flatcar SDK:** You need a working Flatcar SDK environment. See the [SDK Guide](sdk-modifying-flatcar).
2.  **`cross-boss` Tool:** The `cross-boss` tool must be available locally, as it's used for bootstrapping the prefix environment. Clone it if you haven't already:

    ```bash
    # Navigate to your scripts directory (the one containing run_sdk_container)
    git clone https://github.com/chewi/cross-boss
    ```

    This will create a `cross-boss` subdirectory, which is the default location expected by the `setup_prefix` script.

3.  **SDK Version:** This feature was tested and merged using SDK versions around `3740.0.0+nightly-20230927-2100`. While it's in `main`, using a recent SDK is recommended.

## How it Works

Prefix builds employ two distinct environments within the SDK container:

1.  **Staging Environment:** Located by default under `/build/prefix-<arch>/<name>/`. This contains a full development toolchain and build dependencies (`@system`). Binary packages (`.tbz2`) are built here.
2.  **Final Environment (Installation Root):** Located by default under `__prefix__/<arch>/<name>/` (relative to the `scripts` directory). This contains only the final application binaries and their *runtime* dependencies, installed from the binary packages created in the staging environment. The actual filesystem hierarchy starts inside the `root/` subdirectory (e.g., `__prefix__/amd64-usr/my-app/root/`).

The process involves:

1.  **Setup:** Running the `./setup_prefix` script initializes both the staging and final directory structures. It bootstraps the staging environment using `cross-boss` and creates an `emerge` wrapper script tailored for your prefix.
2.  **Building:** Using the generated `emerge-prefix-<name>-<arch>` wrapper script, you `emerge` packages. This wrapper orchestrates building the package and its dependencies in the staging environment and then installing the resulting binary packages (along with runtime dependencies) into the final environment's rootfs.
3.  **Packaging (Optional):** The `root/` subdirectory within the final environment can then be used as the input for creating portable packages, such as system extensions (`.raw` images).

Ebuilds are sourced from the standard `coreos-overlay` and `portage-stable` overlays, plus a dedicated `prefix-overlay` which contains necessary patches and definitions for prefix builds.

## Quick Start Guide: Building a Python Sysext

This example demonstrates building a portable Python interpreter and packaging it as a system extension.

1.  **Enter the SDK Container:**
    ```bash
    ./run_sdk_container
    ```

2.  **Set up the Prefix Environment:**

    Choose a name for your prefix (e.g., `my-python-app`) and the target installation path (e.g., `/opt/my-python-app`). For sysexts, the path should typically be under `/opt/` or `/usr/`.

    ```bash
    # Syntax: ./setup_prefix [--board=<board>] <name> <prefix-path>
    ./setup_prefix my-python-app /opt/my-python-app
    ```

    This command will:
    *   Create staging (`/build/prefix-amd64-usr/my-python-app/`) and final (`__prefix__/amd64-usr/my-python-app/`) directories.
    *   Bootstrap the staging environment (this may take ~20 minutes).
    *   Create the emerge wrapper: `emerge-prefix-my-python-app-amd64-usr`.

3.  **Build Python:**
    Use the generated wrapper to emerge the `python` package into your prefix.

    ```bash
    emerge-prefix-my-python-app-amd64-usr python
    ```

    This builds Python and its dependencies in staging, then installs the runtime components into `__prefix__/amd64-usr/my-python-app/root/`.

4.  **Package as a System Extension:**

    We'll use the `bake.sh` script from the [sysext-bakery](https://github.com/flatcar/sysext-bakery) project.

    ```bash
    # Download bake.sh (if you don't have it)
    wget https://raw.githubusercontent.com/flatcar/sysext-bakery/main/bake.sh
    chmod +x bake.sh

    # Navigate to the final environment directory
    cd __prefix__/amd64-usr/my-python-app/

    # bake.sh expects the rootfs in a directory named after the sysext
    sudo cp -a root python-sysext

    # Create the sysext image
    sudo ../../../bake.sh python-sysext
    # This creates python-sysext.raw
    ```

5.  **Deploy and Use the Sysext:**

    *   Copy `python-sysext.raw` to `/etc/extensions/` on a target Flatcar machine.
    *   Activate the extension: `sudo systemd-sysext refresh`
    *   Verify: You should now be able to run the Python interpreter from the prefix path:
    
        ```bash
        /opt/my-python-app/usr/bin/python --version
        ```
    This sysext is self-contained and should work on other Linux distributions supporting `systemd-sysext`.

## Advanced Usage: Adding Custom Overlays

You can add other Portage overlays, like the main Gentoo repository, to build packages not available in the Flatcar/CoreOS overlays.

1.  **Clone the Overlay Source:** Make the overlay source available inside the SDK container (e.g., via `/mnt/host`).
    ```bash
    # On the host machine, accessible as /mnt/host/source/... inside SDK
    mkdir -p /path/to/your/source/src/third_party/
    git clone --depth=1 https://github.com/gentoo/gentoo.git /path/to/your/source/src/third_party/gentoo
    ```

2.  **Configure `repos.conf`:** Create configuration files to tell the prefix environment about the new overlay. Assuming a prefix named `myprefix` with path `/usr/local/pfx` for `amd64-usr`:

    *   Create/Edit the staging config: `/home/sdk/trunk/src/scripts/_prefix__/amd64-usr/myprefix/root/usr/local/pfx/etc/portage/repos.conf/gentoo.conf`
    *   Create/Edit the final config: `/build/prefix-amd64-usr/myprefix/root/usr/local/pfx/etc/portage/repos.conf/gentoo.conf`

    Add the following content to *both* `gentoo.conf` files:
    ```ini
    [gentoo]
    location = /mnt/host/source/src/third_party/gentoo
    priority = -1000 # Lower priority than coreos/portage-stable
    # auto-sync = no # Recommended to disable sync for stability
    ```

3.  **Emerge Packages:** You can now use the `emerge-prefix-...` command to build packages from the added overlay.
    ```bash
    # Inside the SDK container
    emerge-prefix-myprefix-amd64-usr app-misc/mc # Example: build Midnight Commander
    ```

## Key Concepts

*   **Architecture Awareness:** Prefixes are inherently tied to a specific architecture (`amd64-usr`, `arm64-usr`). Use the `--board` flag during setup and the corresponding board name in the `emerge-prefix` command.
*   **Isolation:** Dependencies are installed *within* the prefix path in the final environment, minimizing conflicts with the base OS.
*   **`emerge-prefix` Wrapper:** This script handles the environment setup needed to build correctly for the prefix target, ensuring the right toolchains, paths, and configurations are used.
*   **Output Directory:** The `__prefix__/<board>/<name>/root/` directory contains the complete, installable filesystem for your prefix.

## Path to Stabilization

Before prefix build support is considered stable, the following items need to be addressed:

1.  **Integrate `cross-boss`:** The bootstrapping process currently relies on an external `cross-boss` checkout. This needs full integration into the Flatcar SDK build process.
2.  **Integrate with Board Toolchains:** Prefix builds currently use SDK cross-compilers (`/usr/<arch>-gnu/`) instead of the board-specific toolchains prepared in `/build/<board>/`. Integration with board toolchains and removal of the `cb-emerge` dependency is required.
3.  **Complete Portage Tool Wrappers:** Wrappers for other Portage tools (like `ebuild`, `equery`) should be created, similar to the board-specific wrappers.
4.  **Add Testing:** Automated test cases need to be added to [mantle/kola](https://github.com/flatcar/mantle/tree/flatcar-master/kola) to ensure the stability and correctness of prefix builds.

## Troubleshooting

*   **Experimental:** Expect rough edges or potential breakages as this feature evolves.
*   **Build Failures:** Ensure `cross-boss` is correctly cloned in the `scripts` directory. Check the output of `setup_prefix` and the emerge wrapper for errors.
*   **Package Compatibility:** Not all packages may build correctly in a prefix environment without patching (ebuild modifications). Issues were noted during development with packages like `sys-apps/baselayout` and `app-misc/ca-certificates` from the `coreos-overlay` due to specific dependencies or build logic. Workarounds might involve temporarily using versions from upstream Gentoo or patching ebuilds.
*   **Toolchain Dependencies:** Bootstrapping the prefix environment might require specific versions of tools like GCC. Some temporary masks or keyword acceptance might be present in the prefix setup (e.g., for GCC or Portage itself) which may be removed as the SDK toolchain evolves.
*   **Reporting Issues:** Please report bugs or unexpected behavior on the [Flatcar issue tracker](https://github.com/flatcar/Flatcar/issues). 
