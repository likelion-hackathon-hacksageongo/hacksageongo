import { z } from "zod";
import {
  SURVEY_ID,
  SURVEY_QUESTION_IDS,
} from "../constants/survey.constant.js";

const questionIdSchema = z.enum(SURVEY_QUESTION_IDS);

export const submitSurveyResponsesSchema = z.object({
  surveyId: z.string().default(SURVEY_ID),
  answers: z.array(
    z.object({
      questionId: questionIdSchema,
      value: z.number().int().min(1).max(5),
    }),
  ),
});
