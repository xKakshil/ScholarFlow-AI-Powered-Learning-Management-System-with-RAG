import { Pressable } from "react-native";
import { router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import { tabIcon, tabScreenOptions } from "@/components/tabs";
import { colors } from "@/theme";

export const unstable_settings = { initialRouteName: "overview" };

function ProfileButton() {
  return (
    <Pressable
      onPress={() => router.push("/admin/profile")}
      hitSlop={10}
      accessibilityLabel="Profile"
      style={{ marginRight: 16 }}
    >
      <Ionicons name="person-circle-outline" size={28} color={colors.text} />
    </Pressable>
  );
}

export default function AdminTabsLayout() {
  return (
    <Tabs screenOptions={{ ...tabScreenOptions, headerRight: ProfileButton }}>
      <Tabs.Screen
        name="overview"
        options={{ title: "Overview", tabBarIcon: tabIcon("stats-chart-outline", "stats-chart") }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: "Analytics", tabBarIcon: tabIcon("bar-chart-outline", "bar-chart") }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: "Users", tabBarIcon: tabIcon("people-outline", "people") }}
      />
      <Tabs.Screen
        name="courses"
        options={{ title: "Courses", tabBarIcon: tabIcon("albums-outline", "albums") }}
      />
      <Tabs.Screen
        name="enrollments"
        options={{ title: "Enrollments", tabBarIcon: tabIcon("receipt-outline", "receipt") }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile", href: null, headerRight: () => null }} />
    </Tabs>
  );
}
