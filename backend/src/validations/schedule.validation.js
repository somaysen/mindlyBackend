import Joi from "joi";
import { queries } from "./common.validation.js";

export class ScheduleValidation {
  static schemas = {
  scheduleToday: queries({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  };
}
