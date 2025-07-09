import { H3 } from "h3";

const positionRoute = new H3();

positionRoute.get("/", () => {
    return { message: "Hello, position!" }
})

export default positionRoute;