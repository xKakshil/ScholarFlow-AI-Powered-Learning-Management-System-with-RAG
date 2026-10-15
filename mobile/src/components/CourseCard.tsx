import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "./ui";
import { colors, radius, space, type } from "@/theme";
import type { Course } from "@/lib/types";

export function formatPrice(price: number) {
  return price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Free";
}

export function CourseThumb({ course, height = 150 }: { course: Course; height?: number }) {
  if (course.thumbnail) {
    return <Image source={{ uri: course.thumbnail }} style={[styles.thumb, { height }]} resizeMode="cover" />;
  }
  return (
    <View style={[styles.thumb, styles.thumbFallback, { height }]}>
      <Text style={styles.thumbLetter}>{course.title.trim().charAt(0).toUpperCase() || "S"}</Text>
    </View>
  );
}

export function CourseCard({
  course,
  enrolled,
  onPress,
}: {
  course: Course;
  enrolled?: boolean;
  onPress: () => void;
}) {
  const lessonCount = course.lessons?.length ?? 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
    >
      <CourseThumb course={course} />
      <View style={styles.body}>
        <View style={styles.badges}>
          {course.category ? <Badge label={course.category} tone="primary" /> : null}
          {course.level ? <Badge label={course.level} /> : null}
          {enrolled ? <Badge label="Enrolled" tone="success" /> : null}
        </View>
        <Text style={type.h3} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={type.small} numberOfLines={2}>
          {course.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Ionicons name="play-circle-outline" size={15} color={colors.muted} />
            <Text style={type.small}>
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </Text>
            {course._count ? (
              <>
                <Ionicons name="people-outline" size={15} color={colors.muted} style={{ marginLeft: 8 }} />
                <Text style={type.small}>{course._count.enrollments}</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.price}>{formatPrice(course.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  thumb: { width: "100%", backgroundColor: colors.primarySoft },
  thumbFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  thumbLetter: { fontSize: 48, fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  body: { padding: space(4), gap: space(2) },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: space(1.5) },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space(1),
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  price: { fontSize: 16, fontWeight: "800", color: colors.text },
});
