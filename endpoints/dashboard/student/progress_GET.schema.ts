import { z } from "zod";
import superjson from "superjson";
import { ReadingLevel } from "../../../helpers/schema";
import { Selectable } from "kysely";
import { Users, ReadingSessions } from "../../../helpers/schema";

export const schema = z.object({
  studentId: z.number().int().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type InputType = z.infer<typeof schema>;

type StudentInfo = Pick<Selectable<Users>, "id" | "displayName" | "avatarUrl">;

type SessionData = Pick<
  Selectable<ReadingSessions>,
  | "id"
  | "sessionStart"
  | "sessionEnd"
  | "durationSeconds"
  | "wordsClicked"
  | "completed"
> & {
  materialTitle: string;
  readingLevel: ReadingLevel;
};

type WordClickStat = {
  word: string;
  clickCount: number | null;
};

export type OutputType = {
  student: StudentInfo;
  readingSessions: SessionData[];
  wordClickStats: WordClickStat[];
};

export const getStudentProgress = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const query = new URLSearchParams({
    studentId: String(params.studentId),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  });

  const result = await fetch(
    `/_api/dashboard/student/progress?${query.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};