# UI5 Antares Pro Proxy

UI5 Antares Pro Proxy is a custom proxy middleware that is specifically developed for testing [UI5 Antares Pro](https://ui5-antares-pro.github.io) library within local SAPUI5 applications. 

The SAPUI5 applications that are running with `ui5 serve` (@ui5/cli package) or `fiori run` (@sap/ux-ui5-tooling package) command typically includes the `fiori-tools-proxy` middleware to proxy UI5 CDN (https://ui5.sap.com) or backend requests to target URLs. The UI5 resources are loaded through `/resources` path which results in a conflict with the [UI5 Antares Pro](https://ui5-antares-pro.github.io) library which is also loaded through `/resources` path. 

However, custom libraries are not stored at [https://ui5.sap.com](https://ui5.sap.com) address. Instead, they are included into the build result of the applications under the `resources` folder created by the [@ui5/cli](https://www.npmjs.com/package/@ui5/cli) package. In local environment, the `fiori-tools-proxy` middleware forwards requests coming to the `/resources/ui5/antares/pro` path to [https://ui5.sap.com](https://ui5.sap.com) address which results in **404 not found** error.

Consumers of [UI5 Antares Pro](https://ui5-antares-pro.github.io) can install this proxy middleware as a `devDependency` to resolve the local testing issues.

## Installation

1. Install the package as a `devDependency` in your root folder of SAPUI5 application using the following command:

```sh
npm install --save-dev ui5-antares-pro-proxy
```

2. Remove the `ui5` part from `fiori-tools-proxy` middleware which is located in one of your `yaml` files which serves as a configuration file for the `ui5 serve` or `fiori run` command.

```yaml
specVersion: "4.0"
metadata:
  name: test.ui5.antares.pro.employeeui
type: application
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertError:
        # Remove start
        ui5:
          path:
            - /resources
            - /test-resources
          url: https://ui5.sap.com
        # Remove end
        backend:
          - path: /sap
            url: https://sbxs24.solco.global.nttdata.com:44300
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

3. Add the ui5-antares-pro-proxy middleware.

```yaml
specVersion: "4.0"
metadata:
  name: test.ui5.antares.pro.employeeui
type: application
server:
  customMiddleware:
    # UI5 Antares Pro Proxy middleware
    - name: ui5-antares-pro-proxy
      afterMiddleware: compression
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertError:
        backend:
          - path: /sap
            url: https://sbxs24.solco.global.nttdata.com:44300
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