---
title: "Flatcar Self-Paced Learning Series: Advanced Provisioning Configuration"
linktitle: Advanced Configuration
weight: 2
author: Lexi Nadolski, Thilo Fromm
---

Building on the first session, we’ll dive into Butane configuration and deploy a more elaborate webpage.

## A note for infrastructure developers

All configuration included in this course can also be generated programmatically.
[Ignition](https://github.com/coreos/ignition) provides Go bindings for all Butane options used.

# Goals

In this session, you'll learn:

- Getting familiar with Butane configuration and performing quick local test iterations to get production ready.
  Find the full specification [here](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/configuration/).
- Extending your configuration to provision more complex services.
- Securing services by running as unprivileged users.
- Splitting your Butane configuration into multiple files for readability and maintainability.

## Prerequisites

The session builds on the first session, [Basic Operation and Local Testing](basics-and-testing).
It assumes you

- have created a local test environment.
- are able to start ephemeral Flatcar VMs.
- know how to transpile Butane YAML to Ignition JSON.
- pass Ignition JSON configuration to a VM at launch.
- redirect host ports to the VM.

# A slightly more useful basic web server

In the previous session, we set up an NGINX web server.
However, that server was unable to serve any actual content (apart from the default index page).
In our first example, we'll set up a server that serves content we'll provide.

We'll add an inline web page to serve as our index page.
And because choice is important, we'll use Caddy instead of NGINX this time.

<details>
<summary>Check out this Butane config</summary>

```yaml
variant: flatcar
version: 1.0.0

storage:
  files:
    - path: /srv/www/html/index.html
      mode: 0644
      contents:
        inline: |
          <html><body align="center">
          <h1>Hello, World 👋</h1>
          </body></html>
systemd:
  units:
    - name: web.service
      enabled: true
      contents: |
        [Unit]
        Description=Flatcar Learning Session #2 web server example
        After=docker.service
        Requires=docker.service
        [Service]
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force caddy
        ExecStart=/usr/bin/docker run -i -p 80:80 --name caddy \
                  -v /srv/www/html:/usr/share/caddy \
                  docker.io/caddy caddy file-server \
                  --root /usr/share/caddy --access-log
        ExecStop=/usr/bin/docker stop caddy
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

</details>

Copy and paste it into a local file `webserver.yaml`, then run
```sh
cat webserver.yaml | docker run --rm -i quay.io/coreos/butane:latest > webserver.json
```

Now start the VM with this configuration, and redirect host port 12345 to VM port 80:
```sh
./flatcar_production_qemu_uefi.sh -i webserver.json -f 12345:80 -snapshot -nographic
```

After a few seconds you should be able to connect to [http://localhost:12345](http://localhost:12345) on your local machine and marvel at the web page you've deployed.

Since we activated access logging in Caddy, you should be able to see your web browser requests in the Caddy log:
```sh
journalctl -f --no-pager -l -u web
```

Then reload the `localhost` page in your browser to generate log entries.  
To exit the log view, press `Ctrl+C`.

When you're done testing, shut down the VM
```sh
sudo poweroff
```

## Different ways to provision files to Flatcar VMs

There are a number of ways to add files to your VM at provisioning time.

- `inline` we've used in the above example: the file contents are added inside the provisioning configuration.
  Nice for small text based files.
- `local` will include local files - i.e. files in the same directory as the Butane config file, or in a subdirectory. 
  Suitable for small binary files.
  - there's also `tree` to include whole local directory trees. Use with care as this tends to impact the JSON file size.
- `source` provisions a remote file.
   This file will be downloaded **at provisioning time**; the file will not be included in the JSON config.
   Recommended for large files since the JSON config is passed as user data / custom data, which has size limits on most vendors / clouds.

### Inline

We already use inline - it's the simplest and most straightforward way to include content, by embedding it straight into the YAML file.
Suitable for small text files like our HTML index page.
```yaml
    - path: /srv/www/html/index.html
      mode: 0644
      contents:
        inline: |
          <html><body align="center">
          <h1>Hello, World 👋</h1>
          </body></html>
```

### Local

Embeds a local file into the JSON configuration at transpile time.
Suitable for small binary or text files, e.g. configuration files under source control.
We'll use this in our next example to embed an SVG logo into our deployment.
```yaml
    - path: /srv/www/html/logo.svg
      mode: 0644
      contents:
        local: logo.svg
```

### Source

Instructs Ignition to download a file at provisioning time, on early first boot.
Useful for fetching larger files.
We'll use it to provision a video to our website.
```yaml
    - path: /srv/www/html/video.mp4
      mode: 0644
      contents:
        source: https://github.com/flatcar/flatcar-website/raw/refs/heads/main/static/videos/hero-video.mp4
```

## Putting it all together

Let's add a few more files!
First, download the Flatcar logo to the same local directory the Butane config resides in,so we can include it via `local`:
```sh
wget https://www.flatcar.org/media/brand-logo.svg -O logo.svg
```

Now update your Butane config to

1. Include the logo file in the deployment configuration.
2. Reference a video file in the configuration. The file will be downloaded by the VM on first boot.
3. Add both to the index web page HTML.

<details>
<summary>Check out this Butane config</summary>

```yaml
variant: flatcar
version: 1.0.0

storage:
  files:
    - path: /srv/www/html/index.html
      mode: 0644
      contents:
        inline: |
          <html><body align="center">
          <img src="logo.svg" alt="Flatcar logo" />
          <h1>Hello, World 👋</h1>
          <video autoplay muted loop width="640" height="480" src="video.mp4">
          Your browser does not support the &gt;video&lt; HTML tag.
          </video>
          </body></html>
    - path: /srv/www/html/logo.svg
      mode: 0644
      contents:
        local: logo.svg
    - path: /srv/www/html/video.mp4
      mode: 0644
      contents:
        source: https://github.com/flatcar/flatcar-website/raw/refs/heads/main/static/videos/hero-video.mp4
systemd:
  units:
    - name: web.service
      enabled: true
      contents: |
        [Unit]
        Description=Flatcar Learning Session #2 web server example
        After=docker.service
        Requires=docker.service
        [Service]
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force caddy
        ExecStart=/usr/bin/docker run -i -p 80:80 --name caddy \
                  -v /srv/www/html:/usr/share/caddy \
                  docker.io/caddy caddy file-server \
                  --root /usr/share/caddy --access-log
        ExecStop=/usr/bin/docker stop caddy
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

</details>

<br />

Let's transpile!
```sh
cat webserver.yaml | docker run --rm -i quay.io/coreos/butane:latest > webserver.json
```

**Whoops?** What was that? Why doesn't it work? Any idea?

<details>
<summary>What do you think went wrong? How do we resolve it? Extend this section only after trying to resolve it yourself. </summary>

<br />

Ah right! We added a reference to a file to our YAML, to be merged into the JSON configuration.
And we run Butane in a container - it gets our YAML via `stdin` and emits the JSON to `stdout` since we use docker's `-i` option.
But since butane itself runs isolated from the host file system, it cannot access the host file `logo.svg` from inside the container - so it has no way of embedding the logo into the JSON config!

So we need to

1. Tell docker to volume-mount the current directory (where the logo file resides) into the container, to a well-known place (we use `/files`):
   `-v "$(pwd):/files"`.
2. Tell Butane where it finds that directory inside the container so it can access all files referenced by `source: local` lines: `--files-dir /files`

```sh
cat webserver.yaml | docker run --rm -v "$(pwd):/files" -i quay.io/coreos/butane:latest --files-dir /files > webserver.json
```

</details>

<br />

Did you fix it?
Let's fire it up!
```sh
./flatcar_production_qemu_uefi.sh -i webserver.json -f 12345:80 -snapshot -nographic
```

# Securing our service: Users and Groups

Our web server container runs as `root`, so any container escape will automatically gain superuser privileges.
That's not healthy.
But we can use Linux user account isolation to mitigate this issue.

In the VM, verify that everything indeed runs as root:
```sh
ls -la /srv/www/html/
```

Also check the container:
```sh
docker exec -ti caddy ps
```

And lastly, check that the container can happily create new files in the bind-mounted volume:
```sh
docker exec -ti caddy sh -c 'echo "write test" > /usr/share/caddy/test'
ls -la /srv/www/html/
```

When you're done testing, shut down the VM:
```sh
sudo poweroff
```

*Scary!*

Let's create an unprivileged user `webby` and run the web server with that account instead of `root`.
Note that by default, creating a user will also create a group of the same name, to be used as the user's primary group.
We don't need a home directory for that user so we'll tell Butane to not create one.
Also, `webby` will need access to the docker socket to launch the caddy container, so we'll add the user to the `docker` group.

The following snippet will create user `webby`.
```yaml
passwd:
  users:
    - name: webby
      uid: 1234
      no_create_home: true
      groups: [ docker ]
```

Note that we explicitly set a `uid` for use with the docker command line later.
If we don't set a `uid` ignition would pick one automatically, starting with `1000` for the first user created.

Now we can set the ownership of all files we ship, by adding to each file's definition, respectively:
```yaml
      user:        
        name: webby
      group:       
        name: webby
```

Lastly, we want systemd to start the docker container as that user, and docker to run services *inside* the container with the user's uid, so we add
```ini
        User=webby
```
in the `[Service]` section of the web service unit definition and
```
...
                  --user 1234 \
```

to the docker command line in `ExecStart= ...`.
Docker needs the `uid` instead of the user's name because this applies *inside* the caddy container, and there is no user `webby` defined in that container.

<details>
<summary>The full Butane config:</summary>

```yaml
variant: flatcar
version: 1.0.0

passwd:
  users:
    - name: webby
      uid: 1234
      no_create_home: true
      groups: [ docker ]

storage:
  files:
    - path: /srv/www/html/index.html
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        inline: |
          <html><body align="center">
          <img src="logo.svg" alt="Flatcar logo" />
          <h1>Hello, World 👋</h1>
          <video autoplay muted loop width="640" height="480" src="video.mp4">
          Your browser does not support the &gt;video&lt; HTML tag.
          </video>
          </body></html>
    - path: /srv/www/html/logo.svg
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        local: logo.svg
    - path: /srv/www/html/video.mp4
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        source: https://github.com/flatcar/flatcar-website/raw/refs/heads/main/static/videos/hero-video.mp4
systemd:
  units:
    - name: web.service
      enabled: true
      contents: |
        [Unit]
        Description=Flatcar Learning Session #2 web server example
        After=docker.service
        Requires=docker.service
        [Service]
        User=webby
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force caddy
        ExecStart=/usr/bin/docker run -i -p 80:80 --name caddy \
                  -v /srv/www/html:/usr/share/caddy \
                  --user 1234 \
                  docker.io/caddy caddy file-server \
                  --root /usr/share/caddy --access-log
        ExecStop=/usr/bin/docker stop caddy
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

</details>

<br />

Don't forget to transpile!
```sh
cat webserver.yaml | docker run --rm -v "$(pwd):/files" -i quay.io/coreos/butane:latest --files-dir /files > webserver.json
```

Let's run it:
```sh
./flatcar_production_qemu_uefi.sh -i webserver.json -f 12345:80 -snapshot -nographic
```

In the VM, verify that the user exists, and check access rights to the files we ship:
```sh
id webby
ls -la /srv/www/html/
```

We see that while individual files in the directory are owned by user `webby`, the `/srv/www/html/` directory itself is still owned by root.
So the caddy will not be able to create new files on the host.

We can also check the user ID caddy has been started with inside the container:

```sh
docker exec -ti caddy ps
```

And lastly, can we create files from the container?
Let's try to create a file in `/usr/share/caddy/` by writing to it from inside the running container. `/usr/share/caddy/` in the container is volume-mounted from the host's `/srv/www/html`:
```sh
docker exec -ti caddy sh -c 'echo "write test" > /usr/share/caddy/test'
```

If you see a **"Permission denied"** error, then everything worked - the web server is not supposed to write to host.
This works because the container is running as user `1234` which we created earlier, and that user doesn’t have the same privileges as `root` in the host's `/srv/www/html`.

When you're done, shut down the VM:
```sh
sudo poweroff
```

# Splitting the configuration file

Over time, a single Butane config file can grow quite large.
Looking at ours, we might be at that point already!
Fortunately, Ignition offers an option to merge multiple configuration files.

For the purpose of this example, we'll split up our config into:

- `main.yaml`- the main configuration file that pulls everything together
- `files.yaml` - a files configuration that covers all content we want to provision
- `systemd.yaml` - systemd configuration that sets up our web server systemd unit.

We'll keep the few lines of user generation in the main YAML file as it is quite small.
Consider our neat and concise new `main`:
```yaml
variant: flatcar
version: 1.0.0

passwd:
  users:
    - name: webby
      uid: 1234
      no_create_home: true
      groups: [ docker ]

ignition:
  config:
    merge:
      - local: files.json
      - local: systemd.json
```

With concerns separated into individual sub-configurations:

<details>
<summary> files.yaml </summary>

```yaml
variant: flatcar
version: 1.0.0

storage:
  files:
    - path: /srv/www/html/index.html
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        inline: |
          <html><body align="center">
          <img src="logo.svg" alt="Flatcar logo" />
          <h1>Hello, World 👋</h1>
          <video autoplay muted loop width="640" height="480" src="video.mp4">
          Your browser does not support the &gt;video&lt; HTML tag.
          </video>
          </body></html>
    - path: /srv/www/html/logo.svg
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        local: logo.svg
    - path: /srv/www/html/video.mp4
      mode: 0644
      user:
        name: webby
      group:
        name: webby
      contents:
        source: https://github.com/flatcar/flatcar-website/raw/refs/heads/main/static/videos/hero-video.mp4
```

</details>

<br />

and

<details>
<summary> systemd.yaml </summary>

```yaml
variant: flatcar
version: 1.0.0

systemd:
  units:
    - name: web.service
      enabled: true
      contents: |
        [Unit]
        Description=Flatcar Learning Session #2 web server example
        After=docker.service
        Requires=docker.service
        [Service]
        User=webby
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force caddy
        ExecStart=/usr/bin/docker run -i -p 80:80 --name caddy \
                  -v /srv/www/html:/usr/share/caddy \
                  --user 1234 \
                  docker.io/caddy caddy file-server \
                  --root /usr/share/caddy --access-log
        ExecStop=/usr/bin/docker stop caddy
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

</details>

<br />

You probably noticed that the above snippets are for `.yaml` files while we are referencing `.json` files in the main Butane configuration.
That's because the merge happens *on the node*, at first provisioning.
It's done by Ignition, not by Butane.

So we have to transpile ALL the yaml.
The order is important - we need to transpile the snippets first, and the main YAML last - otherwise the JSON files referenced in `main.yaml` do not exist (or worse, are outdated!).

```sh
for f in files systemd main; do 
  cat $f.yaml | docker run --rm -v "$(pwd):/files" -i quay.io/coreos/butane:latest --files-dir /files > $f.json
done
```

And then of course start Flatcar with `main.json` instead of our earlier `webserver.json`

```sh
./flatcar_production_qemu_uefi.sh -i main.json -f 12345:80 -- -snapshot -nographic
```

# Done!

In this session, you learned to:
- Customise your service and to provision arbitrary files from various sources.
- Secure your service by running as unprivileged user.
- Manage complex configuration by splitting it into separate files.

