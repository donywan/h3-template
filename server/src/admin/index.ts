import { H3 } from "h3";
import userRoute from "./routes/user_route";
import positionRoute from "./routes/position_route";

const adminRoutes = new H3()

adminRoutes.mount('/user', userRoute)
adminRoutes.mount('/position', positionRoute)

export default adminRoutes;