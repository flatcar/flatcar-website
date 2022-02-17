+++
tags = ["flatcar", "containers", "cgroups"]
topics = ["Linux", "cgroups"]
authors = ["jeremi-piotrowski"]
title = "Containerd cgroup2 inotify leak"
draft = false
description = "Containerd running on cgroup2 leaks inotify file handles. Here's how we found out about it"
date = "2021-12-11T20:00:00+02:00"
postImage = "/flatcar-containerd.jpg"
+++

Flatcar has enabled cgroup2 by default since release version 2969.0.0. We chose to keep nodes that are updating on cgroupv1 so that existing deployments are not impacted, we wrote about this on our [blog](https://www.flatcar-linux.org/blog/2021/09/flatcar-container-linux-is-moving-to-cgroupsv2/).

Recently a user reported [issue 563](https://github.com/flatcar-linux/Flatcar/issues/563) on our public bug tracker. We decided to dive-in, see what's happening. This is going to be a technical blog post.

Kubernetes relies on a container runtime to create and run pods and containers. On Flatcar this is ultimately done using containerd through the CRI (container runtime interface) plugin.

{{< figure src="/media/containerd-2021/containerd-diagram-1.png" alt="Diagram showing the container stack in kubernetes: kubelet, containerd and CRI, containerd-shim, runc, container." >}}

Containerd can emit events throughout the lifecycle of a container, as can be seen using `ctr events`:

```
moby /containers/create {"id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","runtime":{"name":"io.containerd.runc.v2","options":{"type_url":"containerd.runc.v1.Options","value":"MgRydW5jOhwvdmFyL3J1bi9kb2NrZXIvcnVudGltZS1ydW5jSAE="}}}
moby /tasks/create {"container_id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","bundle":"/run/containerd/io.containerd.runtime.v2.task/moby/efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","io":{"stdin":"/var/run/docker/containerd/efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70/init-stdin","stdout":"/var/run/docker/containerd/efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70/init-stdout","terminal":true},"pid":1298}
moby /tasks/start {"container_id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","pid":1298}
moby /tasks/exit {"container_id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","pid":1298,"exited_at":"2022-01-21T15:09:50.01186572Z"}
moby /tasks/delete {"container_id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70","pid":1298,"exited_at":"2022-01-21T15:09:50.01186572Z"}
moby /containers/delete {"id":"efdc0c13a23ed36819af834d41727dabf07052298dc46d0a8243089a6f448a70"}
```

One of these events is `/tasks/oom`: containerd-shim subscribes to out-of-memory (OOM) notifications from the kernel for every container it creates, and publishes that event to higher layers like Kubernetes.

The kernel reports an OOM notification when processes exceed the memory limits configured for their cgroup. The way these notifications are reported to userspace is different for legacy cgroup and cgroup2.

# Legacy cgroup notifications

Legacy cgroups has custom notification mechanisms, different than all other unix notification APIs. For OOM notifications, one needs to:

- create an `eventfd` using [eventfd(2)](https://man7.org/linux/man-pages/man2/eventfd.2.html)
- open `memory.oom_control` file
- write string like "<event_fd> <fd of memory.oom_control>" to
  `cgroup.event_control`

To get notified about the last process in a cgroup exiting, one needs to write "1" to the `notify_on_release` file and configure a `release_agent` (for the whole cgroup hierarchy). This release agent is a process that will be spawned by the kernel.

These solutions ended up being hard to manage for both systemd and container runtimes. One of the goals of cgroup2 was to improve the notification facilities.

# Cgroup2 notifications

The Linux API for filesystem notifications is [inotify](https://www.man7.org/linux/man-pages/man7/inotify.7.html). cgroup2 is  pseudo-filesystem that comes with support for inotify notifications. The pseudo-code to watch for OOM notification now looks like this:

```
fd = inotify_init()
inotify_add_watch(fd, "memory.events")
while (read(fd)) {
    // handle changes to memory.events
}
```
The `memory.events` file contains counters of times when different thresholds are hit:
```
low 0
high 0
max 0 
oom 0
oom_kill 0
```
containerd can thus monitor `memory.events` when it is notified, and check which event occurred.

Process exit notifications occur on a different file: `cgroup.events` with the following contents:
```
populated 1
frozen 0
```

# Where things go wrong

Both the legacy and inotify based mechanisms work fine to observe OOM events.

Here's the code for cgroup v1 (https://github.com/containerd/containerd/blob/release/1.5/pkg/oom/v1/v1.go).
```go
// New returns an epoll implementation that listens to OOM events
// from a container's cgroups.
func New(publisher shim.Publisher) (oom.Watcher, error) {
	fd, err := unix.EpollCreate1(unix.EPOLL_CLOEXEC)
	if err != nil {
		return nil, err
	}
	return &epoller{
		fd:        fd,
		publisher: publisher,
		set:       make(map[uintptr]*item),
	}, nil
}

// Add cgroups.Cgroup to the epoll monitor
func (e *epoller) Add(id string, cgx interface{}) error {
	cg, ok := cgx.(cgroups.Cgroup)
	if !ok {
		return errors.Errorf("expected cgroups.Cgroup, got: %T", cgx)
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	fd, err := cg.OOMEventFD()
	if err != nil {
		return err
	}
	e.set[fd] = &item{
		id: id,
		cg: cg,
	}
	event := unix.EpollEvent{
		Fd:     int32(fd),
		Events: unix.EPOLLHUP | unix.EPOLLIN | unix.EPOLLERR,
	}
	return unix.EpollCtl(e.fd, unix.EPOLL_CTL_ADD, int(fd), &event)
}
```

An `epoll` instance is created for the whole containerd-shim process. Each spawned container registers an `eventfd` file descriptor with the kernel for OOM notifications and polls it through `epoll_wait`.

The code for the cgroup2 case has more layers of abstractions and is seen [here](https://github.com/containerd/cgroups/blob/v1.0.2/v2/manager.go#L563-L605). Now every container has one inotify instance, which is subscribed to `memory.events` modification events and sends them through a Go channel.

Unfortunately, there is a difference in behavior when a cgroup gets removed. For cgroup v1 we have this code in the kernel https://github.com/torvalds/linux/blob/v5.15/mm/memcontrol.c#L4665
```c
static void memcg_event_remove(struct work_struct *work)
{
	...
	/* Notify userspace the event is going away. */
	eventfd_signal(event->eventfd, 1);
	...
}
```
and this https://github.com/containerd/containerd/blob/release/1.5/pkg/oom/v1/v1.go#L123-L129 containerd code to handle such a notification:
```go
	if i.cg.State() == cgroups.Deleted {
		e.mu.Lock()
		delete(e.set, fd)
		e.mu.Unlock()
		unix.Close(int(fd))
		return
	}
```

cgroup2 does not notify `memory.events` when the last process exits right before the cgroup is removed [^1]. This means that a process waiting for inotify events will wait indefinitely. In the case of containerd-shim, this process is a goroutine, and blocking indefinitely means never releasing an `inotify` file descriptor for each started container.

How bad is this? It turns out that orchestrators like Kubernetes like to restart processes when they exit or crash. Restarts are delegated to containerd-shim, which spins up a new container with a new identifier and cgroup. Each such cgroup is a new inotify instance. Yikes. This is compounded by the default limit on number of inotify instances.

```
$ sysctl fs.inotify.max_user_instances
fs.inotify.max_user_instances = 128
```

# The solution

The solution for cgroup2 involves subscribing to both events: `memory.events` and `cgroup.events`. This way the goroutine will be notified when a cgroup has been de-populated, and can cleanup the inotify instance. This takes advantage of the fact that systemd is managing cgroups system wide. Systemd will automatically remove managed cgroups as soon as they become empty. The details can be found in the PR that we submitted upstream and that has since been merged: https://github.com/containerd/cgroups/pull/212.

# What this means for users

Users on systems with cgroup2 should update to [containerd 1.6.0](https://github.com/containerd/containerd/releases/tag/v1.6.0) which contains the fix for the inotify leak. Flatcar will be including that version in the next alpha release after 3139.0.0, and in beta/stable not long after that.

We also recommend that all operators increase the value of `fs.inotify.max_user_instances` sysctl to a greater value, like `8192`. On cgroup2 systems, Kubernetes consumes at least 2 inotify instances per pod (for 1 container in the pod, plus the pause container), and the kernel default of 128 is quickly consumed.

# Bonus

If you liked this post and enjoy working on all layers of the container stack, we are currently hiring remote software engineers at all experience levels to join our team to work on open-source projects. Come join us:

* https://careers.microsoft.com/professionals/us/en/job/1217422/Senior-Software-Engineer-Remote
* https://careers.microsoft.com/professionals/us/en/job/1217453/Principal-Software-Engineer-Remote

[^1]: The kernel function responsible for cgroup2 notification is called `cgroup_file_notify` https://github.com/torvalds/linux/blob/v5.15/kernel/cgroup/cgroup.c#L4222. Exercise for the reader: find out where it is called from.
