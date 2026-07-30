import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEmotionTagTopics, getTodayCheckIn, upsertCheckIn } from '@/api';
import { ApiError } from '@/api/errors';
import type { EmotionTagTopicSummary, TagSummary } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { getValidAccessToken } from '@/auth/authManager';
import { LevelBar } from '@/components/level-bar';
import { LevelSlider } from '@/components/level-slider';
import { NeedSummary } from '@/components/need-summary';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { CHECKIN_NEEDS, ENERGY_LABELS, INTENSITY_LABELS, levelLabelIndex } from '@/constants/checkin';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logger } from '@/lib/logger';

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 프로토타입 C01(체크인)·C08(체크인 완료)에 대응한다. 모두 선택 입력이라 아무 값도 없이
// 저장해도 체크인은 완료된다. 감정은 프로토타입처럼 자유 텍스트가 아니라 실제 시스템
// EMOTION 태그(emotion_tag_topics로 묶임)를 고르는 방식으로 대응한다.
export default function CheckInScreen() {
  const { state } = useAuth();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<EmotionTagTopicSummary[]>([]);
  const [activeTopic, setActiveTopic] = useState(0);
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [memorableEvent, setMemorableEvent] = useState('');
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [currentNeed, setCurrentNeed] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const topicScrollRef = useRef<ScrollView>(null);
  const topicOffsets = useRef<number[]>([]);
  const [topicScrollX, setTopicScrollX] = useState(0);
  const [topicViewportWidth, setTopicViewportWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          router.replace('/(auth)/login');
          return;
        }
        const [emotionTopics, existing] = await Promise.all([
          getEmotionTagTopics(accessToken),
          getTodayCheckIn(accessToken),
        ]);
        if (cancelled) {
          return;
        }
        setTopics(emotionTopics);
        if (existing) {
          setSelectedEmotionIds(new Set(existing.emotions.map((tag) => tag.id)));
          setIntensity(existing.emotionIntensity);
          setEnergy(existing.energyLevel);
          setMemorableEvent(existing.memorableEvent ?? '');
          setGratitudeNote(existing.gratitudeNote ?? '');
          setCurrentNeed(existing.currentNeed);
        }
      } catch (error) {
        logger.error('checkin', 'failed to load checkin form', {
          code: error instanceof ApiError ? error.code : undefined,
        });
        if (!cancelled) {
          setErrorMessage('체크인 정보를 불러오지 못했어요.');
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
  }, []);

  if (state.status !== 'active') {
    return <Redirect href="/(auth)/login" />;
  }

  // 지금 뷰포트에 조금이라도 보이는 태그는 건너뛰고, 완전히 가려진 다음 태그가 맨 앞으로
  // 오도록 스크롤한다(뷰포트 오른쪽 끝보다 뒤에 있는 첫 항목을 찾는다).
  const handleTopicChevronPress = () => {
    const viewportRight = topicScrollX + topicViewportWidth;
    const next = topicOffsets.current.find((x) => x >= viewportRight - 4);
    topicScrollRef.current?.scrollTo({ x: next ?? 0, animated: true });
  };

  const toggleEmotion = (tag: TagSummary) => {
    setSelectedEmotionIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.id)) {
        next.delete(tag.id);
      } else {
        next.add(tag.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }
    setErrorMessage(null);
    setSaving(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.replace('/(auth)/login');
        return;
      }
      await upsertCheckIn(accessToken, {
        checkInDate: todayIsoDate(),
        emotionIntensity: intensity ?? undefined,
        energyLevel: energy ?? undefined,
        memorableEvent: memorableEvent.trim().length > 0 ? memorableEvent.trim() : undefined,
        gratitudeNote: gratitudeNote.trim().length > 0 ? gratitudeNote.trim() : undefined,
        currentNeed: currentNeed ?? undefined,
        emotionTagIds: Array.from(selectedEmotionIds),
      });
      setSaved(true);
    } catch (error) {
      logger.error('checkin', 'failed to save checkin', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('체크인을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <RecordScreenHeader title="오늘의 체크인" />
          <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (saved) {
    const selectedEmotions = topics
      .flatMap((topic) => topic.tags)
      .filter((tag) => selectedEmotionIds.has(tag.id));
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <RecordScreenHeader title="체크인 완료" />
            <ThemedText type="heading" style={styles.doneHeading}>
              오늘의 마음을{'\n'}확인했어요
            </ThemedText>

            {selectedEmotions.length > 0 && (
              <View style={styles.chips}>
                {selectedEmotions.map((tag) => (
                  <View key={tag.id} style={[styles.chip, { borderColor: theme.border }]}>
                    <ThemedText type="small">{tag.name}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {intensity !== null && (
              <LevelBar
                label="감정 강도"
                value={intensity}
                levelLabel={INTENSITY_LABELS[levelLabelIndex(intensity, INTENSITY_LABELS.length)]}
                color={theme.text}
              />
            )}
            {energy !== null && (
              <LevelBar
                label="오늘의 에너지"
                value={energy}
                levelLabel={ENERGY_LABELS[levelLabelIndex(energy, ENERGY_LABELS.length)]}
                color={theme.text}
              />
            )}
            {currentNeed && <NeedSummary need={currentNeed} />}

            <ThemedText type="small" themeColor="textTertiary" style={styles.note}>
              오늘의 상태를 확인한 것만으로도 충분해요. 더 적고 싶을 때만 이어가면 돼요.
            </ThemedText>

            <AppButton
              title="이 마음을 더 기록하기"
              style={styles.doneButton}
              onPress={() => router.replace('/record/type')}
            />
            <AppButton title="체크인 다시 고치기" variant="ghost" onPress={() => setSaved(false)} />
            <AppButton title="오늘은 여기까지" variant="quiet" onPress={() => router.back()} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const currentTopic = topics[activeTopic];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <RecordScreenHeader title="오늘의 체크인" />
          <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
            모두 선택 입력이에요. 답하지 않고 넘어가도 체크인은 완료돼요.
          </ThemedText>

          <SectionHeading
            icon={{ ios: 'face.smiling', android: 'mood' }}
            title="지금 어떤 감정이 머물고 있나요?"
            style={styles.sectionHeading}
          />
          {topics.length > 0 && (
            <>
              <View style={styles.topicTabsRow}>
                <ScrollView
                  ref={topicScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => setTopicScrollX(e.nativeEvent.contentOffset.x)}
                  onLayout={(e) => setTopicViewportWidth(e.nativeEvent.layout.width)}
                  scrollEventThrottle={16}
                  style={styles.topicTabsScroll}>
                  <View style={styles.topicTabs}>
                    {topics.map((topic, index) => (
                      <Pressable
                        key={topic.id}
                        onPress={() => setActiveTopic(index)}
                        onLayout={(e) => {
                          topicOffsets.current[index] = e.nativeEvent.layout.x;
                        }}
                        style={[
                          styles.topicChip,
                          {
                            backgroundColor: activeTopic === index ? theme.text : theme.backgroundElement,
                          },
                        ]}>
                        <ThemedText
                          type="small"
                          style={{ color: activeTopic === index ? theme.background : theme.textSecondary }}>
                          {topic.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <Pressable
                  onPress={handleTopicChevronPress}
                  hitSlop={8}
                  style={[styles.topicTabsChevron, { backgroundColor: theme.backgroundElement }]}>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right' }}
                    size={14}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
              </View>
              <View style={styles.chips}>
                {(currentTopic?.tags ?? []).map((tag) => (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleEmotion(tag)}
                    style={[
                      styles.chip,
                      { borderColor: selectedEmotionIds.has(tag.id) ? theme.text : theme.border },
                      selectedEmotionIds.has(tag.id) && styles.chipOn,
                    ]}>
                    <ThemedText type="small">{tag.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <LevelSlider
            icon={{ ios: 'gauge.medium', android: 'speed' }}
            title="이 감정이 어느 정도 크게 느껴지나요?"
            levels={INTENSITY_LABELS}
            value={intensity}
            onChange={setIntensity}
            color={theme.text}
            hint="높고 낮음이 좋고 나쁨을 뜻하지 않아요."
          />

          <LevelSlider
            icon={{ ios: 'bolt.fill', android: 'bolt' }}
            title="오늘 사용할 수 있는 에너지는 어느 정도인가요?"
            levels={ENERGY_LABELS}
            value={energy}
            onChange={setEnergy}
            color={theme.text}
            hint="에너지가 낮은 날은 나쁜 날이 아니에요. 오늘 쓸 수 있는 만큼만 확인해요."
          />

          <SectionHeading
            icon={{ ios: 'book.fill', android: 'menu_book' }}
            title="오늘 마음에 남아 있는 일이 있나요?"
            style={styles.sectionHeading}
          />
          <TextInput
            style={[styles.field, { borderColor: theme.border, color: theme.text }]}
            placeholder="한 줄이어도 괜찮아요"
            placeholderTextColor={theme.textTertiary}
            value={memorableEvent}
            onChangeText={setMemorableEvent}
            multiline
            textAlignVertical="top"
          />

          <SectionHeading
            icon={{ ios: 'star.fill', android: 'star' }}
            title="감사했거나, 조금이라도 다행이라 느낀 일이 있었나요?"
            style={styles.sectionHeading}
          />
          <TextInput
            style={[styles.field, { borderColor: theme.border, color: theme.text }]}
            placeholder="넘어가도 괜찮아요"
            placeholderTextColor={theme.textTertiary}
            value={gratitudeNote}
            onChangeText={setGratitudeNote}
            multiline
            textAlignVertical="top"
          />

          <SectionHeading
            icon={{ ios: 'leaf.fill', android: 'eco' }}
            title="지금의 나에게 무엇이 필요하다고 느껴지나요?"
            style={styles.sectionHeading}
          />
          <View style={styles.chips}>
            {CHECKIN_NEEDS.map((need) => (
              <Pressable
                key={need}
                onPress={() => setCurrentNeed((prev) => (prev === need ? null : need))}
                style={[
                  styles.chip,
                  { borderColor: currentNeed === need ? theme.text : theme.border },
                  currentNeed === need && styles.chipOn,
                ]}>
                <ThemedText type="small">{need}</ThemedText>
              </Pressable>
            ))}
          </View>

          {errorMessage && (
            <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
              {errorMessage}
            </ThemedText>
          )}

          <AppButton
            title="체크인 마치기"
            style={styles.saveButton}
            loading={saving}
            onPress={handleSave}
          />
          <AppButton title="오늘은 여기까지" variant="quiet" onPress={() => router.back()} />
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  loading: {
    marginTop: Spacing.five,
  },
  lead: {
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.five,
  },
  topicTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  topicTabsScroll: {
    flex: 1,
  },
  topicTabs: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  topicChip: {
    height: 34,
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  topicTabsChevron: {
    marginLeft: Spacing.one,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  chipOn: {
    borderWidth: 1.5,
  },
  hint: {
    marginTop: Spacing.one,
  },
  field: {
    marginTop: Spacing.three,
    minHeight: 78,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
  },
  error: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: Spacing.five,
  },
  doneHeading: {
    marginTop: Spacing.four,
  },
  note: {
    marginTop: Spacing.three,
  },
  doneButton: {
    marginTop: Spacing.four,
  },
});
