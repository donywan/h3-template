import { createH3, defineEventHandler } from "h3-nightly";

const userRoute = createH3()

userRoute.get("/one", defineEventHandler(() => {
    return {
        message: "Hello User"
    }
}))

userRoute.get("/", defineEventHandler(() => {
    return {
        message: "Hello User 2"
    }
}))

export default userRoute;