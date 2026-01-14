import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().default("development"),
  PORT: Joi.number().default(3003),

  DATABASE_URL: Joi.string().required(),

  JWT_ACCESS_PUBLIC_KEY: Joi.string().required(),

  SERVICEBUS_CONNECTION_STRING: Joi.string().allow("").optional(),
  SERVICEBUS_TOPIC: Joi.string().default("spd.events"),
  SERVICEBUS_SUBJECT_PREFIX: Joi.string().default("SpdCore."),
});
