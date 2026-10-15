import { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FormScreen } from "@/components/FormScreen";
import { Button, Input } from "@/components/ui";
import { createLesson, errorMessage } from "@/lib/api";
import { colors, type } from "@/theme";

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

export default function NewLesson() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const e: Record<string, string> = {};
    if (title.trim().length < 2) e.title = "Give the lesson a title.";
    if (videoUrl.trim() && !isUrl(videoUrl.trim())) e.videoUrl = "Must be a valid http(s) link.";
    if (pdfUrl.trim() && !isUrl(pdfUrl.trim())) e.pdfUrl = "Must be a valid http(s) link.";
    if (!videoUrl.trim() && !pdfUrl.trim() && !notes.trim())
      e.notes = "Add at least a video, a PDF or some notes.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setFormError(null);
    try {
      await createLesson({
        courseId,
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        pdfUrl: pdfUrl.trim(),
        notes: notes.trim(),
      });
      router.back();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't add the lesson."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen>
      <Input
        label="Lesson title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Introduction to recursion"
        error={errors.title}
      />
      <Input
        label="Video URL"
        value={videoUrl}
        onChangeText={setVideoUrl}
        placeholder="YouTube, Vimeo or .mp4 link"
        autoCapitalize="none"
        keyboardType="url"
        error={errors.videoUrl}
      />
      <Input
        label="PDF URL"
        value={pdfUrl}
        onChangeText={setPdfUrl}
        placeholder="Link to slides or handout"
        autoCapitalize="none"
        keyboardType="url"
        error={errors.pdfUrl}
      />
      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Key points of the lesson"
        multiline
        style={{ minHeight: 160, paddingTop: 12, textAlignVertical: "top" }}
        error={errors.notes}
      />
      <Text style={type.small}>
        Notes and the PDF are indexed for the AI Tutor, which quotes them when answering learners.
      </Text>
      {formError && <Text style={{ color: colors.danger }}>{formError}</Text>}
      <Button title="Add lesson" onPress={onSave} loading={saving} />
    </FormScreen>
  );
}
