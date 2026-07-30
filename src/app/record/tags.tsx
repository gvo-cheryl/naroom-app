import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  attachEntryTag,
  confirmEntryTag,
  createMyTag,
  getAiReflectionStatus,
  getEntryTags,
  getSystemTags,
  rejectEntryTag,
} from "@/api";
import { ApiError } from "@/api/errors";
import type {
  AiJobStatus,
  EntryTagSummary,
  TagCategory,
  TagSummary,
} from "@/api/types";
import { getValidAccessToken } from "@/auth/authManager";
import { RecordScreenHeader } from "@/components/record-screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { TAG_CATEGORY_LABELS } from "@/constants/record";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { logger } from "@/lib/logger";

const CATEGORY_ORDER: TagCategory[] = [
  "EMOTION",
  "SITUATION",
  "NEED",
  "VALUE",
  "ACTION",
  "RECOVERY",
  "CUSTOM",
];

const AI_POLL_INTERVAL_MS = 2000;
const AI_POLL_MAX_ATTEMPTS = 15;
const AI_TERMINAL_STATUSES: AiJobStatus[] = [
  "COMPLETED",
  "BLOCKED",
  "SAFETY_SUPPORT",
  "FAILED",
];

function groupByCategory<T>(
  items: T[],
  categoryOf: (item: T) => TagCategory,
): Map<TagCategory, T[]> {
  const map = new Map<TagCategory, T[]>();
  for (const item of items) {
    const category = categoryOf(item);
    const list = map.get(category) ?? [];
    list.push(item);
    map.set(category, list);
  }
  return map;
}

// 프로토타입 R05(키워드 확인)에 대응한다. 작성한 글에서 AI가 추출한 키워드 후보(SUGGESTED)를
// 먼저 보여주고 확인/제외하게 한 뒤, 그 외에 직접 고르거나 입력한 키워드를 추가하는 구조다.
// AI 정리 문장·질문(R03)과 내 생각 추가(R04)는 아직 이 화면에 없다 — 다음 단계에서 다룬다.
export default function RecordTagsScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [attached, setAttached] = useState<EntryTagSummary[]>([]);
  const [systemTags, setSystemTags] = useState<TagSummary[]>([]);
  const [aiStatus, setAiStatus] = useState<AiJobStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollAttempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          router.replace("/(auth)/login");
          return;
        }
        const [entryTags, tags, status] = await Promise.all([
          getEntryTags(accessToken, entryId),
          getSystemTags(accessToken),
          getAiReflectionStatus(accessToken, entryId),
        ]);
        if (!cancelled) {
          setAttached(entryTags.filter((t) => t.state !== "REJECTED"));
          setSystemTags(tags);
          setAiStatus(status);
        }
      } catch (error) {
        logger.error("record.tags", "failed to load tags", {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setErrorMessage("키워드를 불러오지 못했어요.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  // AI가 아직 처리 중이면 키워드 후보가 늦게 도착하므로, 끝날 때까지 잠시 이 화면에서 폴링한다.
  // 기다리지 않고 나가도(아래 "확인했어요") 기록은 이미 저장·발행된 뒤라 안전하다.
  useEffect(() => {
    if (loading || !aiStatus || AI_TERMINAL_STATUSES.includes(aiStatus)) {
      return;
    }
    if (pollAttempts.current >= AI_POLL_MAX_ATTEMPTS) {
      setPollTimedOut(true);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      pollAttempts.current += 1;
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken || cancelled) {
          return;
        }
        const status = await getAiReflectionStatus(accessToken, entryId);
        if (cancelled) {
          return;
        }
        setAiStatus(status);
        if (status && AI_TERMINAL_STATUSES.includes(status)) {
          const entryTags = await getEntryTags(accessToken, entryId);
          if (!cancelled) {
            setAttached(entryTags.filter((t) => t.state !== "REJECTED"));
          }
        }
      } catch (error) {
        logger.error("record.tags", "failed to poll ai reflection status", {
          code: error instanceof ApiError ? error.code : undefined,
        });
      }
    }, AI_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loading, aiStatus, entryId]);

  const attachedTagIds = new Set(attached.map((t) => t.tag.id));
  const suggested = attached.filter((t) => t.state === "SUGGESTED");
  const confirmed = attached.filter((t) => t.state !== "SUGGESTED");
  const aiWaiting =
    aiStatus !== null && !AI_TERMINAL_STATUSES.includes(aiStatus);

  const handleConfirmSuggestion = async (entryTag: EntryTagSummary) => {
    setAttached((prev) =>
      prev.map((t) =>
        t.id === entryTag.id ? { ...t, state: "CONFIRMED" } : t,
      ),
    );
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await confirmEntryTag(accessToken, entryId, entryTag.id);
      }
    } catch (error) {
      logger.error("record.tags", "failed to confirm suggested tag", {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleQuickAdd = async (tag: TagSummary) => {
    if (attachedTagIds.has(tag.id)) {
      return;
    }
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace("/(auth)/login");
        return;
      }
      const entryTag = await attachEntryTag(accessToken, entryId, tag.id);
      setAttached((prev) => [...prev, entryTag]);
    } catch (error) {
      logger.error("record.tags", "failed to attach tag", {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleRemove = async (entryTag: EntryTagSummary) => {
    setAttached((prev) => prev.filter((t) => t.id !== entryTag.id));
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken) {
        await rejectEntryTag(accessToken, entryId, entryTag.id);
      }
    } catch (error) {
      logger.error("record.tags", "failed to reject tag", {
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  };

  const handleAddCustomTag = async () => {
    const name = newTagName.trim();
    if (!name || addingTag) {
      return;
    }
    setAddingTag(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace("/(auth)/login");
        return;
      }
      const tag = await createMyTag(accessToken, { category: "CUSTOM", name });
      const entryTag = await attachEntryTag(accessToken, entryId, tag.id);
      setAttached((prev) => [...prev, entryTag]);
      setNewTagName("");
    } catch (error) {
      logger.error("record.tags", "failed to add custom tag", {
        code: error instanceof ApiError ? error.code : undefined,
      });
    } finally {
      setAddingTag(false);
    }
  };

  const confirmedByCategory = groupByCategory(confirmed, (t) => t.tag.category);
  const systemTagsByCategory = groupByCategory(systemTags, (t) => t.category);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="키워드 확인" />
          <ThemedText
            type="default"
            themeColor="textSecondary"
            style={styles.lead}
          >
            키워드는 나를 분류하는 라벨이 아니라, 이 기록에 무엇이 담겼는지
            나중에 찾기 위한 표시예요.
          </ThemedText>

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              color={theme.textSecondary}
            />
          ) : (
            <>
              {(aiWaiting || suggested.length > 0) && (
                <View style={styles.section}>
                  <ThemedText type="small" themeColor="textTertiary">
                    나로움이 찾은 키워드
                  </ThemedText>
                  {suggested.length === 0 && !pollTimedOut ? (
                    <View style={styles.aiWaitingRow}>
                      <ActivityIndicator
                        size="small"
                        color={theme.textTertiary}
                      />
                      <ThemedText type="small" themeColor="textTertiary">
                        기록에서 키워드를 찾는 중이에요…
                      </ThemedText>
                    </View>
                  ) : suggested.length === 0 && pollTimedOut ? (
                    <ThemedText type="small" themeColor="textTertiary">
                      아직 정리를 받아오지 못했어요. 나중에 이 기록에서 다시
                      확인할 수 있어요.
                    </ThemedText>
                  ) : (
                    <View style={styles.chips}>
                      {suggested.map((entryTag) => (
                        <View
                          key={entryTag.id}
                          style={[
                            styles.suggestedChip,
                            { borderColor: theme.textSecondary },
                          ]}
                        >
                          <Pressable
                            onPress={() => handleConfirmSuggestion(entryTag)}
                          >
                            <ThemedText type="small" style={styles.chipFont}>
                              {entryTag.tag.name}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemove(entryTag)}
                            hitSlop={8}
                            style={styles.suggestedRemove}
                          >
                            <ThemedText
                              type="small"
                              themeColor="textTertiary"
                              style={styles.chipFont}
                            >
                              ×
                            </ThemedText>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                  {suggested.length > 0 && (
                    <ThemedText type="small" themeColor="textTertiary">
                      태그를 눌러 확인하거나, ×로 제외할 수 있어요.
                    </ThemedText>
                  )}
                </View>
              )}

              {CATEGORY_ORDER.filter(
                (category) =>
                  (confirmedByCategory.get(category) ?? []).length > 0,
              ).map((category) => (
                <View key={category} style={styles.section}>
                  <ThemedText
                    type="small"
                    themeColor="textTertiary"
                    style={styles.chipFont}
                  >
                    {TAG_CATEGORY_LABELS[category]}
                  </ThemedText>
                  <View style={styles.chips}>
                    {(confirmedByCategory.get(category) ?? []).map(
                      (entryTag) => (
                        <Pressable
                          key={entryTag.id}
                          onPress={() => handleRemove(entryTag)}
                          style={[
                            styles.chip,
                            styles.chipOn,
                            { borderColor: theme.text },
                          ]}
                        >
                          <ThemedText type="small" style={styles.chipFont}>
                            {entryTag.tag.name} ×
                          </ThemedText>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              ))}

              <ThemedText type="default" style={styles.addHeading}>
                키워드 추가
              </ThemedText>
              <View style={styles.row}>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="직접 입력"
                  placeholderTextColor={theme.textTertiary}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable
                  onPress={handleAddCustomTag}
                  disabled={addingTag || newTagName.trim().length === 0}
                  style={[styles.addButton, { borderColor: theme.border }]}
                >
                  <ThemedText type="smallBold">추가</ThemedText>
                </Pressable>
              </View>

              {CATEGORY_ORDER.filter(
                (category) =>
                  (systemTagsByCategory.get(category) ?? []).length > 0,
              ).map((category) => (
                <View key={category} style={styles.section}>
                  <ThemedText
                    type="small"
                    themeColor="textTertiary"
                    style={styles.chipFont}
                  >
                    {TAG_CATEGORY_LABELS[category]}
                  </ThemedText>
                  <View style={styles.chips}>
                    {(systemTagsByCategory.get(category) ?? []).map((tag) => (
                      <Pressable
                        key={tag.id}
                        onPress={() => handleQuickAdd(tag)}
                        disabled={attachedTagIds.has(tag.id)}
                        style={[
                          styles.chip,
                          { borderColor: theme.border },
                          attachedTagIds.has(tag.id) && styles.chipDisabled,
                        ]}
                      >
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={styles.chipFont}
                        >
                          + {tag.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}

              {errorMessage && (
                <ThemedText
                  type="small"
                  themeColor="textTertiary"
                  style={styles.error}
                >
                  {errorMessage}
                </ThemedText>
              )}

              <AppButton
                title="확인했어요"
                style={styles.confirmButton}
                onPress={() =>
                  router.replace({
                    pathname: "/record/complete",
                    params: { entryId },
                  })
                }
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  lead: {
    marginTop: Spacing.one,
  },
  loading: {
    marginTop: Spacing.five,
  },
  section: {
    marginTop: Spacing.two,
    gap: Spacing.half + 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.half + 1,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.one + 2,
  },
  chipOn: {
    borderWidth: 1.5,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipFont: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half + 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.full,
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.one + 2,
  },
  suggestedRemove: {
    paddingHorizontal: Spacing.half,
  },
  aiWaitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  addHeading: {
    marginTop: Spacing.four,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  addButton: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    marginTop: Spacing.two,
    textAlign: "center",
  },
  confirmButton: {
    marginTop: Spacing.five,
  },
});
