---
title: Deployment & Authorization
weight: 10
---

Nebraska uses either a noop authentication or OIDC to authenticate and authorize users.

# Preparing the database for Nebraska

Nebraska uses the `PostgreSQL` database, and expects the used database to
be set to the UTC timezone.

For a quick setup of `PostgreSQL` for Nebraska's development, you can use
the `postgres` container as follows:

- Start `Postgres`:
  - `docker run --rm -d --name nebraska-postgres-dev -p 5432:5432 -e POSTGRES_PASSWORD=nebraska postgres`

- Create the database for Nebraska (by default it is `nebraska`):
  - `psql postgres://postgres:nebraska@localhost:5432/postgres -c 'create database nebraska;'`

- Set the timezone to Nebraska's database:
  - `psql postgres://postgres:nebraska@localhost:5432/nebraska -c 'set timezone = "utc";'`

## Tuning PostgreSQL auto-vacuum

Autovacuum and autoanalyze in PostgreSQL are effectively disabled when tables
are very large. This is because the default is 20% of a table (and 10%
of a table for analyze).

We advise to change the mentioned configuration in order to have autovacuum
and autoanalyse run when about 5,000 rows change. This value was chosen
based on getting the autovacuum to run every day, as it's large enough
to not cause the autovac to run all the time, but about the right size
to make a difference for query statistics and reducing table bloat.

You can verify (and eventually use) this [SQL file](./autovacuum-tune.sql)
where we have set up these changes.

The analyze threshold was chosen at half the autovacuum threshold
because the defaults are set at half.

# Deploying Nebraska for testing on local computer (noop authentication)

- Go to the nebraska project directory and run `make`

- Start the database (see the section above if you need a quick setup).

- Start the Nebraska backend:
  - `nebraska -auth-mode noop -http-static-dir $PWD/frontend/dist
-http-log`

- In the browser, access `http://localhost:8000`

# Deploying Nebraska with OIDC authentication mode

> **⚠️ OIDC Implementation Updated**
>
> Nebraska now uses Authorization Code Flow + PKCE with public clients for enhanced security.
>
> - **New in v2.13**: Frontend handles OIDC flow directly, no client secrets required
> - **Upgrading?** See the [OIDC Migration Guide](https://github.com/flatcar/nebraska/blob/main/docs/oidc-migration-guide.md)

## Preparing Keycloak as an OIDC provider for Nebraska

- Run `Keycloak` locally in dev mode using docker:

  ```sh
  docker run -d --name keycloak \
    -p 127.0.0.1:8080:8080 \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -e KC_HTTP_ENABLED=true \
    -e KC_HOSTNAME_STRICT=false \
    -e KC_HOSTNAME_STRICT_HTTPS=false \
    quay.io/keycloak/keycloak:26.3.4 \
    start-dev
  ```

- Open http://localhost:8080 in your browser to access keycloak UI and login with the username admin and password as admin.

## Creating a client

1. Click on `Clients` menu option and click `Create`.
2. Set the client name as `nebraska` and click `Save`.
3. Change the `Access Type` to `public` (for SPA/public client).
4. Ensure `Direct Access Grants Enabled` is OFF (not needed for PKCE flow).
5. Ensure `Standard Flow Enabled` is ON (for Authorization Code Flow).
6. Set `Valid Redirect URIs` to `http://localhost:8000/auth/callback`.
7. Set `Valid post logout redirect URIs` to `http://localhost:8000/`.
8. Set `Web Origins` to `http://localhost:8000` (use `+` to allow all Valid Redirect URIs origins for CORS).

{{< presentation "keycloak-create-client" >}}

## Creating Roles

### Member Role

1. Click on `Roles` menu option and select `Create Role`.
2. Provide a name for the member role, here we will use `nebraska_member`.
3. Click `Save`.

### Admin Role

1. Click on `Roles` menu option and select `Create Role`.
2. Provide a name for the admin role, here we will use `nebraska_admin`.
3. Click `Save`.
4. After the admin role is created enable composion: Go to associated roles, and add `nebraska_member`.

Now the member and admin roles are created, the admin role is a composite role which comprises of member role.

{{< presentation "keycloak-create-roles" >}}

## Adding roles scope to token

1. Click on `Client Scopes > nebraska-dedicated`.
2. Click on `Configure a new mapper`
2. Click on `User Client Role`
2. Set the name as `roles`, Select the `Mapper Type` as `User Client Role`, `Token Claim Name` as `roles` and Select `Claim JSON Type` as String.
3. Click `Save`

{{< presentation "keycloak-scope-token" >}}

## Attaching Roles to User

1. Click on `Users` menu option and click `admin`.
2. Go to `Role Mapping` tab and select `nebraska_admin` role and click on assign. If you want to provide only member access access select the member role.

{{< presentation "keycloak-assign-roles" >}}

## Nebraska

- Go to the nebraska project directory and run `make`

- Start the database (see the section above if you need a quick setup).

- Setup OIDC provider as a **public client** (see provider-specific instructions below).

- Start the Nebraska backend:

  ```bash
  backend/bin/nebraska --debug --auth-mode oidc \
    --http-static-dir frontend/dist \
    --oidc-admin-roles nebraska_admin \
    --oidc-viewer-roles nebraska_member \
    --oidc-client-id nebraska \
    --oidc-issuer-url http://localhost:8080/realms/master
  ```

  **Optional flags:**
  - `--oidc-roles-path`: Custom JSON path for roles (default: "roles")
  - `--oidc-scopes`: OIDC scopes (default: "openid,profile,email")
  - `--oidc-audience`: Required for some providers like Auth0
  - `--oidc-management-url`: URL for user account management
  - `--oidc-logout-url`: Fallback logout URL if not in OIDC discovery

- In the browser, access `http://localhost:8000`

# Preparing Auth0 as an OIDC provider for Nebraska

## Create and configure new application

1. Click on `Create Application`.
2. Provide the name as `nebraska`, select `Single Page Application` (SPA).
3. Click `Create`
4. Click on the `Settings` tab.
5. Under `Application URIs` section:
   - **Allowed Callback URLs**: `http://localhost:8000/auth/callback`
   - **Allowed Web Origins**: `http://localhost:8000` (for CORS)
   - **Allowed Logout URLs**: `http://localhost:8000/`
6. Under `Advanced Settings > Grant Types`:
   - Ensure `Authorization Code` is checked
   - Ensure `Implicit` is **unchecked**
7. Click on `Save Changes`

## Create an API for audience parameter

1. Go to `Applications > APIs` in the Auth0 dashboard.
2. Click `Create API`.
3. Set a name (e.g., "Nebraska API") and identifier (e.g., `http://localhost`).
   - Note: The identifier doesn't need to be a real URL, it's just a unique string.
4. Click `Create`.
5. Use this identifier as the `--oidc-audience` parameter when starting Nebraska.
6. Find the `<your-client-id>` and `<your-domain>` from the Auth0 dashboard: `Applications > nebraska > Settings`
   ```bash
   backend/bin/nebraska --debug --auth-mode oidc \
     --oidc-client-id <your-client-id> \
     --oidc-issuer-url https://<your-domain>.auth0.com/ \
     --oidc-audience http://localhost \
     --oidc-roles-path "http://nebraska\.io/roles" \
     --oidc-admin-roles nebraska_admin \
     --oidc-viewer-roles nebraska_member \
     --http-static-dir frontend/dist
   ```

{{< presentation "auth0-setup" >}}

## Adding roles scope to token

1. Click on `Actions > Library` and find the `Create Action` menu from top right.
2. Click on `Build from scratch` option.
3. Provide a name for the new action.
4. Choose the `Login / Post Login` trigger type and the recommended runtime.
5. Paste the following snippet in `Script` text box.

```js
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "http://nebraska.io"; // this value is just an example

  if (event.authorization) {
    api.accessToken.setCustomClaim(
      `${namespace}/roles`,
      event.authorization.roles,
    );
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```

6. Click on `Deploy`. Now the action to add the roles to the token is setup, but then we yet have to create the trigger for it.
7. Go to `Triggers` under the `Actions` main menu.
8. Choose the `post-login` flow.
9. Find the newly created action on the right side (switch to the `custom` tab).
10. Drag & Drop the action between the `Start` and `Complete` steps in the flow.
11. Click `Apply`.
12. Go to `User Management` and add the role to your users.

Now the action that adds the roles to the token will be triggered after each login and the roles will be available in the key `http://nebraska.io/roles`.

Note: The `oidc-roles-path` argument accepts a JSONPath to fetch roles from the token, in this case set the value to `"http://nebraska\.io/roles"`.

{{< presentation "auth0-roles-setup" >}}

# Preparing Dex with github connector as an OIDC provider for Nebraska

## Setting up a Github App to be used as a connector for Dex

- Create a new `organization` in Github.

- Now you need a Github app, go to `https://github.com/organizations/<ORG>/settings/apps/new` and fill
  the following fields:
  - `GitHub App name` - just put some fancy name.

  - `Homepage URL` - `http://localhost:8000`

  - `User authorization callback URL` - `http://0.0.0.0:5556/dex/callback`

  - `Permissions` - `Access: Read-only` to `Organization members`

  - `User permissions` - none needed

  - `Subscribe to events` - tick `Membership`, `Organization` and `Team`

  - `Where can this GitHub App be installed?` - `Only on this account`

- Press `Create GitHub App` button

- Next thing you'll get is `OAuth credentials` at the bottom of the
  page of the app you just created, we will need both `Client ID` and
  `Client secret`

- You also need to install the app you just created
  - Go to `https://github.com/organizations/<ORG>/settings/apps`

  - Click `Edit` button for your new app

  - Choose `Install App` on the left of the page and perform the
    installation

## Creating Github Teams

- Create two teams in your organization with the following names
  `admin` and `viewer`.

- Add the admin users to both `admin` and `viewer` team. Add the non-admin users to
  `viewer` team.

## Configuring and Running Dex IDP

- Create a configuration for Dex based on the example.

> example.yaml

```yaml
issuer: http://0.0.0.0:5556/dex

storage:
  type: sqlite3
  config:
    file: /var/dex/dex.db

web:
  http: 0.0.0.0:5556

staticClients:
  - id: nebraska
    redirectURIs:
      - "http://localhost:8000/auth/callback"
    name: "nebraska"
    public: true # Public client for PKCE flow, no secret needed

connectors:
  - type: github
    id: github
    name: GitHub
    config:
      clientID: <Client ID>
      clientSecret: <Client Secret>
      redirectURI: http://0.0.0.0:5556/dex/callback
      loadAllGroups: true
      teamNameField: slug
      useLoginAsID: true

enablePasswordDB: true
```

- Run Dex using docker with the example configuration.

> docker run -p 5556:5556 -v ${PWD}/example.yaml:/etc/dex/example.yaml -v ${PWD}/dex.db:/var/dex/dex.db ghcr.io/dexidp/dex:v2.28.1 dex serve /etc/dex/example.yaml

## Running nebraska

> nebraska --auth-mode oidc \
>  --oidc-admin-roles <organization>:admin \
>  --oidc-viewer-roles <organization>:viewer \
>  --oidc-client-id nebraska \
>  --oidc-issuer-url http://127.0.0.1:5556/dex \
>  --oidc-roles-path groups \
>  --oidc-scopes groups,openid,profile \
>  --http-static-dir $PWD/frontend/dist

# Preparing Okta as an OIDC provider for Nebraska

## Create and configure new application

1. Log in to your Okta Admin Dashboard.
2. Navigate to `Applications > Applications`.
3. Click `Create App Integration`.
4. Select `OIDC - OpenID Connect` and then `Single-Page Application`.
5. Configure the application:
   - **App integration name**: `Nebraska`
   - **Grant type**: Authorization Code (with PKCE automatically enabled for SPAs)
   - **Sign-in redirect URIs**: `http://localhost:8000/auth/callback`
   - **Sign-out redirect URIs**: `http://localhost:8000` (optional)
   - **Trusted Origins** (under Security > API):
     - Add `http://localhost:8000` for CORS
6. In `Assignments`, assign users or groups who should have access.
7. Note your `Client ID` from the application's General tab.

## Configure groups/roles claims

1. Navigate to `Security > API > Authorization Servers`.
2. Select your authorization server (or use `default`).
3. Go to the `Claims` tab and add a new claim:
   - **Name**: `roles` or `groups`
   - **Include in**: Access Token
   - **Value type**: Groups
   - **Filter**: Select the groups you want to include
4. Use the Issuer URI from the authorization server settings.

## Start Nebraska with Okta

```bash
nebraska --auth-mode oidc \
  --oidc-client-id <your-client-id> \
  --oidc-issuer-url https://<your-domain>.okta.com/oauth2/default \
  --oidc-admin-roles nebraska_admin \
  --oidc-viewer-roles nebraska_viewer \
  --http-static-dir $PWD/frontend/dist
```

# Preparing Azure AD (Microsoft Entra ID) as an OIDC provider for Nebraska

## Register a new application

1. Sign in to the [Azure Portal](https://portal.azure.com).
2. Navigate to `Azure Active Directory > App registrations`.
3. Click `New registration`:
   - **Name**: `Nebraska`
   - **Supported account types**: Choose based on your requirements
   - **Redirect URI**:
     - Platform: `Single-page application`
     - URI: `http://localhost:8000/auth/callback`
4. After creation, note the `Application (client) ID` and `Directory (tenant) ID`.

## Configure the application

1. In your app registration, go to `Authentication`:
   - Ensure the redirect URI is set correctly
   - Under `Implicit grant and hybrid flows`, ensure both checkboxes are **unchecked**
   - Configure `Logout URL`: `http://localhost:8000` (optional)
2. Go to `API permissions`:
   - Ensure `Microsoft Graph > User.Read` is present (default)
   - Add any group permissions if using group-based roles
3. For CORS, go to `Expose an API`:
   - Add your application's URL to allowed origins if needed

## Configure group claims (optional)

1. Go to `Token configuration`.
2. Click `Add groups claim`.
3. Select the appropriate group types for your setup.
4. The groups will appear in the `groups` claim in the token.

## Start Nebraska with Azure AD

```bash
nebraska --auth-mode oidc \
  --oidc-client-id <your-application-id> \
  --oidc-issuer-url https://login.microsoftonline.com/<your-tenant-id>/v2.0 \
  --oidc-admin-roles <admin-group-id> \
  --oidc-viewer-roles <viewer-group-id> \
  --oidc-roles-path groups \
  --http-static-dir $PWD/frontend/dist
```

Note: Azure AD returns group IDs (GUIDs) rather than group names in the token. You'll need to use the group IDs in your role configuration.

# Deploying on Kubernetes using the Helm Chart

We maintain a Helm Chart for deploying a Nebraska instance to Kubernetes. The
Helm Chart offers flexible configuration options such as:

- Deploy a single-replica `PostgreSQL` database together with Nebraska. We use
  the container image and also the Helm Chart (as a subchart) from
  [Bitnami](https://github.com/bitnami/charts/tree/master/bitnami/postgresql)

- Enabling / disabling, and configuring persistence for both Nebraska and PostgreSQL
  (persistence is disabled by default)

- Common deployment parameters (exposing through `Ingress`, replica count, etc.)

- All [Nebraska application configuration](https://github.com/flatcar/nebraska/tree/main/charts/nebraska#nebraska-configuration)

For the complete list of all available customization options, please read the
[Helm Chart README](https://github.com/flatcar/nebraska/blob/main/charts/nebraska/README.md).

To install the Helm Chart using the default configuration (noop authentication),
you can execute:

```console
$ helm repo add nebraska https://flatcar.github.io/nebraska
$ helm install my-nebraska nebraska/nebraska
```

You probably need to customize the installation, then use a Helm values file.
Eg.:

```yaml
# nebraska-values.yaml
config:
  app:
    title: Nebraska

  auth:
    mode: github
    github:
      clientID: <your clientID obtained during GitHub App registration>
      clientSecret: <your clientSecret obtained during GitHub App registration>
      sessionAuthKey: <64 random hexadecimal characters>
      sessionCryptKey: <32 random hexadecimal characters>
      webhookSecret: <random Secret used in GitHub App registration>

ingress:
  annotations:
    kubernetes.io/ingress.class: <your ingress class>
  hosts:
    - nebraska.example.com

postgresql:
  postgresqlPassword: <A secure password>
  persistence:
    enabled: true
    storageClass: <A block storage-class>
    accessModes:
      - ReadWriteOnce
    size: 1Gi
```

Then execute:

```console
$ helm install my-nebraska nebraska/nebraska --values nebraska-values.yaml
```

# Troubleshooting

## Common OIDC Issues

- **CORS errors in browser console**
  - Ensure your OIDC provider has the Nebraska URL in allowed origins/CORS settings
  - For development with frontend on port 3000, add `http://localhost:3000` to allowed origins

- **"Invalid redirect URI" error**
  - Verify the callback URL is exactly `http://localhost:8000/auth/callback`
  - Check for trailing slashes or protocol mismatches (http vs https)

- **JWT validation failed / User has no access**
  - Check that roles are correctly configured in your OIDC provider
  - Verify the roles path matches your token structure (use `--oidc-roles-path` if needed)
  - For Auth0, ensure you created an API and set the audience parameter

- **Frequent re-authentication after page refresh**
  - This is expected behavior as tokens are stored in-memory for security
  - Configure longer access token expiration in your OIDC provider (1-4 hours recommended)
  - SSO session will handle re-authentication transparently if still valid

- **Auth0: "JWT malformed" or decode errors**
  - Ensure Implicit grant is disabled in application settings
  - Verify audience parameter is set correctly
  - Check that you created an API in Auth0 and using its identifier

## General Issues

- **I'm getting a blank page!**
  - You likely visited nebraska frontend website before, so browser
    likely has cached the `index.html` page, so it won't get it from
    Nebraska, but instead start asking for some CSS and javascript
    stuff outright, which it won't get. That results in a blank
    page. Force the browser to get `index.html` from Nebraska by
    either doing a force refresh (ctrl+f5 on firefox), or by cleaning
    the cache for localhost (or the server where the Nebraska instance
    is deployed).

# Legacy OIDC Configuration

<details>
<summary>Click to expand legacy configuration (for Nebraska versions before v2.x)</summary>

## Legacy Setup (Confidential Client)

Older versions of Nebraska used a confidential client setup with the backend handling the OAuth flow.

### Key Differences:

- Required `--oidc-client-secret` flag
- Used redirect URI: `/login/cb` instead of `/auth/callback`
- Client configured as "Confidential" instead of "Public"
- Backend handled token storage with session management

### Migration Steps:

If upgrading from an older version:

1. Update your OIDC provider:
   - Change client type from "Confidential" to "Public"
   - Update redirect URI from `/login/cb` to `/auth/callback`
   - Add CORS/Web Origins configuration
   - Remove client secret (no longer needed)

2. Update Nebraska configuration:
   - Remove `--oidc-client-secret` flag
   - Remove `--oidc-session-secret` flag (if used)
   - Remove `--oidc-session-crypt-key` flag (if used)
   - Add `--oidc-audience` for Auth0 (if applicable)

3. See the full [OIDC Migration Guide](https://github.com/flatcar/nebraska/blob/main/docs/oidc-migration-guide.md) for detailed instructions.

</details>
