import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { CourseThumb, formatPrice } from "@/components/CourseCard";
import { LessonVideo } from "@/components/LessonVideo";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getInstructorCourses, getLessons } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function ManageCourse() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(async () => {
    const [courses, lessons] = await Promise.all([getInstructorCourses(), getLessons(id)]);
    return { course: courses.find((c) => c.id === id) ?? null, lessons };
  }, id);
  useRefreshOnFocus(refresh);
  const [open, setOpen] = useState<string | null>(null);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.course) return <ErrorState message="Course not found, or it isn't yours." />;

  const { course, lessons } = data;
  const addLesson = () => router.push({ pathname: "/manage/new-lesson", params: { courseId: course.id } });

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: space(12) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <CourseThumb course={course} height={170} />
        <View style={styles.body}>
          <View style={styles.badges}>
            {course.category ? <Badge label={course.category} tone="primary" /> : null}
            {course.level ? <Badge label={course.level} /> : null}
            <Badge label={formatPrice(course.price)} tone="success" />
          </View>
          <Text style={type.h1}>{course.title}</Text>
          <Text style={[type.body, { color: "#3A3E4C" }]}>{course.description}</Text>
          <Text style={type.small}>
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} · {course.enrollments?.length ?? 0}{" "}
            enrolled
          </Text>

          <View style={styles.sectionHead}>
            <Text style={type.h2}>Lessons</Text>
            {lessons.length > 0 && <Button title="Add" icon="add" variant="ghost" onPress={addLesson} />}
          </View>

          {lessons.length === 0 ? (
            <View style={styles.list}>
              <EmptyState
                icon="videocam-outline"
                title="No lessons yet"
                subtitle="Add a video, PDF or notes. Learners see lessons in the order you add them."
                action={<Button title="Add first lesson" icon="add" onPress={addLesson} />}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {lessons.map((l, i) => {
                const expanded = open === l.id;
                return (
                  <View key={l.id} style={i > 0 && styles.border}>
                    <Pressable onPress={() => setOpen(expanded ? null : l.id)} style={styles.row}>
                      <Text style={styles.index}>{i + 1}</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={type.h3} numberOfLines={2}>
                          {l.title}
                        </Text>
                        <View style={{ flexDirection: "row", gap: space(3) }}>
                          <Has icon="videocam-outline" on={!!l.videoUrl} label="Video" />
                          <Has icon="document-outline" on={!!l.pdfUrl} label="PDF" />
                          <Has icon="reader-outline" on={!!l.notes} label="Notes" />
                        </View>
                      </View>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.muted}
                      />
                    </Pressable>
                    {expanded && (
                      <View style={styles.preview}>
                        {l.videoUrl ? <LessonVideo url={l.videoUrl} width={width - space(10) - 2} /> : null}
                        {l.pdfUrl ? (
                          <Button
                            title="Open PDF"
                            icon="document-attach-outline"
                            variant="secondary"
                            onPress={() => WebBrowser.openBrowserAsync(l.pdfUrl!)}
                          />
                        ) : null}
                        {l.notes ? <Text style={type.body}>{l.notes}</Text> : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function Has({ icon, on, label }: { icon: keyof typeof Ionicons.glyphMap; on: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, opacity: on ? 1 : 0.35 }}>
      <Ionicons name={icon} size={14} color={on ? colors.primary : colors.muted} />
      <Text style={[type.small, on && { color: colors.primaryDark }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space(5), gap: space(3) },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: space(1.5) },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space(2),
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4) },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  index: { width: 22, fontSize: 14, fontWeight: "800", color: colors.muted },
  preview: { paddingHorizontal: space(4), paddingBottom: space(4), gap: space(3) },
});
