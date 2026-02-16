const configuration = () => ({
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3003),

  database: {
    url: process.env.DATABASE_URL ?? "",
  },

  jwt: {
    accessPublicKey: process.env.JWT_ACCESS_PUBLIC_KEY ?? "",
    publicKey: process.env.JWT_ACCESS_PUBLIC_KEY ?? "",
  },

  serviceBus: {
    connectionString: process.env.SERVICEBUS_CONNECTION_STRING ?? "",
    topic: process.env.SERVICEBUS_TOPIC ?? "spd.events",
    subjectPrefix: process.env.SERVICEBUS_SUBJECT_PREFIX ?? "SpdCore.",
    subscription: process.env.SERVICEBUS_SUBSCRIPTION ?? "spd-worker",
  },

  sap: {
    url: process.env.SAP_URL ?? "",
    auth: process.env.SAP_AUTH ?? "",
  },

  cosmosDb: {
    endpoint: process.env.COSMOS_DB_ENDPOINT || "https://localhost:8081",
    key: process.env.COSMOS_DB_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    databaseName: process.env.COSMOS_DB_DATABASE || "spd_audit",
    containerName: process.env.COSMOS_DB_CONTAINER || "spd_core_logs",
    disableSslVerification: process.env.COSMOS_DB_DISABLE_SSL || "true",
  },

  systemName: process.env.SYSTEM_NAME,
});

export default configuration;
