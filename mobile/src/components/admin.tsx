import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, space, type } from "@/theme";
import type { Role } from "@/lib/types";

export const roleTone: Record<Role, { bg: string; fg: string; label: string }> = {
  ADMIN: { bg: "#FDECEA", fg: "#B3261E", label: "Admin" },
  INSTRUCTOR: { bg: colors.primarySoft, fg: colors.primaryDark, label: "Instructor" },
  LEARNER: { bg: "#E6F6EE", fg: "#0F7B45", label: "Learner" },
};

export function RolePill({ role }: { role: Role }) {
  const t = roleTone[role] ?? roleTone.LEARNER;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

export function Avatar({ label }: { label: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{(label.trim().charAt(0) || "?").toUpperCase()}</Text>
    </View>
  );
}

export function SearchBox({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export function StatTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const listStyles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(3.5) },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
});

const styles = StyleSheet.create({
  pill: { paddingHorizontal: space(2.5), paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "800" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: colors.primaryDark },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space(2.5) },
  stat: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(3.5),
    gap: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space(1.5),
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
});
