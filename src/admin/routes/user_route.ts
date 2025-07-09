import { H3 } from "h3";

const userRoute = new H3()

userRoute.get("/", async () => {
    return {
        message: "Hello User 2"
    }
})

export default userRoute;