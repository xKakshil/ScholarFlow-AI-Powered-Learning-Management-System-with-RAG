import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Avatar, formatDate, RolePill, SearchBox } from "@/components/admin";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getAdminUsers } from "@/lib/api";
import type { Role } from "@/lib/types";
import { colors, radius, space, type } from "@/theme";

const FILTERS: { key: Role | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "LEARNER", label: "Learners" },
  { key: "INSTRUCTOR", label: "Instructors" },
  { key: "ADMIN", label: "Admins" },
];

export default function Users() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getAdminUsers);
  useRefreshOnFocus(refresh);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "ALL">("ALL");

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        (role === "ALL" || u.role === role) &&
        (!q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)),
    );
  }, [data, query, role]);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const counts = (k: Role | "ALL") =>
    k === "ALL" ? (data?.length ?? 0) : (data ?? []).filter((u) => u.role === k).length;

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={{ gap: space(3), marginBottom: space(3) }}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="Search by name or email" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
            {FILTERS.map((f) => {
              const active = f.key === role;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setRole(f.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && { color: "#fff" }]}>
                    {f.label} {counts(f.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[styles.row, index === 0 && styles.first, index === users.length - 1 && styles.last]}>
          <Avatar label={item.name || item.email} />
          <View style={{ flex: 1 }}>
            <Text style={type.body} numberOfLines={1}>
              {item.name || "—"}
            </Text>
            <Text style={type.small} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={[type.small, { fontSize: 12 }]}>Joined {formatDate(item.createdAt)}</Text>
          </View>
          <RolePill role={item.role} />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState icon="people-outline" title="No users match" subtitle="Try another search or filter." />
      }
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.text },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    padding: space(3.5),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
  },
  first: { borderTopWidth: 1, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
});
