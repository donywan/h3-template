import { createH3, withBase } from "h3-nightly";
import { userRoute } from "./routes/user_route";

export const appRoutes = createH3()

appRoutes.use(withBase('/user', userRoute));