import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// 문서 버전은 백엔드 OnboardingService의 CURRENT_DOCUMENT_VERSION("1.0")과 맞춰야 한다.
// 별도 문서 버전 관리 기능이 생기면 그때 하드코딩을 걷어낸다.
const CURRENT_DOCUMENT_VERSION = "1.0";

interface OnboardingItem {
  title: string;
  description: string;
}

interface OnboardingStep {
  title: string;
  lead?: string;
  items: OnboardingItem[];
  note?: string;
  nextLabel: string;
}

// 프로토타입 A03~A05의 카피를 그대로 옮긴다(승인된 온보딩 문구라 새로 쓰지 않는다).
const STEPS: OnboardingStep[] = [
  {
    title: "잘하려고 애쓰지 않아도\n괜찮은 곳이에요",
    lead: "나로움은 오늘의 마음을 부담 없이 남기고, 그 안에서 나에게 중요한 것을 천천히 발견하는 공간이에요.",
    items: [
      { title: "누구와도 비교하지 않아요", description: "여기에는 순위도, 평균도, 다른 사람의 기록도 없어요." },
      { title: "정답을 요구하지 않아요", description: "질문은 나를 시험하려는 게 아니라, 생각을 꺼내보기 위한 거예요." },
      {
        title: "생각을 대신 정리해 드려요",
        description: "복잡하게 엉킨 문장을 나로움이 한 번 펴 드릴게요. 결론은 늘 내가 내려요.",
      },
      {
        title: "시간이 지나면 보이는 것이 있어요",
        description: "오늘은 몰랐던 결이, 기록이 쌓이면 LifeTime에서 보이기 시작해요.",
      },
      {
        title: "작게 시도해보고, 나에게 맞는지 봐요",
        description: "3일이나 7일 동안 작은 질문과 행동을 시도하며 나에게 맞는 방식을 찾아요.",
      },
    ],
    nextLabel: "다음",
  },
  {
    title: "나로움은\n나를 정의하지 않아요",
    lead: "기록을 읽고 정리해 주는 역할을 이 앱에서는 그냥 나로움이라고 불러요.",
    items: [
      {
        title: "나로움은 나를 판단하지 않아요",
        description: "‘당신은 이런 사람입니다’ 같은 말은 하지 않아요. 기록에 무엇이 담겼는지만 옆에서 짚어 드려요.",
      },
      {
        title: "정리는 참고일 뿐이에요",
        description: "나로움이 정리한 문장이 어긋난다고 느껴지면 그대로 두거나 지워도 괜찮아요. 마지막 해석은 늘 내 몫이에요.",
      },
      { title: "진단이나 상담이 아니에요", description: "마음이 많이 힘든 날에는 가까운 사람이나 전문가의 도움이 더 필요할 수 있어요." },
      { title: "키워드는 언제든 고칠 수 있어요", description: "제안된 키워드는 지우거나 이름을 바꾸거나 새로 더할 수 있어요." },
      { title: "시작은 언제나 내가 눌러요", description: "작은 실험을 권해도, 내가 고르기 전까지는 아무것도 시작되지 않아요." },
    ],
    nextLabel: "확인하고 계속하기",
  },
  {
    title: "기록을 조심히\n다룰게요",
    items: [
      {
        title: "기록은 조용한 곳에 둘게요",
        description: "마음을 적은 글은 가장 민감한 기록이에요. 그래서 홈 화면과 위젯에는 원문을 길게 띄우지 않아요.",
      },
      { title: "글이 먼저, 정리는 그다음이에요", description: "적은 글은 먼저 저장돼요. 정리가 늦어지거나 실패해도 내 글이 사라지지 않아요." },
      { title: "떠날 때도 시간을 남겨요", description: "계정을 지우면 데이터는 7일 동안 조용히 보관됐다가 완전히 지워져요." },
      { title: "마음이 바뀌면 되돌릴 수 있어요", description: "7일 안에 다시 오면, 삭제를 취소하고 기록을 그대로 이어갈 수 있어요." },
    ],
    note: "기록의 정리와 키워드 추출에는 AI 기술이 쓰여요. 처리 범위는 개인정보 처리방침에 적어 두었어요.",
    nextLabel: "동의하고 시작하기",
  },
];

// 프로토타입을 화면 구조·카피의 기준으로 삼되, 마크업은 그대로 옮기지 않고 RN 컴포넌트로 새로 짠다.
export default function OnboardingScreen() {
  const { state, completeOnboarding } = useAuth();
  const theme = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (state.status !== "onboarding_required") {
    return null;
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = async () => {
    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        version: state.account.version,
        displayName: state.account.displayName,
        timezone: "Asia/Seoul",
        locale: "ko-KR",
        consents: [
          { type: "TERMS", documentVersion: CURRENT_DOCUMENT_VERSION, agreed: true },
          { type: "PRIVACY", documentVersion: CURRENT_DOCUMENT_VERSION, agreed: true },
          { type: "AI_PROCESSING", documentVersion: CURRENT_DOCUMENT_VERSION, agreed: true },
        ],
      });
    } catch {
      setErrorMessage("온보딩을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.steps}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                { backgroundColor: index <= stepIndex ? theme.text : theme.border },
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <ThemedText type="heading" style={styles.title}>
            {step.title}
          </ThemedText>
          {step.lead && (
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              {step.lead}
            </ThemedText>
          )}

          <View style={styles.itemList}>
            {step.items.map((item) => (
              <ThemedView key={item.title} type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.cardDescription}>
                  {item.description}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          {step.note && (
            <View style={[styles.note, { borderLeftColor: theme.border }]}>
              <ThemedText type="small" themeColor="textTertiary">
                {step.note}
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {errorMessage && (
          <ThemedText type="small" themeColor="textTertiary" style={styles.error}>
            {errorMessage}
          </ThemedText>
        )}

        <AppButton title={step.nextLabel} onPress={handleNext} loading={isSubmitting} style={styles.nextButton} />
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  steps: {
    flexDirection: "row",
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  stepDot: {
    flex: 1,
    height: 2,
    borderRadius: Radius.full,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
  },
  lead: {
    lineHeight: 22,
    marginBottom: Spacing.three,
  },
  itemList: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  cardDescription: {
    marginTop: Spacing.half,
  },
  note: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.two,
    marginTop: Spacing.three,
  },
  error: {
    textAlign: "center",
    marginBottom: Spacing.two,
  },
  nextButton: {
    marginTop: Spacing.two,
  },
});
