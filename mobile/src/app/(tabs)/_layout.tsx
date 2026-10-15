import { Tabs } from "expo-router/js-tabs";
import { tabIcon, tabScreenOptions } from "@/components/tabs";

export default function LearnerTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{ title: "Explore", tabBarIcon: tabIcon("compass-outline", "compass") }}
      />
      <Tabs.Screen
        name="learning"
        options={{ title: "My Learning", tabBarIcon: tabIcon("library-outline", "library") }}
      />
      <Tabs.Screen
        name="tutor"
        options={{ title: "AI Tutor", tabBarIcon: tabIcon("sparkles-outline", "sparkles") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: tabIcon("person-circle-outline", "person-circle") }}
      />
    </Tabs>
  );
}
