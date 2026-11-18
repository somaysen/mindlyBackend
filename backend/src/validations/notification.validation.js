import Joi from "joi";
import { body, params, objectId, queries } from "./common.validation.js";

const channels = [
  "taskReminders",
  "focusSessions",
  "weeklyReflections",
  "emailNotifications",
  "pushNotifications",
];
const channelPreference = Joi.alternatives().try(
  Joi.boolean(),
  Joi.object({ enabled: Joi.boolean().required() }).unknown(false),
);
const settingsSchema = Joi.object({
  notificationsEnabled: Joi.boolean().optional(),
  ...Object.fromEntries(
    channels.map((name) => [name, channelPreference.optional()]),
  ),
})
  .min(1)
  .unknown(false);
const settingsRequest = Joi.any()
  .custom((payload, helpers) => {
    let current = payload;
    for (let depth = 0; depth < 2; depth += 1) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return helpers.error("object.base");
      }
      const keys = Object.keys(current);
      const wrappers = keys.filter(
        (key) => key === "settings" || key === "data",
      );
      if (wrappers.length === 0) break;
      if (wrappers.length !== 1 || keys.length !== 1) {
        return helpers.error("object.unknown");
      }
      current = current[wrappers[0]];
    }
    const { error } = settingsSchema.validate(current);
    if (error)
      return helpers.error("any.custom", { message: error.details[0].message });
    return payload;
  })
  .messages({ "any.custom": "{{#message}}" });

export class NotificationValidation {
  static schemas = {
  notificationId: params({ notificationId: objectId }),
  notificationSettings: body(settingsRequest),
  notificationInbox: queries({
    includeScheduled: Joi.string().valid("true", "false"),
  }),
  };
}
