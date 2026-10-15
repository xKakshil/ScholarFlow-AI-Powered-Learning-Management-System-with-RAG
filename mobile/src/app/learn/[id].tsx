import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { AskAiFab } from "@/components/AskAiFab";
import { LessonVideo } from "@/components/LessonVideo";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { getLearnCourse } from "@/lib/api";
import type { Lesson } from "@/lib/types";
import { colors, radius, space, type } from "@/theme";

export default function Learn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { data: course, error, loading, slow, reload } = useAsync(() => getLearnCourse(id), id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (loading) return <LoadingState slow={slow} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!course) return null;

  const lessons = course.lessons ?? [];
  const lesson = lessons.find((l) => l.id === selectedId) ?? lessons[0] ?? null;
  const setLesson = (l: Lesson) => setSelectedId(l.id);
  const index = lesson ? lessons.findIndex((l) => l.id === lesson.id) : -1;
  const next = index >= 0 ? lessons[index + 1] : undefined;
  const prev = index > 0 ? lessons[index - 1] : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: course.title }} />
      {lessons.length === 0 || !lesson ? (
        <EmptyState
          icon="videocam-outline"
          title="No lessons yet"
          subtitle="The instructor hasn't added lessons."
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: space(28) }}>
          {lesson.videoUrl ? (
            <LessonVideo key={lesson.id} url={lesson.videoUrl} width={width} />
          ) : (
            <View style={[styles.noVideo, { height: (width * 9) / 16 }]}>
              <Ionicons name="document-text-outline" size={36} color={colors.primary} />
              <Text style={type.small}>This lesson has no video</Text>
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.counter}>
              Lesson {index + 1} of {lessons.length}
            </Text>
            <Text style={type.h2}>{lesson.title}</Text>

            {lesson.pdfUrl ? (
              <Button
                title="Open lesson PDF"
                icon="document-attach-outline"
                variant="secondary"
                onPress={() => WebBrowser.openBrowserAsync(lesson.pdfUrl!)}
              />
            ) : null}

            {lesson.notes ? (
              <Card>
                <Text style={[type.h3, { marginBottom: space(2) }]}>Notes</Text>
                <Text style={type.body} selectable>
                  {lesson.notes}
                </Text>
              </Card>
            ) : null}

            <View style={styles.navRow}>
              <Button
                title="Previous"
                icon="chevron-back"
                variant="secondary"
                disabled={!prev}
                onPress={() => prev && setLesson(prev)}
                style={{ flex: 1 }}
              />
              <Button
                title="Next"
                icon="chevron-forward"
                disabled={!next}
                onPress={() => next && setLesson(next)}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={[type.h3, { marginTop: space(3) }]}>All lessons</Text>
            <View style={styles.list}>
              {lessons.map((l, i) => {
                const active = l.id === lesson.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setLesson(l)}
                    style={[
                      styles.lessonRow,
                      i > 0 && styles.border,
                      active && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Ionicons
                      name={
                        active ? "play-circle" : l.videoUrl ? "play-circle-outline" : "document-text-outline"
                      }
                      size={22}
                      color={active ? colors.primary : colors.muted}
                    />
                    <Text
                      style={[
                        type.body,
                        { flex: 1 },
                        active && { color: colors.primaryDark, fontWeight: "700" },
                      ]}
                      numberOfLines={2}
                    >
                      {i + 1}. {l.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
      <AskAiFab courseId={course.id} courseTitle={course.title} lessonTitle={lesson?.title} />
    </View>
  );
}

const styles = StyleSheet.create({
  noVideo: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
  },
  body: { padding: space(5), gap: space(3) },
  counter: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  navRow: { flexDirection: "row", gap: space(3) },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4) },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
});
