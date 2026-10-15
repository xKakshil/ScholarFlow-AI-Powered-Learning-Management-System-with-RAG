import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { CourseCard } from "@/components/CourseCard";
import { Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getMyCourses } from "@/lib/api";
import { colors, space } from "@/theme";

export default function MyLearning() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getMyCourses);

  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <FlatList
      data={(data ?? []).filter((e) => e.course)}
      keyExtractor={(e) => e.id}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderItem={({ item }) => (
        <CourseCard
          course={item.course}
          onPress={() => router.push({ pathname: "/learn/[id]", params: { id: item.courseId } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: space(4) }} />}
      ListEmptyComponent={
        <EmptyState
          icon="library-outline"
          title="No courses yet"
          subtitle="Courses you enroll in will show up here."
          action={<Button title="Explore courses" variant="secondary" onPress={() => router.navigate("/")} />}
        />
      }
    />
  );
}
