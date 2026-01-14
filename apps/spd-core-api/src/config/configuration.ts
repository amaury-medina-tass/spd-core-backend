export default () => ({
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
  },
});
