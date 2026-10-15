import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AskAiFab } from "@/components/AskAiFab";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { getCourses } from "@/lib/api";
import { colors, radius, space } from "@/theme";

export default function Explore() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getCourses);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set((data ?? []).map((c) => c.category?.trim()).filter(Boolean) as string[])].sort(),
    [data],
  );

  const courses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (category && c.category?.trim() !== category) return false;
      if (!q) return true;
      return [c.title, c.description, c.category, c.instructor?.name]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [data, query, category]);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: space(24) }]}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ gap: space(3), marginBottom: space(1) }}>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search courses"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
            {categories.length > 0 && (
              <FlatList
                horizontal
                data={[null, ...categories]}
                keyExtractor={(c) => c ?? "all"}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: space(2) }}
                renderItem={({ item }) => {
                  const active = item === category;
                  return (
                    <Pressable
                      onPress={() => setCategory(item)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && { color: "#fff" }]}>{item ?? "All"}</Text>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            enrolled={(item.enrollments?.length ?? 0) > 0}
            onPress={() => router.push({ pathname: "/course/[id]", params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: space(4) }} />}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={data?.length ? "No matching courses" : "No courses yet"}
            subtitle={
              data?.length
                ? "Try a different search or category."
                : "Instructors haven't published any courses."
            }
          />
        }
      />
      <AskAiFab />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space(4), paddingBottom: space(10), gap: 0 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space(2.5) },
  chip: {
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.text },
});
