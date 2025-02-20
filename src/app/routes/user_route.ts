import { createH3, eventHandler } from "h3-nightly";

export const userRoute = createH3()

userRoute.get("/", eventHandler((c) => {
    return { message: "Hello, app!" }
}));