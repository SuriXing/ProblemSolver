import { MentorProfile } from './mentorProfiles';
import { MentorSimulationResult, simulateMentorTable } from './mentorEngine';

interface MentorApiRequest {
  problem: string;
  language: 'zh-CN' | 'en';
  mentors: MentorProfile[];
}

export async function generateMentorAdvice(input: MentorApiRequest): Promise<MentorSimulationResult> {
  const requestTimeoutMs = Number(import.meta.env.VITE_MENTOR_API_TIMEOUT_MS || 35000);
  const endpoints = [
    import.meta.env.VITE_MENTOR_API_URL as string | undefined,
    '/api/mentor-table',
    'http://127.0.0.1:8787/api/mentor-table'
  ].filter((v): v is string => Boolean(v));

  try {
    let lastError: Error | null = null;
    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: controller.signal
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Mentor API failed at ${endpoint} with status ${res.status}: ${errorText}`);
        }

        const json = (await res.json()) as MentorSimulationResult;
        if (!json?.mentorReplies || !Array.isArray(json.mentorReplies)) {
          throw new Error(`Mentor API returned invalid payload at ${endpoint}`);
        }

        return {
          ...json,
          meta: {
            ...json.meta,
            source: 'llm'
          }
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`Mentor API timeout at ${endpoint} after ${requestTimeoutMs}ms`);
        } else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    throw lastError || new Error('All mentor API endpoints failed');
  } catch (error) {
    console.warn('Falling back to local mentor simulation:', error);
    const fallback = simulateMentorTable(input.problem, input.mentors, input.language);
    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        source: 'fallback',
        debugMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
