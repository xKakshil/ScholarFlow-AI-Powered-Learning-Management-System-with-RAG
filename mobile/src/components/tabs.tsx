import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;
type IconProps = { color: ColorValue; focused: boolean; size: number };

export function tabIcon(name: IconName, activeName: IconName) {
  function TabIcon({ color, focused, size }: IconProps) {
    return <Ionicons name={focused ? activeName : name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export const tabScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: "800" as const, fontSize: 20 },
  sceneStyle: { backgroundColor: colors.bg },
};
