import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/ui";
import { colors } from "@/theme";

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState />;

  const signedIn = !!user;
  const isInstructor = user?.role === "INSTRUCTOR";
  const isAdmin = user?.role === "ADMIN";
  const isLearner = signedIn && !isInstructor && !isAdmin;
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Protected guard={isLearner}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/[id]" options={{ title: "Course" }} />
        <Stack.Screen name="learn/[id]" options={{ title: "Learn" }} />
        <Stack.Screen name="ask" options={{ presentation: "modal", title: "AI Tutor" }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && isInstructor}>
        <Stack.Screen name="teach" options={{ headerShown: false }} />
        <Stack.Screen name="manage/[id]" options={{ title: "Manage course" }} />
        <Stack.Screen name="manage/new-course" options={{ title: "New course", presentation: "modal" }} />
        <Stack.Screen name="manage/new-lesson" options={{ title: "New lesson", presentation: "modal" }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && isAdmin}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
