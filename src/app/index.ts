import { H3 } from "h3";
import { userRoute } from "./routes/user_route";

export const appRoutes = new H3()

appRoutes.mount('/user', userRoute);