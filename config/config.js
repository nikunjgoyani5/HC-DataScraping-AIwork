import Joi from "joi";
import dotenv from "dotenv";
import { parseJoiError } from "../helper/api-response.helper.js";
import enums from "./enum.config.js";

const nodeEnv = enums.nodeEnvEnums.PRODUCTION;

dotenv.config({
  path: nodeEnv === enums.nodeEnvEnums.DEVELOPMENT ? ".env.dev" : ".env",
});

console.log(
  `Loaded env file: ${
    nodeEnv === enums.nodeEnvEnums.DEVELOPMENT ? ".env.dev" : ".env"
  }`
);

const envVarsSchema = Joi.object({
  PORT: Joi.number().optional(),
  MONGODB_URL: Joi.string().trim().optional(),
  OPENAI_API_KEY: Joi.string().trim().optional(),
})
  .unknown()
  .prefs({ errors: { label: "key" } });

const { value: envVars, error } = envVarsSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const parsedError = parseJoiError(error);
  console.log("Config Error: ", parsedError);
  throw new Error("Invalid environment variables");
}

export default {
  port: envVars.PORT,
  mongodb: {
    url: envVars.MONGODB_URL,
    options: {},
  },
  openAiApiKey: envVars.OPENAI_API_KEY,
};
