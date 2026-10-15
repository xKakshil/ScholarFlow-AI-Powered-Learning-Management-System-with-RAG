import { RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar, formatDate, listStyles, RolePill, rupees, StatTile } from "@/components/admin";
import { Button, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getAdminRevenue, getAdminStats } from "@/lib/api";
import { colors, space, type } from "@/theme";

export default function Overview() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(async () => {
    const [stats, revenue] = await Promise.all([getAdminStats(), getAdminRevenue().catch(() => null)]);
    return { stats, revenue };
  });
  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;
  const { stats, revenue } = data;

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3) }}>
        <StatTile icon="people-outline" label="Users" value={String(stats.totalUsers)} />
        <StatTile icon="school-outline" label="Learners" value={String(stats.students)} />
        <StatTile icon="easel-outline" label="Instructors" value={String(stats.instructors)} />
        <StatTile icon="albums-outline" label="Courses" value={String(stats.courses)} />
        <StatTile icon="receipt-outline" label="Enrollments" value={String(stats.enrollments)} />
        <StatTile icon="wallet-outline" label="Revenue" value={rupees(stats.revenue)} />
      </View>
      {revenue ? (
        <Text style={type.small}>
          {revenue.transactions} payment {revenue.transactions === 1 ? "record" : "records"} · revenue counts
          successful payments only
        </Text>
      ) : null}

      <Section title="Newest users" onSeeAll={() => router.navigate("/admin/users")}>
        {stats.recentUsers.map((u, i) => (
          <View key={u.id} style={[listStyles.row, i > 0 && listStyles.border]}>
            <Avatar label={u.name || u.email} />
            <View style={{ flex: 1 }}>
              <Text style={type.body} numberOfLines={1}>
                {u.name || u.email}
              </Text>
              <Text style={type.small}>{formatDate(u.createdAt)}</Text>
            </View>
            <RolePill role={u.role} />
          </View>
        ))}
      </Section>

      <Section title="Newest courses" onSeeAll={() => router.navigate("/admin/courses")}>
        {stats.recentCourses.map((c, i) => (
          <View key={c.id} style={[listStyles.row, i > 0 && listStyles.border]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.h3} numberOfLines={1}>
                {c.title}
              </Text>
              <Text style={type.small} numberOfLines={1}>
                {c.instructor?.email} · {c._count.lessons} {c._count.lessons === 1 ? "lesson" : "lessons"} ·{" "}
                {c._count.enrollments} enrolled
              </Text>
            </View>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll: () => void;
  children: React.ReactNode;
}) {
  const empty = Array.isArray(children) && children.length === 0;
  return (
    <View style={{ gap: space(2) }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={type.h3}>{title}</Text>
        <Button
          title="See all"
          variant="ghost"
          onPress={onSeeAll}
          style={{ minHeight: 36, paddingHorizontal: 0 }}
        />
      </View>
      <View style={listStyles.group}>
        {empty ? <Text style={[type.small, { padding: space(4) }]}>Nothing here yet.</Text> : children}
      </View>
    </View>
  );
}
