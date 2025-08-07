import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

let manifest: Manifest | undefined;
let proxy: ReturnType<typeof createProxyMiddleware> | undefined;

async function loadManifest(rootProject: ReaderCollection): Promise<Manifest | undefined> {
    if (!manifest) {
        const files = await rootProject.byGlob("**/manifest.json");

        if (files?.length > 0) {
            manifest = JSON.parse(await files[0].getString());
        }
    }

    return manifest;
}

export default function ({ log, options, resources }: MiddlewareParameters) {
    log.info("Starting ui5-antares-pro-proxy middleware...");

    return async function (req: Request, res: Response, next: NextFunction) {
        const antaresPath = "/resources/ui5/antares/pro";

        if (req.url.startsWith(antaresPath)) {
            return next();
        }

        const manifestContent = await loadManifest(resources.rootProject);
        const version = options.configuration?.ui5?.version || manifestContent?.["sap.ui5"]?.dependencies?.minUI5Version;
        let ui5Url = options.configuration?.ui5?.url || "https://ui5.sap.com";

        if (version) {
            ui5Url += `/${version}`;
        }

        if (req.url.startsWith("/resources") || req.url.startsWith("/test-resources")) {
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
    options: {
        configuration?: {
            ui5?: {
                path: string | string[];
                url: string;
                version?: string;
            };
        };
    };
    resources: {
        rootProject: ReaderCollection;
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