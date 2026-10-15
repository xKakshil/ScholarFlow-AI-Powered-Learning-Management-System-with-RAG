import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { isAxiosError } from "axios";
import { askTutor, errorMessage } from "@/lib/api";
import type { AiSource, TutorResponse } from "@/lib/types";
import { colors, radius, space, type } from "@/theme";

type Message =
  | { id: string; role: "user"; text: string; scope?: string }
  | { id: string; role: "assistant"; result: TutorResponse }
  | { id: string; role: "error"; text: string; retryOf: string };

const SUGGESTIONS = [
  "Explain the key idea of my latest lesson",
  "Give me 3 practice questions on this topic",
  "Summarise the course notes in simple words",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ChatProps = {
  courseId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  enrolled?: boolean;
  keyboardOffset?: number;
  onClearScope?: () => void;
};

export function TutorChat({
  courseId,
  courseTitle,
  lessonTitle,
  enrolled = true,
  keyboardOffset = 0,
  onClearScope,
}: ChatProps) {
  const [scope, setScope] = useState<{ id: string; title: string } | null>(
    courseId ? { id: courseId, title: courseTitle || "this course" } : null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    setScope(courseId ? { id: courseId, title: courseTitle || "this course" } : null);
  }, [courseId, courseTitle]);

  function clearScope() {
    setScope(null);
    onClearScope?.();
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    const id = String(Date.now());
    setMessages((m) => [
      ...m.filter((x) => !(x.role === "error" && x.retryOf === q)),
      { id, role: "user", text: q, scope: scope?.title },
    ]);
    setInput("");
    setPending(true);
    setStatus("Searching your course notes…");

    const slowTimer = setTimeout(() => setStatus("Still working on your answer…"), 6000);
    try {
      let result: TutorResponse | null = null;
      for (let attempt = 0; attempt < 3 && !result; attempt++) {
        try {
          result = await askTutor(q, scope?.id);
        } catch (e) {
          const rateLimited = isAxiosError(e) && e.response?.status === 429;
          if (!rateLimited || attempt === 2) throw e;
          setStatus(`The tutor is busy. Retrying in ${10 * (attempt + 1)}s…`);
          await sleep(10_000 * (attempt + 1));
        }
      }
      setMessages((m) => [...m, { id: id + "a", role: "assistant", result: result! }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: id + "e",
          role: "error",
          text: errorMessage(e, "The AI tutor is unavailable right now."),
          retryOf: q,
        },
      ]);
    } finally {
      clearTimeout(slowTimer);
      setPending(false);
      setStatus(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? keyboardOffset : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: space(4), gap: space(3), flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Intro onPick={send} lessonTitle={lessonTitle} courseTitle={scope?.title} enrolled={enrolled} />
        }
        renderItem={({ item }) => <Bubble message={item} onRetry={send} scoped={!!scope} />}
        ListFooterComponent={
          pending ? (
            <View style={styles.thinking}>
              <ActivityIndicator color={colors.primary} />
              <Text style={type.small}>{status ?? "Thinking…"}</Text>
            </View>
          ) : null
        }
      />
      {scope && (
        <View style={styles.scopeBar}>
          <Ionicons name="funnel-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.scopeText} numberOfLines={1}>
            Only searching: {scope.title}
          </Text>
          <Pressable onPress={clearScope} hitSlop={10} accessibilityLabel="Search all my courses">
            <Ionicons name="close-circle" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
      )}
      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a doubt from your course…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || pending}
          accessibilityLabel="Send"
          style={[styles.send, (!input.trim() || pending) && { opacity: 0.4 }]}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Intro({
  onPick,
  lessonTitle,
  courseTitle,
  enrolled,
}: {
  onPick: (q: string) => void;
  lessonTitle?: string;
  courseTitle?: string;
  enrolled: boolean;
}) {
  const suggestions = lessonTitle
    ? [
        `Explain "${lessonTitle}" in simple words`,
        `Give me 3 practice questions on "${lessonTitle}"`,
        "What are the key points of this lesson?",
      ]
    : courseTitle
      ? [
          `What will I learn in ${courseTitle}?`,
          "Summarise the main ideas of this course",
          "Give me 3 practice questions",
        ]
      : SUGGESTIONS;
  return (
    <View style={{ flex: 1, justifyContent: "center", gap: space(3), paddingVertical: space(6) }}>
      <View style={styles.introIcon}>
        <Ionicons name="sparkles" size={28} color={colors.primary} />
      </View>
      <Text style={[type.h2, { textAlign: "center" }]}>
        {lessonTitle ? "Stuck on this lesson?" : "Your AI study buddy"}
      </Text>
      <Text style={[type.small, { textAlign: "center", marginBottom: space(3) }]}>
        {!enrolled
          ? "Enroll in this course to get answers from its notes. Until then I'll answer from general knowledge."
          : "I search your instructors' notes and PDFs first, tell you what they say, then explain it in my own words."}
      </Text>
      {suggestions.map((s) => (
        <Pressable key={s} onPress={() => onPick(s)} style={styles.suggestion}>
          <Text style={[type.body, { flex: 1 }]}>{s}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

function Bubble({
  message,
  onRetry,
  scoped,
}: {
  message: Message;
  onRetry: (q: string) => void;
  scoped: boolean;
}) {
  if (message.role === "user") {
    return (
      <View style={[styles.bubble, styles.user]}>
        <Text style={[type.body, { color: "#fff" }]}>{message.text}</Text>
        {message.scope ? <Text style={styles.userScope}>in {message.scope}</Text> : null}
      </View>
    );
  }
  if (message.role === "error") {
    return (
      <View style={[styles.bubble, styles.error]}>
        <Text style={[type.body, { color: colors.danger }]}>{message.text}</Text>
        <Pressable onPress={() => onRetry(message.retryOf)} style={{ marginTop: space(2) }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  return <AnswerCard result={message.result} scoped={scoped} />;
}

function AnswerCard({ result, scoped }: { result: TutorResponse; scoped: boolean }) {
  const [showSources, setShowSources] = useState(false);

  if (result.explanation === undefined) {
    return (
      <View style={[styles.bubble, styles.assistant]}>
        <Text style={type.body} selectable>
          {result.answer.trim()}
        </Text>
      </View>
    );
  }

  const sources = result.sources ?? [];
  const cited = sources.filter((s) => s.cited);
  const shown = cited.length ? cited : sources;

  return (
    <View style={[styles.bubble, styles.assistant, { gap: space(3), maxWidth: "94%" }]}>
      <View style={[styles.section, styles.notesSection]}>
        <View style={styles.sectionHead}>
          <Ionicons name="book" size={15} color={colors.primaryDark} />
          <Text style={[styles.sectionTitle, { color: colors.primaryDark }]}>Your notes say</Text>
        </View>
        {result.fromNotes ? (
          <Text style={type.body} selectable>
            {result.fromNotes}
          </Text>
        ) : (
          <Text style={[type.small, { fontStyle: "italic" }]}>
            {result.retrieval === "none"
              ? scoped
                ? "Enroll in this course to get answers from its notes."
                : "You're not enrolled in any course yet, so there are no notes to search."
              : "Your course notes don't cover this directly."}
          </Text>
        )}
        {shown.length > 0 && (
          <View style={styles.citeRow}>
            {shown.slice(0, 3).map((s) => (
              <View key={s.id} style={styles.citeChip}>
                <Text style={styles.citeChipText} numberOfLines={1}>
                  [{s.n}] {s.lessonTitle}
                  {s.source === "pdf" ? " · PDF" : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Ionicons name="sparkles" size={15} color={colors.text} />
          <Text style={styles.sectionTitle}>AI explanation</Text>
        </View>
        <Text style={type.body} selectable>
          {result.explanation}
        </Text>
        {result.usedOutsideKnowledge && (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
            <Text style={styles.noticeText}>Includes knowledge beyond your course notes.</Text>
          </View>
        )}
      </View>

      {sources.length > 0 && (
        <View>
          <Pressable onPress={() => setShowSources((v) => !v)} style={styles.sourcesToggle}>
            <Ionicons name="bookmarks-outline" size={14} color={colors.muted} />
            <Text style={type.small}>
              {showSources ? "Hide" : "Show"} {sources.length} matched{" "}
              {sources.length === 1 ? "excerpt" : "excerpts"}
            </Text>
            <Ionicons name={showSources ? "chevron-up" : "chevron-down"} size={14} color={colors.muted} />
          </Pressable>
          {showSources && sources.map((s) => <SourceItem key={s.id} source={s} />)}
        </View>
      )}
    </View>
  );
}

function SourceItem({ source }: { source: AiSource }) {
  return (
    <View style={styles.sourceItem}>
      <Text style={styles.sourceMeta} numberOfLines={2}>
        [{source.n}] {source.courseTitle} › {source.lessonTitle}
        {source.source === "pdf" ? " (PDF)" : ""}
        {typeof source.score === "number" ? ` · ${Math.round(source.score * 100)}% match` : ""}
      </Text>
      <Text style={type.small} numberOfLines={6} selectable>
        {source.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "88%", borderRadius: radius.lg, padding: space(3.5) },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  userScope: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  error: { alignSelf: "flex-start", backgroundColor: colors.dangerSoft },
  section: { gap: space(1.5) },
  notesSection: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: space(3) },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.text,
  },
  citeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  citeChip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  citeChipText: { fontSize: 12, fontWeight: "600", color: colors.primaryDark },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  noticeText: { fontSize: 12, color: colors.warning, flex: 1 },
  sourcesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: space(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceItem: {
    marginTop: space(2.5),
    gap: 4,
    paddingLeft: space(2.5),
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  sourceMeta: { fontSize: 12, fontWeight: "700", color: colors.text },
  thinking: { flexDirection: "row", alignItems: "center", gap: space(2), padding: space(2) },
  scopeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingHorizontal: space(4),
    paddingVertical: space(2),
    backgroundColor: colors.primarySoft,
  },
  scopeText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.primaryDark },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space(2),
    padding: space(3),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(3),
    fontSize: 16,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  introIcon: {
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space(3.5),
  },
});

export function TutorScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{ courseId?: string; courseTitle?: string }>();
  return (
    <TutorChat
      courseId={params.courseId}
      courseTitle={params.courseTitle}
      keyboardOffset={tabBarHeight + 44}
      onClearScope={() => router.setParams({ courseId: undefined, courseTitle: undefined })}
    />
  );
}
