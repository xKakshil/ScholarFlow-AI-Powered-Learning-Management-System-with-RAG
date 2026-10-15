import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

const BAR = colors.primary;
const TRACK = "#EEF0F6";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={type.h3}>{title}</Text>
      {subtitle ? <Text style={[type.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      <View style={{ marginTop: space(4) }}>{children}</View>
    </View>
  );
}

export type BarItem = { id: string; label: string; value: number; sub?: string };

export function BarList({
  items,
  format = (n) => n.toLocaleString("en-IN"),
  max = 8,
  emptyText = "No data yet.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  max?: number;
  emptyText?: string;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, max);
  const rest = sorted.slice(max);
  if (rest.length) {
    shown.push({
      id: "__other",
      label: `Other (${rest.length})`,
      value: rest.reduce((s, i) => s + i.value, 0),
    });
  }
  const top = Math.max(1, ...shown.map((i) => i.value));
  if (shown.length === 0 || shown.every((i) => i.value === 0))
    return <Text style={type.small}>{emptyText}</Text>;

  return (
    <View style={{ gap: space(3) }}>
      {shown.map((item) => (
        <View
          key={item.id}
          accessible
          accessibilityLabel={`${item.label}: ${format(item.value)}`}
          style={{ gap: 6 }}
        >
          <View style={styles.barHead}>
            <Text style={[type.body, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.barValue}>{format(item.value)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / top) * 100)}%` },
              ]}
            />
          </View>
          {item.sub ? <Text style={[type.small, { fontSize: 12 }]}>{item.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export type ColumnDatum = { key: string; label: string; value: number };

export function ColumnChart({
  data,
  format = (n) => n.toLocaleString("en-IN"),
  height = 140,
  unit = "",
}: {
  data: ColumnDatum[];
  format?: (n: number) => string;
  height?: number;
  unit?: string;
}) {
  const [selected, setSelected] = useState(data.length - 1);
  const top = Math.max(1, ...data.map((d) => d.value));
  const active = data[selected];
  if (data.every((d) => d.value === 0))
    return <Text style={type.small}>No activity in this period yet.</Text>;

  return (
    <View>
      <View style={styles.readout}>
        <Text style={styles.readoutValue}>
          {active ? format(active.value) : ""}
          {unit ? <Text style={type.small}> {unit}</Text> : null}
        </Text>
        <Text style={type.small}>{active?.label}</Text>
      </View>
      <View style={[styles.plot, { height }]}>
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(4, (d.value / top) * height) : 0;
          const isActive = i === selected;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelected(i)}
              accessibilityLabel={`${d.label}: ${format(d.value)} ${unit}`}
              style={styles.colHit}
            >
              <View style={[styles.col, { height: h, backgroundColor: BAR, opacity: isActive ? 1 : 0.55 }]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.baseline} />
      <View style={styles.xLabels}>
        {data.map((d, i) => (
          <Text
            key={d.key}
            style={[styles.xLabel, i === selected && { color: colors.text, fontWeight: "700" }]}
            numberOfLines={1}
          >
            {d.label.split(" ")[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function monthlyCounts(dates: string[], n = 6, weights?: number[]): ColumnDatum[] {
  const now = new Date();
  const buckets: ColumnDatum[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      value: 0,
    });
  }
  dates.forEach((iso, idx) => {
    const d = new Date(iso);
    const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.value += weights ? weights[idx] : 1;
  });
  return buckets;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },
  barHead: { flexDirection: "row", alignItems: "baseline", gap: space(2) },
  barValue: { fontSize: 14, fontWeight: "800", color: colors.text },
  track: { height: 10, borderRadius: 5, backgroundColor: TRACK, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: BAR },
  readout: { flexDirection: "row", alignItems: "baseline", gap: space(2), marginBottom: space(3) },
  readoutValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  plot: { flexDirection: "row", alignItems: "flex-end" },
  colHit: { flex: 1, height: "100%", justifyContent: "flex-end", paddingHorizontal: 5 },
  col: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: 1, backgroundColor: colors.border },
  xLabels: { flexDirection: "row", marginTop: 6 },
  xLabel: { flex: 1, textAlign: "center", fontSize: 11, color: colors.muted },
});
