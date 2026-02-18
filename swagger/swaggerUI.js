import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../config/swagger.js";

const swaggerUI = (app) => {
 app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

};

export default swaggerUI;
