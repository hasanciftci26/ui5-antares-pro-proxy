import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

let proxy: ReturnType<typeof createProxyMiddleware> | undefined;

async function loadManifest(rootProject: ReaderCollection): Promise<Manifest | undefined> {
    const files = await rootProject.byGlob("**/manifest.json");

    if (files?.length > 0) {
        return JSON.parse(await files[0].getString());
    } else {
        return;
    }
}

function getUi5Routes(options: Options) {
    if (options.configuration?.ui5) {
        if (Array.isArray(options.configuration.ui5.path)) {
            return options.configuration.ui5.path;
        } else {
            return [options.configuration.ui5.path];
        }
    } else {
        return ["/resources", "/test-resources"];
    }
}

export default async function ({ log, options, resources }: MiddlewareParameters) {
    log.info("Starting ui5-antares-pro-proxy middleware...");

    const manifest = await loadManifest(resources.rootProject);
    const ui5Routes = getUi5Routes(options);
    let version: string | undefined;

    if (options.configuration?.ui5?.version) {
        version = options.configuration.ui5.version;
        log.info(`Using UI5 version ${version} based on the proxy configuration`);
    } else if (manifest?.["sap.ui5"]?.dependencies?.minUI5Version) {
        version = manifest["sap.ui5"].dependencies.minUI5Version;
        log.info(`Using UI5 version ${version} based on manifest.json`);
    } else {
        log.info("Using the latest UI5 version because no version was detected in the proxy configuration or manifest.json.");
    }

    return function (req: Request, res: Response, next: NextFunction) {
        const antaresPath = "/resources/ui5/antares/pro";

        if (req.url.startsWith(antaresPath)) {
            return next();
        }
        
        let ui5Url = options.configuration?.ui5?.url || "https://ui5.sap.com";

        if (version) {
            ui5Url += `/${version}`;
        }

        if (ui5Routes.some(route => req.url.startsWith(route))) {
            if (!proxy) {
                proxy = createProxyMiddleware({
                    target: ui5Url,
                    changeOrigin: true
                });
            }

            return proxy(req, res, next);
        } else {
            return next();
        }
    }
};

interface MiddlewareParameters {
    log: {
        info: (message: string) => void;
    };
    options: Options;
    resources: {
        rootProject: ReaderCollection;
    };
}

interface Options {
    configuration?: {
        ui5?: {
            path: string | string[];
            url: string;
            version?: string;
        };
    };
}

interface ReaderCollection {
    byGlob(virPattern: string | string[], options?: object): Promise<Resource[]>;
}

interface Resource {
    getPath(): string;
    getBuffer(): Promise<Buffer>;
    getString(): Promise<string>;
    getName(): string;
}

interface Manifest {
    "sap.ui5"?: {
        dependencies?: {
            minUI5Version?: string;
        };
    };
}