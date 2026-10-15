import { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AskAiFab } from "@/components/AskAiFab";
import { CourseThumb, formatPrice } from "@/components/CourseCard";
import { Badge, Button, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { enroll, errorMessage, getCourses } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, error, loading, slow, reload } = useAsync(
    async () => (await getCourses()).find((c) => c.id === id) ?? null,
    id,
  );
  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState(false);

  if (loading) return <LoadingState slow={slow} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="This course is no longer available." />;

  const course = data;
  const enrolled = justEnrolled || (course.enrollments?.length ?? 0) > 0;
  const lessons = course.lessons ?? [];
  const openLearn = () => router.push({ pathname: "/learn/[id]", params: { id: course.id } });

  function confirmCheckout(): Promise<boolean> {
    const message = `${course.title}\n\nAmount: ${formatPrice(course.price)}\n\nTest mode: no real payment will be taken.`;
    if (Platform.OS === "web") return Promise.resolve(globalThis.confirm?.(message) ?? true);
    return new Promise((resolve) =>
      Alert.alert("Confirm purchase", message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: `Pay ${formatPrice(course.price)}`, onPress: () => resolve(true) },
      ]),
    );
  }

  async function onEnroll() {
    if (course.price > 0 && !(await confirmCheckout())) return;
    setEnrolling(true);
    try {
      await enroll(course.id);
      setJustEnrolled(true);
      openLearn();
    } catch (e) {
      const msg = errorMessage(e, "Couldn't enroll. Please try again.");
      if (msg === "Already enrolled") {
        setJustEnrolled(true);
        openLearn();
      } else Alert.alert("Enrollment failed", msg);
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 190 + insets.bottom }}>
        <CourseThumb course={course} height={210} />
        <View style={styles.body}>
          <View style={styles.badges}>
            {course.category ? <Badge label={course.category} tone="primary" /> : null}
            {course.level ? <Badge label={course.level} /> : null}
            {enrolled ? <Badge label="Enrolled" tone="success" /> : null}
          </View>
          <Text style={type.h1}>{course.title}</Text>
          {course.instructor && (
            <View style={styles.instructor}>
              <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
              <Text style={type.small}>{course.instructor.name || course.instructor.email}</Text>
            </View>
          )}

          <View style={styles.stats}>
            <Stat icon="play-circle-outline" value={String(lessons.length)} label="Lessons" />
            <Stat icon="people-outline" value={String(course._count?.enrollments ?? 0)} label="Learners" />
            <Stat icon="pricetag-outline" value={formatPrice(course.price)} label="Price" />
          </View>

          <Text style={type.h2}>About this course</Text>
          <Text style={[type.body, { color: "#3A3E4C" }]}>{course.description}</Text>

          <Text style={[type.h2, { marginTop: space(2) }]}>Curriculum</Text>
          {lessons.length === 0 ? (
            <Text style={type.small}>No lessons published yet.</Text>
          ) : (
            <View style={styles.curriculum}>
              {lessons.map((l, i) => (
                <View key={l.id} style={[styles.lessonRow, i > 0 && styles.lessonBorder]}>
                  <Text style={styles.lessonIndex}>{i + 1}</Text>
                  <Text style={[type.body, { flex: 1 }]} numberOfLines={2}>
                    {l.title}
                  </Text>
                  <Ionicons
                    name={enrolled ? "play-circle" : "lock-closed-outline"}
                    size={20}
                    color={enrolled ? colors.primary : colors.muted}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: space(4) + insets.bottom }]}>
        {enrolled ? (
          <Button title="Continue learning" icon="play" onPress={openLearn} />
        ) : (
          <Button
            title={course.price > 0 ? `Buy course · ${formatPrice(course.price)}` : "Enroll for free"}
            onPress={onEnroll}
            loading={enrolling}
          />
        )}
      </View>
      <AskAiFab
        courseId={course.id}
        courseTitle={course.title}
        enrolled={enrolled}
        bottom={space(4) + insets.bottom + 66}
      />
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space(5), gap: space(3) },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: space(1.5) },
  instructor: { flexDirection: "row", alignItems: "center", gap: space(1.5) },
  stats: { flexDirection: "row", gap: space(3), marginVertical: space(2) },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space(3),
    gap: 2,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 4 },
  curriculum: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4) },
  lessonBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  lessonIndex: { width: 22, fontSize: 14, fontWeight: "800", color: colors.muted },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: space(4),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
