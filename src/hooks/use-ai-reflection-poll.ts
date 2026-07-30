import { useEffect, useRef, useState } from 'react';

import { getEntryAiReflection } from '@/api';
import { ApiError } from '@/api/errors';
import type { AiJobStatus, EntryAiReflectionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { logger } from '@/lib/logger';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

export const AI_REFLECTION_TERMINAL_STATUSES: AiJobStatus[] = [
  'COMPLETED',
  'BLOCKED',
  'SAFETY_SUPPORT',
  'FAILED',
];

interface UseAiReflectionPollResult {
  reflection: EntryAiReflectionSummary | null;
  loading: boolean;
  timedOut: boolean;
}

// 개별 기록 AI 정리(문장·질문·키워드 후보 추출)는 같은 비동기 작업 하나의 결과라, 이 훅 하나로
// R03(정리 표시)과 R05(키워드 확인) 양쪽에서 상태를 기다린다. 기다리지 않고 나가도 기록 자체는
// 이미 저장·발행된 뒤라 안전하다 — timedOut은 화면이 무한 로딩으로 보이지 않게 하기 위한 것뿐이다.
export function useAiReflectionPoll(entryId: string): UseAiReflectionPollResult {
  const [reflection, setReflection] = useState<EntryAiReflectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken || cancelled) {
          return;
        }
        const result = await getEntryAiReflection(accessToken, entryId);
        if (!cancelled) {
          setReflection(result);
        }
      } catch (error) {
        logger.error('use-ai-reflection-poll', 'failed to load ai reflection', {
          code: error instanceof ApiError ? error.code : undefined,
        });
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

  useEffect(() => {
    if (loading || !reflection?.status || AI_REFLECTION_TERMINAL_STATUSES.includes(reflection.status)) {
      return;
    }
    if (attempts.current >= POLL_MAX_ATTEMPTS) {
      setTimedOut(true);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      attempts.current += 1;
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken || cancelled) {
          return;
        }
        const result = await getEntryAiReflection(accessToken, entryId);
        if (!cancelled) {
          setReflection(result);
        }
      } catch (error) {
        logger.error('use-ai-reflection-poll', 'failed to poll ai reflection', {
          code: error instanceof ApiError ? error.code : undefined,
        });
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loading, reflection, entryId]);

  return { reflection, loading, timedOut };
}
