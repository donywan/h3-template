import { createH3, withBase } from "h3-nightly";
import userRoute from "./routes/user_route";
import positionRoute from "./routes/position_route";

const adminRoutes = createH3();

adminRoutes.use(withBase('/user', userRoute.handler))
adminRoutes.use(withBase('/position', positionRoute.handler));

export default adminRoutes;