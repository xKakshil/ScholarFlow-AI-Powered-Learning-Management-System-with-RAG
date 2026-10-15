import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/components/CourseCard";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getInstructorAnalytics } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getInstructorAnalytics);
  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const top = [...data.courses].sort((a, b) => b.students - a.students);

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View>
        <Text style={type.small}>Welcome back</Text>
        <Text style={type.h2} numberOfLines={1}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.grid}>
        <Stat icon="albums-outline" label="Courses" value={String(data.totalCourses)} />
        <Stat icon="people-outline" label="Enrollments" value={String(data.totalStudents)} />
        <Stat icon="wallet-outline" label="Revenue" value={formatPrice(data.revenue).replace("Free", "₹0")} />
        <Stat icon="trending-up-outline" label="Avg. progress" value={`${data.avgProgress}%`} />
      </View>

      <Button title="Create a new course" icon="add" onPress={() => router.push("/manage/new-course")} />

      <Text style={[type.h3, { marginTop: space(2) }]}>Your courses</Text>
      {top.length === 0 ? (
        <Card>
          <EmptyState
            icon="albums-outline"
            title="No courses yet"
            subtitle="Create your first course, then add lessons with videos, notes and PDFs."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {top.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: "/manage/[id]", params: { id: c.id } })}
              style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={type.h3} numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={type.small}>
                  {c.lessons} {c.lessons === 1 ? "lesson" : "lessons"} · {c.students}{" "}
                  {c.students === 1 ? "student" : "students"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space(3) },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: 2,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space(2),
  },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.text },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4) },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
});
