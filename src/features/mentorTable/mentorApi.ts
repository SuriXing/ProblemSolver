import { MentorProfile } from './mentorProfiles';
import { MentorSimulationResult, simulateMentorTable } from './mentorEngine';

interface MentorApiRequest {
  problem: string;
  language: 'zh-CN' | 'en';
  mentors: MentorProfile[];
}

export async function generateMentorAdvice(input: MentorApiRequest): Promise<MentorSimulationResult> {
  try {
    const res = await fetch('/api/mentor-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      throw new Error(`Mentor API failed with status ${res.status}`);
    }

    const json = (await res.json()) as MentorSimulationResult;
    if (!json?.mentorReplies || !Array.isArray(json.mentorReplies)) {
      throw new Error('Mentor API returned invalid payload');
    }

    return json;
  } catch (error) {
    console.warn('Falling back to local mentor simulation:', error);
    return simulateMentorTable(input.problem, input.mentors, input.language);
  }
}
