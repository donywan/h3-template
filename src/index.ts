import { createH3, toWebHandler, withBase } from "h3-nightly";
import adminRoutes from "./admin";
import { appRoutes } from "./app";

const server = createH3({
    onRequest: (req) => {
        // 处理jwt 
        // console.log(req.ip);
        // console.log(req.request);
        // console.log(req.url);
        // console.log(req.response);
    }
})

server.get("/", (c) => {
    return { message: "Hello, h3!" };
});


server.use('/admin/**', withBase('/admin', adminRoutes));
server.use('/admin/**', withBase('/app', appRoutes));

Bun.serve({
    port: 3000,
    fetch(req) {
        const handler = toWebHandler(server);
        return handler(req);
    },
});