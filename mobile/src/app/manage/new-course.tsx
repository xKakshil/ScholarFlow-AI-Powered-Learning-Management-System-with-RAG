import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { FormScreen } from "@/components/FormScreen";
import { Button, Input } from "@/components/ui";
import { createCourse, errorMessage } from "@/lib/api";
import { colors, radius, space } from "@/theme";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function NewCourse() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [thumbnail, setThumbnail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Give the course a title (at least 3 characters).";
    if (description.trim().length < 10) e.description = "Add a short description (at least 10 characters).";
    const priceNum = price.trim() === "" ? 0 : Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0)
      e.price = "Enter a whole number in rupees, or leave empty for free.";
    if (thumbnail.trim() && !/^https?:\/\//i.test(thumbnail.trim()))
      e.thumbnail = "Must be an http(s) image URL.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setFormError(null);
    try {
      const course = await createCourse({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category: category.trim(),
        level,
        thumbnail: thumbnail.trim() || undefined,
      });
      router.replace({ pathname: "/manage/[id]", params: { id: course.id } });
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't create the course."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen>
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Data Structures in Python"
        error={errors.title}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What will learners get out of this course?"
        multiline
        style={{ minHeight: 110, paddingTop: 12, textAlignVertical: "top" }}
        error={errors.description}
      />
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Price (₹)"
            value={price}
            onChangeText={setPrice}
            placeholder="0 = free"
            keyboardType="number-pad"
            error={errors.price}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Programming"
          />
        </View>
      </View>
      <View style={{ gap: space(1.5) }}>
        <Text style={styles.label}>Level</Text>
        <View style={{ flexDirection: "row", gap: space(2) }}>
          {LEVELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              style={[styles.chip, level === l && styles.chipActive]}
            >
              <Text style={[styles.chipText, level === l && { color: colors.primary }]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Input
        label="Thumbnail image URL (optional)"
        value={thumbnail}
        onChangeText={setThumbnail}
        placeholder="https://…"
        autoCapitalize="none"
        keyboardType="url"
        error={errors.thumbnail}
      />
      {formError && <Text style={{ color: colors.danger }}>{formError}</Text>}
      <Button title="Create course" onPress={onSave} loading={saving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space(3),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.muted },
});
