import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthShell } from "@/components/AuthShell";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";
import { colors, radius, space, type } from "@/theme";

type SignupRole = "LEARNER" | "INSTRUCTOR";

export default function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("LEARNER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ name, email, password, role });
    } catch (e) {
      setError(errorMessage(e, "Registration failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join courses and learn with an AI tutor.">
      <Input
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        autoComplete="name"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoComplete="new-password"
      />

      <View style={{ gap: space(1.5) }}>
        <Text style={styles.label}>I want to</Text>
        <View style={styles.roles}>
          <RoleOption
            icon="book-outline"
            label="Learn"
            active={role === "LEARNER"}
            onPress={() => setRole("LEARNER")}
          />
          <RoleOption
            icon="easel-outline"
            label="Teach"
            active={role === "INSTRUCTOR"}
            onPress={() => setRole("INSTRUCTOR")}
          />
        </View>
      </View>

      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      <Button title="Create account" onPress={onSubmit} loading={submitting} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
        <Text style={type.small}>Already have an account?</Text>
        <Link href="/login" replace style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
          Log in
        </Link>
      </View>
    </AuthShell>
  );
}

function RoleOption({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[styles.role, active && styles.roleActive]}
    >
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.muted} />
      <Text style={[styles.roleText, active && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  roles: { flexDirection: "row", gap: space(3) },
  role: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleText: { fontSize: 15, fontWeight: "700", color: colors.muted },
});
