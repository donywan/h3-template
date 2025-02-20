import { createH3, defineEventHandler } from "h3-nightly";

const positionRoute = createH3();

positionRoute.get("/", defineEventHandler(() => {
    return { message: "Hello, position!" }
}))

export default positionRoute;