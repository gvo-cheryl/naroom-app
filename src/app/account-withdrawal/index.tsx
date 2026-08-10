import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestAccountWithdrawal } from '@/api';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { getValidAccessToken } from '@/auth/authManager';
import { requestKakaoProviderAccessToken } from '@/auth/kakaoNativeLogin';
import { RecordScreenHeader } from '@/components/record-screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { logger } from '@/lib/logger';

const DELETED_DATA_ITEMS = [
  '계정',
  '소셜 로그인 식별 정보',
  '체크인',
  '감정과 에너지',
  '모든 기록',
  'AI 정리',
  '태그',
  'LifeTime',
  '작은 실험 코스와 미션 기록',
  '저장한 문장',
  '알림 설정',
];

type Step = 'info' | 'reauth' | 'complete';

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

// IA §M7(계정과 기록 삭제) 4단계에 대응한다: 1단계 삭제 대상 안내와 2단계 사용자 확인은 한 화면에
// 담고(같은 흐름이라 화면을 나눌 이유가 없음), 3단계 재인증(reauth)과 4단계 완료(complete)를
// step으로 전환한다. 실제 상태 전환·세션 폐기·삭제 예정일 저장은 백엔드(POST /account/withdrawal)가
// 담당하고, 이 화면은 그 호출 전후의 안내만 맡는다.
export default function AccountWithdrawalScreen() {
  const { logout } = useAuth();
  const [step, setStep] = useState<Step>('info');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState<string | null>(null);

  const handleConfirm = () => {
    setErrorMessage(null);
    setStep('reauth');
  };

  const handleReauthenticate = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      // 본인 확인 절차로 카카오 로그인을 다시 요구한다 - 이 토큰 자체를 백엔드로 보내지는 않는다
      // (탈퇴 API는 이미 활성 세션을 갖고 있는 회원 본인만 호출할 수 있으므로).
      await requestKakaoProviderAccessToken();

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setErrorMessage('세션이 만료됐어요. 다시 로그인해 주세요.');
        return;
      }
      const deletionDate = await requestAccountWithdrawal(accessToken);
      setScheduledDeletionAt(deletionDate);
      setStep('complete');
      await logout();
    } catch (error) {
      logger.error('accountWithdrawal.index', 'failed to request withdrawal', {
        code: error instanceof ApiError ? error.code : undefined,
      });
      setErrorMessage('본인 확인 또는 삭제 요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'complete') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="heading" style={styles.completeTitle}>
            삭제 요청이 접수됐어요
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.completeBody}>
            {scheduledDeletionAt
              ? `${formatDate(scheduledDeletionAt)}까지는 다시 로그인해 계정을 복구할 수 있어요.`
              : '유예 기간 안에는 다시 로그인해 계정을 복구할 수 있어요.'}
          </ThemedText>
          <AppButton title="확인" style={styles.completeButton} onPress={() => router.replace('/(auth)/login')} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <RecordScreenHeader title="계정과 기록 삭제" />

          {step === 'info' && (
            <>
              <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
                삭제를 요청하면 다음 정보가 모두 사라져요.
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.card}>
                {DELETED_DATA_ITEMS.map((item) => (
                  <ThemedText key={item} type="default" style={styles.listItem}>
                    · {item}
                  </ThemedText>
                ))}
              </ThemedView>
              <ThemedText type="small" themeColor="textTertiary" style={styles.notice}>
                계정 삭제를 요청하면 바로 로그아웃되며, 데이터는 7일 후 영구 삭제돼요. 7일 안에는 다시
                로그인해 복구할 수 있어요.
              </ThemedText>
              <AppButton title="삭제 요청 계속하기" variant="danger" style={styles.actionButton} onPress={handleConfirm} />
            </>
          )}

          {step === 'reauth' && (
            <>
              <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
                본인 확인을 위해 카카오 로그인을 다시 진행해 주세요.
              </ThemedText>
              {errorMessage && (
                <ThemedText type="small" themeColor="textTertiary" style={styles.notice}>
                  {errorMessage}
                </ThemedText>
              )}
              <AppButton
                title={submitting ? '처리하는 중…' : '카카오로 본인 확인하고 삭제 요청하기'}
                variant="danger"
                loading={submitting}
                style={styles.actionButton}
                onPress={handleReauthenticate}
              />
              <AppButton
                title="취소"
                variant="ghost"
                disabled={submitting}
                style={styles.actionButton}
                onPress={() => setStep('info')}
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  lead: {
    marginTop: Spacing.two,
  },
  card: {
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  listItem: {
    marginTop: Spacing.one,
  },
  notice: {
    marginTop: Spacing.three,
  },
  actionButton: {
    marginTop: Spacing.three,
  },
  completeTitle: {
    marginTop: Spacing.six,
    textAlign: 'center',
  },
  completeBody: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  completeButton: {
    marginTop: Spacing.five,
  },
});
