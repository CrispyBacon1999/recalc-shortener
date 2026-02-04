const redirectMap = new Map<string, string>([
    ["/", "/index.html"],
    ["/go", "/go.html"],
]);

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const redirectTarget = redirectMap.get(url.pathname);

        if (redirectTarget) {
            url.pathname = redirectTarget;
        }

        const assetRequest = new Request(url.toString(), request);
        return env.ASSETS.fetch(assetRequest);
    },
};

interface Env {
    ASSETS: Fetcher;
}

