import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Construction ERP API",
    version: "1.0.0",
    description: "API documentation for Construction ERP backend",
  },
  servers: [
    {
      url: "http://192.168.1.17:5000",
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: {
            type: "string",
            enum: ["super_admin", "site_manager", "accountant", "personal"],
          },
          profilePicture: { type: "string" },
          isActive: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },

      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Vinod Kumar" },
          email: { type: "string", example: "vinod@gmail.com" },
          password: { type: "string", example: "Password@123" },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "vinod@gmail.com" },
          password: { type: "string", example: "Password@123" },
        },
      },

      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // 👈 IMPORTANT
};

export default swaggerJSDoc(options);
