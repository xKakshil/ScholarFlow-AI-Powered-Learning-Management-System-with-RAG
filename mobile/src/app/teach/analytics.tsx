import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { rupees, StatTile } from "@/components/admin";
import { BarList, ChartCard, ColumnChart, monthlyCounts } from "@/components/charts";
import { formatPrice } from "@/components/CourseCard";
import { ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getInstructorAnalytics, getInstructorCourses, getInstructorStudents } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function InstructorAnalytics() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(async () => {
    const [analytics, courses, students] = await Promise.all([
      getInstructorAnalytics(),
      getInstructorCourses(),
      getInstructorStudents(),
    ]);
    return { analytics, courses, students };
  });
  useRefreshOnFocus(refresh);
  const [open, setOpen] = useState<string | null>(null);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;
  const { analytics, courses, students } = data;

  const price = new Map(courses.map((c) => [c.id, c.price]));
  const perCourse = analytics.courses.map((c) => ({ ...c, price: price.get(c.id) ?? 0 }));
  const listValue = perCourse.reduce((s, c) => s + c.price * c.students, 0);
  const enrollDates = students.flatMap((c) => c.enrollments.map((e) => e.createdAt));
  const enrollValues = students.flatMap((c) => c.enrollments.map(() => c.price));

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Revenue</Text>
        <Text style={styles.heroValue}>{rupees(analytics.revenue)}</Text>
        <Text style={styles.heroSub}>From completed payments across your courses</Text>
        <View style={styles.heroDivider} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.heroSub}>List-price value of enrollments</Text>
          <Text style={styles.heroSmallValue}>{rupees(listValue)}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatTile icon="people-outline" label="Enrollments" value={String(analytics.totalStudents)} />
        <StatTile icon="trending-up-outline" label="Avg. progress" value={`${analytics.avgProgress}%`} />
        <StatTile icon="albums-outline" label="Courses" value={String(analytics.totalCourses)} />
      </View>

      <ChartCard title="Enrollments per month" subtitle="Last 6 months · tap a column for its value">
        <ColumnChart data={monthlyCounts(enrollDates)} unit="enrollments" />
      </ChartCard>

      <ChartCard title="Enrollment value per month" subtitle="Course list price × new enrollments">
        <ColumnChart data={monthlyCounts(enrollDates, 6, enrollValues)} format={rupees} />
      </ChartCard>

      <ChartCard title="Students by course">
        <BarList
          items={perCourse.map((c) => ({ id: c.id, label: c.title, value: c.students }))}
          emptyText="No enrollments yet."
        />
      </ChartCard>

      <ChartCard title="List-price value by course" subtitle="Price × students">
        <BarList
          items={perCourse
            .filter((c) => c.price > 0)
            .map((c) => ({
              id: c.id,
              label: c.title,
              value: c.price * c.students,
              sub: `${formatPrice(c.price)} × ${c.students}`,
            }))}
          format={rupees}
          emptyText="All your courses are free, or no paid enrollments yet."
        />
      </ChartCard>

      <Text style={[type.h3, { marginTop: space(1) }]}>Course breakdown</Text>
      <View style={styles.list}>
        {perCourse.length === 0 ? (
          <Text style={[type.small, { padding: space(4) }]}>No courses yet.</Text>
        ) : (
          perCourse.map((c, i) => {
            const expanded = open === c.id;
            return (
              <View key={c.id} style={i > 0 && styles.border}>
                <Pressable onPress={() => setOpen(expanded ? null : c.id)} style={styles.row}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={type.h3} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={type.small}>
                      {c.lessons} {c.lessons === 1 ? "lesson" : "lessons"} · {c.students}{" "}
                      {c.students === 1 ? "student" : "students"} · {formatPrice(c.price)}
                    </Text>
                  </View>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
                </Pressable>
                {expanded && (
                  <View style={styles.learners}>
                    {c.learners.length === 0 ? (
                      <Text style={type.small}>No learners yet.</Text>
                    ) : (
                      c.learners.map((l) => (
                        <Text key={l.email} style={type.small} numberOfLines={1}>
                          • {l.name || "Student"} · {l.email}
                        </Text>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space(5), gap: 4 },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroValue: { color: "#fff", fontSize: 34, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  heroSmallValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: space(2) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space(3) },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4) },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  learners: { paddingHorizontal: space(4), paddingBottom: space(4), gap: 4 },
});
