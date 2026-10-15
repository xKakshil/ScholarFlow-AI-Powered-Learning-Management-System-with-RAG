import { Tabs } from "expo-router/js-tabs";
import { tabIcon, tabScreenOptions } from "@/components/tabs";

export const unstable_settings = { initialRouteName: "dashboard" };

export default function InstructorTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarIcon: tabIcon("grid-outline", "grid") }}
      />
      <Tabs.Screen
        name="courses"
        options={{ title: "My Courses", tabBarIcon: tabIcon("albums-outline", "albums") }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: "Students", tabBarIcon: tabIcon("people-outline", "people") }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: "Analytics", tabBarIcon: tabIcon("bar-chart-outline", "bar-chart") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: tabIcon("person-circle-outline", "person-circle") }}
      />
    </Tabs>
  );
}
