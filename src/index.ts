import { createH3, defineEventHandler, toWebHandler, withBase } from "h3-nightly";
import adminRoutes from "./admin";
import userRoute from "./admin/routes/user_route";
import { appRoutes } from "./app";

const server = createH3()

server.use(withBase('/admin', adminRoutes));
server.use(withBase('/app', appRoutes));

Bun.serve({
    port: 3000,
    fetch(req) {
        const handler = toWebHandler(server);
        return handler(req);
    },
});