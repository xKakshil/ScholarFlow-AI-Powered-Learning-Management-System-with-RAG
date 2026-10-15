import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { rupees, StatTile } from "@/components/admin";
import { BarList, ChartCard, ColumnChart, monthlyCounts } from "@/components/charts";
import { formatPrice } from "@/components/CourseCard";
import { ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import {
  getAdminCourses,
  getAdminEnrollments,
  getAdminRevenue,
  getAdminStats,
  getAdminUsers,
} from "@/lib/api";
import { colors, radius, space } from "@/theme";

export default function AdminAnalytics() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(async () => {
    const [stats, revenue, enrollments, users, courses] = await Promise.all([
      getAdminStats(),
      getAdminRevenue().catch(() => null),
      getAdminEnrollments(),
      getAdminUsers(),
      getAdminCourses(),
    ]);
    return { stats, revenue, enrollments, users, courses };
  });
  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;
  const { stats, revenue, enrollments, users, courses } = data;

  const listValue = enrollments.reduce((s, e) => s + (e.course?.price ?? 0), 0);
  const paidEnrollments = enrollments.filter((e) => (e.course?.price ?? 0) > 0).length;
  const avgPrice = courses.length ? Math.round(courses.reduce((s, c) => s + c.price, 0) / courses.length) : 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Platform revenue</Text>
        <Text style={styles.heroValue}>{rupees(stats.revenue)}</Text>
        <Text style={styles.heroSub}>Completed (successful) payments</Text>
        <View style={styles.heroDivider} />
        {revenue && (
          <Row label={`All payment records (${revenue.transactions})`} value={rupees(revenue.revenue)} />
        )}
        <Row label="List-price value of all enrollments" value={rupees(listValue)} />
      </View>

      <View style={styles.grid}>
        <StatTile icon="receipt-outline" label="Enrollments" value={String(stats.enrollments)} />
        <StatTile icon="pricetag-outline" label="Paid-course enrollments" value={String(paidEnrollments)} />
        <StatTile icon="cash-outline" label="Avg. course price" value={rupees(avgPrice)} />
      </View>

      <ChartCard title="Enrollments per month" subtitle="Last 6 months · tap a column for its value">
        <ColumnChart data={monthlyCounts(enrollments.map((e) => e.createdAt))} unit="enrollments" />
      </ChartCard>

      <ChartCard title="Enrollment value per month" subtitle="Course list price of each new enrollment">
        <ColumnChart
          data={monthlyCounts(
            enrollments.map((e) => e.createdAt),
            6,
            enrollments.map((e) => e.course?.price ?? 0),
          )}
          format={rupees}
        />
      </ChartCard>

      <ChartCard title="New users per month" subtitle="Sign-ups, all roles">
        <ColumnChart data={monthlyCounts(users.map((u) => u.createdAt))} unit="sign-ups" />
      </ChartCard>

      <ChartCard title="Users by role">
        <BarList
          items={[
            { id: "LEARNER", label: "Learners", value: users.filter((u) => u.role === "LEARNER").length },
            {
              id: "INSTRUCTOR",
              label: "Instructors",
              value: users.filter((u) => u.role === "INSTRUCTOR").length,
            },
            { id: "ADMIN", label: "Admins", value: users.filter((u) => u.role === "ADMIN").length },
          ]}
        />
      </ChartCard>

      <ChartCard title="Top courses by enrollments">
        <BarList
          items={courses.map((c) => ({
            id: c.id,
            label: c.title,
            value: c.enrollments.length,
            sub: `by ${c.instructor?.name || c.instructor?.email}`,
          }))}
          max={6}
          emptyText="No enrollments yet."
        />
      </ChartCard>

      <ChartCard title="Top courses by list-price value" subtitle="Price × enrollments">
        <BarList
          items={courses
            .filter((c) => c.price > 0)
            .map((c) => ({
              id: c.id,
              label: c.title,
              value: c.price * c.enrollments.length,
              sub: `${formatPrice(c.price)} × ${c.enrollments.length}`,
            }))}
          format={rupees}
          max={6}
          emptyText="No paid-course enrollments yet."
        />
      </ChartCard>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}
    >
      <Text style={styles.heroSub}>{label}</Text>
      <Text style={styles.heroSmallValue}>{value}</Text>
    </View>
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
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, flexShrink: 1 },
  heroSmallValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: space(2) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space(3) },
});
