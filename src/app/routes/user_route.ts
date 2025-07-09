import { H3 } from "h3";

export const userRoute = new H3()

userRoute.get("/", () => {
    return { message: "Hello, app!" }
});