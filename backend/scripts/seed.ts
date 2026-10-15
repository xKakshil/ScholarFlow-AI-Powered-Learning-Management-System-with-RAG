/**
 * Sample data for local development. Only @scholarflow.dev accounts and their
 * courses are replaced on each run.
 *
 *   npm run db:seed
 *   npm run db:seed -- --no-index
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { indexLesson } from "../src/lib/rag/ingest";
import { COURSES, INSTRUCTORS, LEARNERS, SEED_DOMAIN, SEED_PASSWORD } from "./seed-data";

let state = 42;
const rand = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY - Math.floor(rand() * 8) * 3_600_000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const slug = (name: string) => name.toLowerCase().split(" ")[0];

async function clearSeedData() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${SEED_DOMAIN}` } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return 0;

  const courseIds = (
    await prisma.course.findMany({ where: { instructorId: { in: userIds } }, select: { id: true } })
  ).map((c) => c.id);
  const ofSeed = { OR: [{ userId: { in: userIds } }, { courseId: { in: courseIds } }] };

  await prisma.$transaction([
    prisma.payment.deleteMany({ where: ofSeed }),
    prisma.progress.deleteMany({ where: ofSeed }),
    prisma.enrollment.deleteMany({ where: ofSeed }),
    prisma.quiz.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma.lesson.deleteMany({ where: { courseId: { in: courseIds } } }), // chunks cascade
    prisma.course.deleteMany({ where: { id: { in: courseIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
  return userIds.length;
}

async function main() {
  const skipIndex = process.argv.includes("--no-index");
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      return "(DATABASE_URL not set)";
    }
  })();
  console.log(`Seeding ${host}\n`);

  const removed = await clearSeedData();
  if (removed) console.log(`Removed previous sample data (${removed} sample users).`);

  const password = await bcrypt.hash(SEED_PASSWORD, 10);

  await prisma.user.create({
    data: { name: "Admin", email: `admin@${SEED_DOMAIN}`, password, role: "ADMIN", createdAt: daysAgo(200) },
  });
  const instructorIds: Record<string, string> = {};
  for (const [key, info] of Object.entries(INSTRUCTORS)) {
    const u = await prisma.user.create({
      data: {
        ...info,
        password,
        role: "INSTRUCTOR",
        createdAt: daysAgo(195 - Object.keys(instructorIds).length * 40),
      },
    });
    instructorIds[key] = u.id;
  }
  const learners = [];
  for (const [i, name] of LEARNERS.entries()) {
    const joined = i === 0 ? 170 : Math.max(3, Math.round(175 - (i / LEARNERS.length) * 170 + rand() * 12));
    learners.push(
      await prisma.user.create({
        data: {
          name,
          email: `${slug(name)}@${SEED_DOMAIN}`,
          password,
          role: "LEARNER",
          createdAt: daysAgo(joined),
        },
      }),
    );
  }
  console.log(
    `Users: 1 admin, ${Object.keys(instructorIds).length} instructors, ${learners.length} learners`,
  );

  const courses: { key: string; id: string; price: number; created: Date; lessonIds: string[] }[] = [];
  for (const c of COURSES) {
    const created = daysAgo(c.monthsAgo * 30);
    const course = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        price: c.price,
        category: c.category,
        level: c.level,
        instructorId: instructorIds[c.instructor],
        createdAt: created,
      },
    });
    const lessonIds: string[] = [];
    for (const [i, l] of c.lessons.entries()) {
      const lesson = await prisma.lesson.create({
        data: {
          title: l.title,
          notes: l.notes,
          videoUrl: l.videoUrl ?? "",
          pdfUrl: "",
          courseId: course.id,
          createdAt: new Date(created.getTime() + i * DAY),
        },
      });
      lessonIds.push(lesson.id);
    }
    courses.push({ key: c.key, id: course.id, price: c.price, created, lessonIds });
  }
  console.log(
    `Courses: ${courses.length} with ${courses.reduce((s, c) => s + c.lessonIds.length, 0)} lessons`,
  );

  let enrollments = 0,
    payments = 0;
  const enroll = async (userId: string, joined: Date, course: (typeof courses)[number], progress: number) => {
    const earliest = Math.max(joined.getTime(), course.created.getTime());
    const at = new Date(earliest + rand() * (Date.now() - earliest) * 0.9);
    await prisma.enrollment.create({ data: { userId, courseId: course.id, createdAt: at } });
    enrollments++;
    if (course.price > 0) {
      if (rand() < 0.15) {
        await prisma.payment.create({
          data: {
            userId,
            courseId: course.id,
            amount: course.price,
            status: "FAILED",
            createdAt: new Date(at.getTime() - 600_000),
          },
        });
        payments++;
      }
      await prisma.payment.create({
        data: { userId, courseId: course.id, amount: course.price, status: "SUCCESS", createdAt: at },
      });
      payments++;
    }
    await prisma.progress.create({
      data: { userId, courseId: course.id, percentage: progress, completed: progress === 100 },
    });
  };

  const byKey = Object.fromEntries(courses.map((c) => [c.key, c]));
  // The demo learner is left out of SQL and ML so enrolling can be tested.
  const demo = learners[0];
  await enroll(demo.id, demo.createdAt, byKey.js, 50);
  await enroll(demo.id, demo.createdAt, byKey.dsa, 25);

  for (const learner of learners.slice(1)) {
    const count = 1 + Math.floor(rand() * 3);
    const chosen = new Set<string>();
    while (chosen.size < count) chosen.add(pick(courses).key);
    for (const key of chosen) {
      await enroll(learner.id, learner.createdAt, byKey[key], pick([0, 10, 25, 40, 60, 75, 90, 100]));
    }
  }
  console.log(`Enrollments: ${enrollments} · payments: ${payments} · progress rows: ${enrollments}`);

  if (skipIndex) {
    console.log("\nSkipped embedding (--no-index). Run `npm run rag:reindex` later.");
  } else if (!process.env.GEMINI_API_KEY) {
    console.log("\nGEMINI_API_KEY not set: skipped embedding. Set it and run `npm run rag:reindex`.");
  } else {
    console.log("\nEmbedding lesson notes for the AI Tutor…");
    let ok = 0;
    for (const c of courses) {
      for (const id of c.lessonIds) {
        const r = await indexLesson(id);
        if (r.embedded) ok++;
        else console.log(`  ⚠ ${r.warnings.join("; ")}`);
        await sleep(300);
      }
    }
    console.log(`Indexed ${ok}/${courses.reduce((s, c) => s + c.lessonIds.length, 0)} lessons.`);
  }

  console.log(`
Done. Log in with password ${SEED_PASSWORD}:
  Admin       admin@${SEED_DOMAIN}
  Instructor  riya@${SEED_DOMAIN}     (JavaScript, Data Structures)
  Instructor  karan@${SEED_DOMAIN}    (SQL, Machine Learning)
  Learner     demo@${SEED_DOMAIN}     (enrolled: JavaScript, Data Structures)
  Learners    aarav@, priya@, rohan@ … @${SEED_DOMAIN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
