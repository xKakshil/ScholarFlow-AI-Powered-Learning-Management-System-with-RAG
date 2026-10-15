import { RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { getInstructorStudents } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

export default function Students() {
  const { data, error, loading, refreshing, slow, reload, refresh } = useAsync(getInstructorStudents);
  useRefreshOnFocus(refresh);

  if (loading && !data) return <LoadingState slow={slow} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const sections = (data ?? [])
    .filter((c) => c.enrollments.length > 0)
    .map((c) => ({ title: c.title, count: c.enrollments.length, data: c.enrollments }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.header}>
          <Text style={[type.h3, { flex: 1 }]} numberOfLines={1}>
            {section.title}
          </Text>
          <Text style={type.small}>{section.count}</Text>
        </View>
      )}
      renderItem={({ item, index }) => {
        const label = item.user.name || item.user.email;
        return (
          <View style={[styles.row, index === 0 && styles.first]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.body} numberOfLines={1}>
                {label}
              </Text>
              {item.user.name ? (
                <Text style={type.small} numberOfLines={1}>
                  {item.user.email}
                </Text>
              ) : null}
            </View>
            <Text style={type.small}>
              {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          title="No students yet"
          subtitle="Learners who enroll in your courses show up here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    marginTop: space(4),
    marginBottom: space(2),
  },
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
  first: { borderTopWidth: 1, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: colors.primaryDark },
});
