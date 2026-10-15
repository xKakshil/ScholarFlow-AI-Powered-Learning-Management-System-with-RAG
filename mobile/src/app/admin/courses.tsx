import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchBox } from "@/components/admin";
import { formatPrice } from "@/components/CourseCard";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getAdminCourses } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function AdminCourses() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getAdminCourses);
  useRefreshOnFocus(refresh);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const courses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        !q ||
        [c.title, c.category, c.instructor?.email, c.instructor?.name].some((s) =>
          (s ?? "").toLowerCase().includes(q),
        ),
    );
  }, [data, query]);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <FlatList
      data={courses}
      keyExtractor={(c) => c.id}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1, gap: space(3) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <SearchBox value={query} onChangeText={setQuery} placeholder="Search title, category or instructor" />
      }
      renderItem={({ item }) => {
        const expanded = open === item.id;
        return (
          <Pressable onPress={() => setOpen(expanded ? null : item.id)} style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space(3) }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={type.h3}>{item.title}</Text>
                <Text style={type.small} numberOfLines={1}>
                  by {item.instructor?.name || item.instructor?.email}
                </Text>
              </View>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.meta}>
              {item.category ? <Badge label={item.category} tone="primary" /> : null}
              {item.level ? <Badge label={item.level} /> : null}
              <Text style={type.small}>
                {item.lessons.length} {item.lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                {item.enrollments.length} enrolled
              </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.muted}
                style={{ marginLeft: "auto" }}
              />
            </View>
            {expanded && (
              <View style={styles.details}>
                <Text style={type.body}>{item.description}</Text>
                <Text style={[type.small, { fontWeight: "700", marginTop: space(2) }]}>Lessons</Text>
                {item.lessons.length === 0 ? (
                  <Text style={type.small}>No lessons yet.</Text>
                ) : (
                  item.lessons.map((l, i) => (
                    <View key={l.id} style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
                      <Ionicons
                        name={l.videoUrl ? "play-circle-outline" : "document-text-outline"}
                        size={16}
                        color={colors.muted}
                      />
                      <Text style={type.small} numberOfLines={1}>
                        {i + 1}. {l.title}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Pressable>
        );
      }}
      ListEmptyComponent={<EmptyState icon="albums-outline" title="No courses found" />}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(2.5),
  },
  price: { fontSize: 15, fontWeight: "800", color: colors.text },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space(2) },
  details: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3), gap: space(1.5) },
});
