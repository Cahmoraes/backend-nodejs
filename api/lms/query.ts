import type { StatementResultingChanges } from "node:sqlite"
import { Query } from "../../core/utils/abstract.ts"

export interface CourseData {
  id: number
  slug: string
  title: string
  description: string
  lessons: number
  hours: number
  created: string
}

type CourseCreate = Omit<CourseData, "id" | "created">

export interface LessonData {
  id: number
  course_id: number
  slug: string
  title: string
  seconds: number
  video: string
  description: string
  order: number
  free: number
  created: string
}

export type LessonCreate = Omit<LessonData, "id" | "course_id" | "created"> & {
  courseSlug: string
}

export interface LessonsCompletedData {
  lesson_id: number
  completed: string
}

export interface LessonCompletedData {
  completed: string
}

export interface SelectedProgressData {
  id: number
  completed: string
}

export interface CertificateData {
  id: string
}

export interface CertificateFullData {
  id: string
  name: string
  title: string
  hours: number
  lessons: number
  completed: string
}

export class LmsQuery extends Query {
  public insertCourse({
    slug,
    title,
    description,
    lessons,
    hours,
  }: CourseCreate): StatementResultingChanges {
    return this.db
      .query(
        /*sql*/
        `
          INSERT INTO "courses"
          ("slug", "title", "description", "lessons", "hours")
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT ("slug") DO UPDATE SET
          "title" = excluded."title",
          "description" = excluded."description",
          "lessons" = excluded."lessons",
          "hours" = excluded."hours"
        `,
      )
      .run(slug, title, description, lessons, hours)
  }

  public insertLesson({
    courseSlug,
    slug,
    title,
    seconds,
    video,
    description,
    order,
    free,
  }: LessonCreate): StatementResultingChanges {
    return this.db
      .query(
        /*sql*/
        `
          INSERT INTO "lessons"
          ("course_id", "slug", "title", "seconds", 
            "video", "description", "order", "free")
          VALUES ((SELECT "id" FROM "courses" WHERE "slug" = ?), ?, ?, ?, ?, ?, ? , ?)
          ON CONFLICT ("course_id", "slug") DO UPDATE SET
          "title" = excluded."title",
          "description" = excluded."description",
          "seconds" = excluded."seconds",
          "order" = excluded."order",
          "free" = excluded."free",
          "video" = excluded."video",
          "hours" = excluded."hours"
        `,
      )
      .run(courseSlug, slug, title, seconds, video, description, order, free)
  }

  public selectCourses(): CourseData[] {
    return this.db
      .query(
        /*sql*/ `
          SELECT * FROM "courses" 
          ORDER BY "created" ASC LIMIT 100  
        `,
      )
      .all() as unknown as CourseData[]
  }

  public selectAllLessons() {
    return this.db
      .query(
        /*sql*/ `
          SELECT "l".*, "c"."slug" as "courseSlug" FROM "lessons" as "l"
          JOIN "courses" as "c" ON "c"."id" = "l"."course_id"
          ORDER BY "l"."course_id" ASC, "l"."order" ASC LIMIT 200  
        `,
      )
      .all() as unknown as CourseData[]
  }

  public selectCourse(slug: string): CourseData | undefined {
    return this.db
      .query(
        /*sql*/ `
          SELECT * FROM "courses"
          WHERE "slug" = ?
        `,
      )
      .get(slug) as unknown as CourseData
  }

  public selectLessons(courseSlug: string): LessonData[] {
    return this.db
      .query(
        /*sql*/ `
          SELECT * FROM "lessons"
          WHERE course_id = (
            SELECT "id" FROM "courses" WHERE "slug" = ?
          )
          ORDER BY "order" ASC
        `,
      )
      .all(courseSlug) as unknown as LessonData[]
  }

  public selectLesson(
    courseSlug: string,
    lessonSlug: string,
  ): LessonData | undefined {
    return this.db
      .query(
        /*sql*/ `
          SELECT * FROM "lessons" l
          WHERE "course_id" = (
            SELECT "id" FROM "courses" WHERE "slug" = ?
          )
          AND "slug" = ?
        `,
      )
      .get(courseSlug, lessonSlug) as unknown as LessonData
  }

  public selectNavLesson(
    courseSlug: string,
    lessonSlug: string,
  ): { slug: string }[] | undefined {
    return this.db
      .query(
        /*sql*/ `
          SELECT "slug" FROM "lesson_nav" l
          WHERE "course_id" = (
            SELECT "id" FROM "courses" WHERE "slug" = ?
          )
          AND "current_slug" = ?
        `,
      )
      .all(courseSlug, lessonSlug) as unknown as { slug: string }[]
  }

  public insertLessonCompleted(
    userId: number,
    courseId: number,
    lessonId: number,
  ): StatementResultingChanges {
    return this.db
      .query(
        /*sql*/ `
          INSERT OR IGNORE INTO "lessons_completed"
          ("user_id", "course_id", "lesson_id") VALUES
          (?, ?, ?)
        `,
      )
      .run(userId, courseId, lessonId)
  }

  public selectLessonCompleted(
    userId: number,
    lessonId: number,
  ): LessonCompletedData | undefined {
    return this.db
      .query(
        /*sql*/ `
          SELECT 
            "completed" FROM "lessons_completed"
          WHERE
            "user_id" = ? AND "lesson_id" = ?
        `,
      )
      .get(userId, lessonId) as LessonCompletedData | undefined
  }

  public selectLessonsCompleted(
    userId: number,
    courseId: number,
  ): LessonsCompletedData[] {
    return this.db
      .query(
        /*sql*/ `
          SELECT 
            "lesson_id", "completed" FROM "lessons_completed"
          WHERE
            "user_id" = ? AND "course_id" = ?
        `,
      )
      .all(userId, courseId) as unknown as LessonsCompletedData[]
  }

  public deleteLessonsCompleted(
    userId: number,
    courseId: number,
  ): StatementResultingChanges {
    return this.db
      .query(
        /*sql*/ `
          DELETE FROM 
            "lessons_completed"
          WHERE
            "user_id" = ?
          AND
            "course_id" = ?
        `,
      )
      .run(userId, courseId)
  }

  public deleteCertificate(
    userId: number,
    courseId: number,
  ): StatementResultingChanges {
    return this.db
      .query(
        /*sql*/ `
          DELETE FROM 
            "certificates"
          WHERE
            "user_id" = ?
          AND
            "course_id" = ?
        `,
      )
      .run(userId, courseId)
  }

  public selectProgress(
    userId: number,
    courseId: number,
  ): SelectedProgressData[] {
    return this.db
      .query(
        /*sql*/ `
      SELECT "l"."id", "lc"."completed"
      FROM "lessons" as  "l"
      LEFT JOIN "lessons_completed" as "lc"
      ON "l"."id" = "lc"."lesson_id" AND "lc"."user_id" = ?
      WHERE "l"."course_id" = ?
    `,
      )
      .all(userId, courseId) as unknown as SelectedProgressData[]
  }

  public insertCertificate(
    userId: number,
    courseId: number,
  ): CertificateData | undefined {
    return this.db
      .query(
        /*sql*/ `
      INSERT OR IGNORE INTO "certificates"
        ("user_id", "course_id")
      VALUES
        (?, ?)
      RETURNING "id"
    `,
      )
      .get(userId, courseId) as unknown as CertificateData
  }

  public selectCertificates(userId: number): CertificateFullData[] {
    return this.db
      .query(
        /*sql*/ `
        SELECT * FROM 
          "certificates_full"
        WHERE
          "user_id" = ?
      `,
      )
      .all(userId) as unknown as CertificateFullData[]
  }

  public selectCertificate(
    certificateId: string,
  ): CertificateFullData | undefined {
    return this.db
      .query(
        /*sql*/ `
        SELECT * FROM 
          "certificates_full"
        WHERE
          "id" = ?
      `,
      )
      .get(certificateId) as unknown as CertificateFullData
  }
}
