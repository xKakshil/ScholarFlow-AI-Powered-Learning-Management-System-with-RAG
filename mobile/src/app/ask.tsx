import { Pressable } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TutorChat } from "@/screens/TutorScreen";
import { colors } from "@/theme";

export default function AskSheet() {
  const { courseId, courseTitle, lessonTitle, enrolled } = useLocalSearchParams<{
    courseId?: string;
    courseTitle?: string;
    lessonTitle?: string;
    enrolled?: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "AI Tutor",
          headerLeft: () => null,
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close AI tutor">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <TutorChat
        courseId={courseId}
        courseTitle={courseTitle}
        lessonTitle={lessonTitle}
        enrolled={enrolled !== "0"}
        keyboardOffset={60}
        onClearScope={() =>
          router.setParams({ courseId: undefined, courseTitle: undefined, lessonTitle: undefined })
        }
      />
    </>
  );
}
