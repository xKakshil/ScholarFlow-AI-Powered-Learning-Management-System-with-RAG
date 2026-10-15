import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { CourseCard } from "@/components/CourseCard";
import { Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getInstructorCourses } from "@/lib/api";
import { colors, space } from "@/theme";

export default function InstructorCourses() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getInstructorCourses);
  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        data && data.length > 0 ? (
          <Button
            title="New course"
            icon="add"
            variant="secondary"
            onPress={() => router.push("/manage/new-course")}
            style={{ marginBottom: space(4) }}
          />
        ) : null
      }
      renderItem={({ item }) => (
        <CourseCard
          course={{ ...item, _count: { enrollments: item.enrollments?.length ?? 0 }, enrollments: [] }}
          onPress={() => router.push({ pathname: "/manage/[id]", params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: space(4) }} />}
      ListEmptyComponent={
        <EmptyState
          icon="albums-outline"
          title="You haven't created a course yet"
          subtitle="Courses you publish appear here and in the learner catalogue."
          action={
            <Button title="Create course" icon="add" onPress={() => router.push("/manage/new-course")} />
          }
        />
      }
    />
  );
}
