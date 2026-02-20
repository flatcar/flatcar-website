---
title: Multi-Step Updates
weight: 20
---

This guide covers configuring and managing multi-step updates in Nebraska using floor packages.

## Overview

Multi-step updates allow Nebraska to enforce mandatory intermediate versions (called **floor packages**) that Flatcar instances must install before proceeding to the final target version. This feature ensures safe update paths when breaking changes require instances to pass through specific versions.

### When Are Floors Needed?

Sometimes a Flatcar release introduces changes that require all instances to pass through a specific version before they can safely update to newer releases. For example:

- A release adds filesystem support that subsequent releases depend on
- A migration script in one version must run before a later version's changes take effect
- A critical fix must be applied before proceeding to versions that assume it's present

Without floors, an instance running a very old version could attempt to jump directly to the latest release and fail. Floor packages ensure every instance follows a safe, tested update path.

---

## Key Concepts

### Floor Package

A **floor package** is a version marked as mandatory for a specific channel. Any instance updating through that channel must install all floor packages between their current version and the target version, in sequential order.

Key characteristics:

- **Channel-specific**: A package can be a floor for one channel but not another
- **Version-ordered**: Floors are served in ascending version order
- **Reason-documented**: Each floor can have an optional reason explaining why it's mandatory
- **Architecture-specific**: Floor packages must match the channel's architecture

### Target Package

The **target package** is the version that the channel currently points to. After installing all required floors, instances update to the target.

> **Note**: A package can be both a floor AND the target. This is useful when the target version itself contains critical changes that must be explicitly installed.

### Update Path Example

```
Available versions: v3400, v3510, v3602, v3760, v3815
Floors configured: v3510, v3602
Channel target: v3815

Instance at v3400 requesting update:
  v3400 → v3510 (floor) → v3602 (floor) → v3815 (target)
           ↓                  ↓                ↓
        Reboot            Reboot          Complete
```

---

## Configuring Floor Packages

#### Adding a Floor from Channel Edit

1. Navigate to **Applications** → Select your application
2. Go to **Channels** → Click on the channel to edit
3. In the channel edit dialog, find the **Floor Packages** section
4. Click **Add Floor Package**
5. Select a package from the dropdown (filtered by architecture, excludes blacklisted packages)
6. Enter an optional **Floor Reason** (e.g., "Introduces btrfs support in update-engine")
7. Save the channel

#### Adding a Floor from Package Edit

1. Navigate to **Applications** → Select your application
2. Go to **Packages** → Click on the package to edit
3. In the package edit dialog, find the **Floor Channels** section
4. Select channels where this package should be a floor
5. Enter the floor reason
6. Save the package

#### Removing a Floor

1. Edit the channel or package
2. Remove the floor relationship
3. Save

---

## Update Flow

When a Flatcar instance requests an update, Nebraska determines if any floor packages must be installed first:

1. Instance requests update from Nebraska
2. Nebraska identifies all floors between instance version and target
3. Nebraska returns the **first** required floor (or target if no floors needed)
4. Instance installs the update and reboots
5. Instance requests update again
6. Process repeats until target is reached

Each floor is installed one at a time, ensuring the instance passes through all required intermediate versions in order.

---

## Troubleshooting

### Clients Skipping Floor Packages

**Symptom**: Clients go directly to target instead of installing floor packages first.

**Possible Causes**:

1. **Floor not configured**: The package was not marked as a floor for this channel.

2. **Client already past the floor**: Floors only apply to clients with versions lower than the floor version.

3. **Floor added after channel promotion**: Clients that already received the target won't go back through floors.

### Cannot Delete Package

**Symptom**: Error "cannot delete package marked as floor version"

**Cause**: Package is configured as a floor for one or more channels.

**Solution**: Remove the floor relationship from all channels first, then delete the package.

### Cannot Blacklist Package

**Symptom**: Error "cannot blacklist package marked as floor version for this channel"

**Cause**: A package cannot be both a floor and blacklisted for the same channel.

**Solution**: Remove the floor relationship first if you need to blacklist the package.

### Syncer Not Receiving Floor Packages

**Symptom**: Downstream Nebraska doesn't have floor packages after syncing.

**Cause**: Your Nebraska version doesn't support `multi_manifest_ok`, and therefore floor packages cannot be received. The downstream Nebraska must be upgraded first.

**Diagnosis**:

```bash
# Check syncer logs for multi-manifest handling
docker logs nebraska 2>&1 | grep -i "floor\|manifest"
```

---

## Best Practices

- **Configure floors before promotion**: Always add floors BEFORE promoting a channel to a new target
- **Don't use beta/alpha packages as stable floors**: This would push unstable packages to stable clients
- **Document floor reasons**: Clear reasons help operators understand why a floor exists months later
- **Monitor floor progression**: Watch for instances stuck on floor versions, which may indicate update failures
- **Test floor paths**: Verify the update path works from your oldest supported version before broad rollout
