import { useEffect, useRef, useState } from 'react';

import { getPeriodReflection } from '@/api';
import { ApiError } from '@/api/errors';
import type { PeriodReflectionSummary } from '@/api/types';
import { getValidAccessToken } from '@/auth/authManager';
import { logger } from '@/lib/logger';

import { AI_REFLECTION_TERMINAL_STATUSES } from './use-ai-reflection-poll';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

interface UsePeriodReflectionPollResult {
  reflection: PeriodReflectionSummary | null;
  loading: boolean;
  timedOut: boolean;
}

// 3일/주간 회고도 개별 기록 AI 정리와 같은 비동기 작업 상태 모델(AiJobStatus)을 쓰므로
// use-ai-reflection-poll.ts와 같은 폴링 패턴을 그대로 따른다.
export function usePeriodReflectionPoll(periodReflectionId: string): UsePeriodReflectionPollResult {
  const [reflection, setReflection] = useState<PeriodReflectionSummary | null>(null);
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
        const result = await getPeriodReflection(accessToken, periodReflectionId);
        if (!cancelled) {
          setReflection(result);
        }
      } catch (error) {
        logger.error('use-period-reflection-poll', 'failed to load period reflection', {
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
  }, [periodReflectionId]);

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
        const result = await getPeriodReflection(accessToken, periodReflectionId);
        if (!cancelled) {
          setReflection(result);
        }
      } catch (error) {
        logger.error('use-period-reflection-poll', 'failed to poll period reflection', {
          code: error instanceof ApiError ? error.code : undefined,
        });
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loading, reflection, periodReflectionId]);

  return { reflection, loading, timedOut };
}
