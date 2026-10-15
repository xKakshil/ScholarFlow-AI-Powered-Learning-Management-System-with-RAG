import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, space } from "@/theme";

type Props = {
  courseId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  enrolled?: boolean;
  bottom?: number;
};

export function AskAiFab({ courseId, courseTitle, lessonTitle, enrolled = true, bottom = space(5) }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ask the AI tutor"
      onPress={() =>
        router.push({
          pathname: "/ask",
          params: {
            ...(courseId ? { courseId } : {}),
            ...(courseTitle ? { courseTitle } : {}),
            ...(lessonTitle ? { lessonTitle } : {}),
            enrolled: enrolled ? "1" : "0",
          },
        })
      }
      style={({ pressed }) => [styles.fab, { bottom }, pressed && { transform: [{ scale: 0.96 }] }]}
    >
      <Ionicons name="sparkles" size={18} color="#fff" />
      <Text style={styles.label}>Ask AI</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: space(4),
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingHorizontal: space(4.5),
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  label: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
