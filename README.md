# UI5 Antares Pro Proxy

**UI5 Antares Pro Proxy** is a custom proxy middleware designed for local testing of the [UI5 Antares Pro](https://ui5-antares-pro.github.io) library within SAPUI5 applications. It resolves conflicts with the standard `fiori-tools-proxy` when serving local custom libraries and ensures that both standard UI5 resources and UI5 Antares Pro resources are correctly loaded during development.

---

## 🎯 Purpose

SAPUI5 applications running locally using `ui5 serve` (from [@ui5/cli](https://www.npmjs.com/package/@ui5/cli)) or `fiori run` (from [@sap/ux-ui5-tooling](https://www.npmjs.com/package/@sap/ux-ui5-tooling)) typically use the `fiori-tools-proxy` middleware, which handles:

- Proxying UI5 resources (`/resources`, `/test-resources`) from the [UI5 CDN](https://ui5.sap.com)
- Redirecting backend requests (e.g., `/sap`) to target systems

However, since **UI5 Antares Pro** is a custom library loaded under the `/resources` path but **not available on the UI5 CDN**, the `fiori-tools-proxy` mistakenly tries to load it from the CDN, resulting in `404 Not Found` errors.

The `ui5-antares-pro-proxy` middleware is introduced to fix this by taking over the responsibility of proxying **UI5 resources**, while still letting `fiori-tools-proxy` handle backend requests.

---

## 📦 Installation

1. Add the middleware as a development dependency:

   ```sh
   npm install --save-dev ui5-antares-pro-proxy
   ```

2. Locate the **YAML configuration file** (typically `ui5.yaml` or `ui5-local.yaml`) used with `ui5 serve` or `fiori run`.

   ⚠️ This file defines the middleware behavior for your local development server. The changes described here should be made **in this file**.

3. Remove the `ui5` configuration block from the `fiori-tools-proxy` middleware (to prevent it from handling UI5 requests):

   **Before:**

   ```yaml
   specVersion: "4.0"
   metadata:
     name: your.app.name
   type: application
   server:
     customMiddleware:   
       - name: fiori-tools-proxy
         afterMiddleware: compression
         configuration:
           ignoreCertError: true
           ui5:                             # ❌ REMOVE THIS BLOCK
             path:
               - /resources
               - /test-resources
             url: https://ui5.sap.com
           backend:
             - path: /sap
               url: https://your.backend.url
               client: '200'
   ```

   **After:**

   ```yaml
   specVersion: "4.0"
   metadata:
     name: your.app.name
   type: application
   server:
     customMiddleware:   
       - name: fiori-tools-proxy
         afterMiddleware: compression
         configuration:
           ignoreCertError: true
           backend:
             - path: /sap
               url: https://your.backend.url
               client: '200'
   ```

4. Add the `ui5-antares-pro-proxy` middleware to the configuration file **before** `fiori-tools-proxy`:

> ⚠️ Configuration block is optional. If not specified, the `ui5-antares-pro-proxy` will load UI5 resources from the [https://ui5.sap.com](https://ui5.sap.com) address with the version determined from consumer's `manifest.json` file (**"sap.ui5"."dependencies"."minUI5Version"**).

   ```yaml
   specVersion: "4.0"
   metadata:
     name: your.app.name
   type: application
   server:
     customMiddleware:
       - name: ui5-antares-pro-proxy
         afterMiddleware: compression
         configuration:                     # Optional: Configure UI5 CDN
           ui5:
             path:
               - /resources
               - /test-resources
             url: https://ui5.sap.com       # Optional: override with a different CDN
             version: 1.136.3               # Optional: explicitly define UI5 version

       - name: fiori-tools-proxy
         afterMiddleware: compression
         configuration:
           ignoreCertError: true
           backend:
             - path: /sap
               url: https://your.backend.url
               client: '200'

       - name: fiori-tools-appreload
         afterMiddleware: compression
         configuration:
           port: 35729
           path: webapp
           delay: 300

       - name: fiori-tools-preview
         afterMiddleware: fiori-tools-appreload
         configuration:
           flp:
             theme: sap_horizon
   ```

---

## ⚙️ UI5 Resource Configuration

By default, the middleware reads the `minUI5Version` from your `manifest.json` to determine the UI5 version:

```json
{
  "sap.ui5": {
    "dependencies": {
      "minUI5Version": "1.120.0"
    }
  }
}
```

If needed, you can override both the **url** and **version** in the `ui5.yaml`:

```yaml
configuration:
  ui5:
    path:
      - /resources
      - /test-resources
    url: https://other-ui5-cdn.example.com
    version: 1.136.3
```

You can define multiple paths to ensure that both application resources and test resources are proxied properly.

### ⚠️ UI5 Resource Caching Notice

UI5 resources may be cached by the browser. If recent changes do not appear as expected, this is likely due to the browser's caching mechanism for static UI5 resources.

To ensure you're seeing the latest updates, **please try one of the following**:

- Open the application in **Incognito / Private mode**
- **Clear your browser cache** and reload the page

This is a common behavior with UI5's resource loading and not related to the proxy itself.

---

## ✅ Middleware Responsibility Summary

<table>
  <thead>
    <tr>
      <th>Concern</th>
      <th>Middleware</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Standard UI5 libraries (<code>/resources</code>)</td>
      <td><code>ui5-antares-pro-proxy</code></td>
    </tr>
    <tr>
      <td>UI5 Antares Pro (<code>/resources/ui5/antares/pro</code>)</td>
      <td><code>ui5-antares-pro-proxy</code></td>
    </tr>
    <tr>
      <td>Backend requests (<code>/sap</code>, etc.)</td>
      <td><code>fiori-tools-proxy</code></td>
    </tr>
  </tbody>
</table>

This setup ensures full compatibility during local development with both the standard SAPUI5 libraries and the UI5 Antares Pro library, while preserving backend proxy behavior.

---

## 🔗 Related Resources

- [UI5 Antares Pro Documentation](https://ui5-antares-pro.github.io)
- [@sap/ux-ui5-tooling on npm](https://www.npmjs.com/package/@sap/ux-ui5-tooling)
- [UI5 Tooling Custom Middleware Guide](https://sap.github.io/ui5-tooling/v4/pages/extensibility/CustomServerMiddleware/)

---
