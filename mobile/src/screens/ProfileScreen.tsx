import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { WEB_URL } from "@/lib/config";
import { colors, space, type } from "@/theme";

const roleLabel = { LEARNER: "Learner", INSTRUCTOR: "Instructor", ADMIN: "Admin" } as const;

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const confirmSignOut = () => {
    if (Platform.OS === "web") return void signOut();
    Alert.alert("Log out?", "You'll need to log in again to access your courses.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), gap: space(4) }}>
      <Card style={{ alignItems: "center", gap: space(2), paddingVertical: space(6) }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.email.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={type.h3}>{user.email}</Text>
        <View style={{ alignItems: "center" }}>
          <Badge label={roleLabel[user.role]} tone="primary" />
        </View>
      </Card>

      {user.role === "ADMIN" && (
        <Card style={{ gap: space(3) }}>
          <View style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
            <Ionicons name="desktop-outline" size={20} color={colors.primary} />
            <Text style={type.h3}>Admin dashboard</Text>
          </View>
          <Text style={type.small}>The same admin views are also available on the web dashboard.</Text>
          <Button
            title="Open web dashboard"
            variant="secondary"
            icon="open-outline"
            onPress={() => WebBrowser.openBrowserAsync(WEB_URL)}
          />
        </Card>
      )}

      <Button title="Log out" variant="danger" icon="log-out-outline" onPress={confirmSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
});
