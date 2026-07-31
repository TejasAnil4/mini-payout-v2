const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mini Payout System API",
      version: "1.0.0",
      description:
        "A payout system where merchants fund wallets from bank channels and send money to beneficiaries (internal users or external bank accounts). Every action is admin-verified. All money movements are atomic and idempotent.",
      contact: {
        name: "Backend Team",
      },
    },
    servers: [
      {
        url: "http://localhost:5005",
        description: "Local dev",
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
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // where to look for JSDoc comments
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;