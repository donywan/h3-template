import { createH3, toWebHandler, withBase } from "h3-nightly";
import adminRoutes from "./admin";
import { appRoutes } from "./app";

const server = createH3({
    onRequest: (req) => {
    }
})

server.get("/", async (c) => {
    return { message: "Hello, h3!" };
});


server.use('/admin/**', withBase('/admin', adminRoutes));
server.use('/app/**', withBase('/app', appRoutes));

Bun.serve({
    port: 3000,
    fetch(req) {
        const handler = toWebHandler(server);
        return handler(req);
    },
});