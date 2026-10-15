import { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Avatar, formatDate, SearchBox } from "@/components/admin";
import { formatPrice } from "@/components/CourseCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getAdminEnrollments } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function Enrollments() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getAdminEnrollments);
  useRefreshOnFocus(refresh);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (e) =>
        !q || [e.user?.email, e.user?.name, e.course?.title].some((s) => (s ?? "").toLowerCase().includes(q)),
    );
  }, [data, query]);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(e) => e.id}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={{ gap: space(2), marginBottom: space(3) }}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="Search learner or course" />
          <Text style={type.small}>{rows.length} enrollments</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const who = item.user?.name || item.user?.email || "Unknown user";
        return (
          <View style={[styles.row, index === 0 && styles.first, index === rows.length - 1 && styles.last]}>
            <Avatar label={who} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={type.body} numberOfLines={1}>
                {who}
              </Text>
              <Text style={[type.small, { color: colors.primaryDark }]} numberOfLines={1}>
                {item.course?.title}
              </Text>
              <Text style={[type.small, { fontSize: 12 }]}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.price}>{item.course ? formatPrice(item.course.price) : ""}</Text>
          </View>
        );
      }}
      ListEmptyComponent={<EmptyState icon="receipt-outline" title="No enrollments yet" />}
    />
  );
}

const styles = StyleSheet.create({
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
  price: { fontSize: 14, fontWeight: "800", color: colors.text },
});
