import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faLightbulb,
  faCircleInfo,
  faUsers,
  faTriangleExclamation,
  faPlus,
  faXmark,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
import {
  MentorId,
  MentorProfile,
  createCustomMentorProfile,
  getCartoonAvatarUrl,
  getSuggestedPeople
} from '../../features/mentorTable/mentorProfiles';
import { MentorSimulationResult } from '../../features/mentorTable/mentorEngine';
import { generateMentorAdvice } from '../../features/mentorTable/mentorApi';
import styles from './MentorTablePage.module.css';

type Language = 'zh-CN' | 'en';

const MAX_PEOPLE = 5;
const VIEWPOINT_POSITIONS = ['seat0', 'seat1', 'seat2', 'seat3', 'seat4'];

const MentorTablePage: React.FC = () => {
  const [problem, setProblem] = useState('');
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(['Bill Gates', 'Oprah Winfrey', 'Kobe Bryant']);
  const [activeMentorName, setActiveMentorName] = useState<string>('Bill Gates');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MentorSimulationResult | null>(null);

  const suggestions = useMemo(() => getSuggestedPeople(personQuery), [personQuery]);
  const selectedMentors = useMemo(
    () => selectedPeople.map((name) => createCustomMentorProfile(name)),
    [selectedPeople]
  );

  const addPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSelectedPeople((prev) => {
      if (prev.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return prev;
      if (prev.length >= MAX_PEOPLE) return prev;
      const next = [...prev, trimmed];
      if (!activeMentorName) setActiveMentorName(trimmed);
      return next;
    });
    setPersonQuery('');
  };

  const removePerson = (name: string) => {
    setSelectedPeople((prev) => {
      const next = prev.filter((p) => p !== name);
      if (activeMentorName === name) setActiveMentorName(next[0] || '');
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!problem.trim() || selectedMentors.length === 0) return;

    setIsGenerating(true);
    const aiResult = await generateMentorAdvice({
      problem: problem.trim(),
      language,
      mentors: selectedMentors
    });
    setResult(aiResult);
    setIsGenerating(false);
  };

  const getReplyByMentorName = (name: string) => {
    return result?.mentorReplies.find((reply) => reply.mentorName.toLowerCase() === name.toLowerCase());
  };

  const getMentorId = (mentor: MentorProfile): MentorId => mentor.id;

  return (
    <Layout>
      <section className={styles.page}>
        <div className={styles.hero}>
          <h1>名人桌</h1>
          <p>输入你欣赏的人名，系统会自动补全并生成卡通头像。提交问题后，从第一人称视角收到他们“可能会说”的建议。</p>
        </div>

        <div className={styles.workspace}>
          <aside className={styles.panel}>
            <div className={styles.block}>
              <h2>
                <FontAwesomeIcon icon={faUsers} /> 选择人物
              </h2>

              <div className={styles.searchBox}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                <input
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPerson(personQuery);
                    }
                  }}
                  placeholder="输入人物名字，如 Bill Gates"
                  className={styles.personInput}
                />
                <button type="button" className={styles.addBtn} onClick={() => addPerson(personQuery)}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>

              {personQuery.trim() && (
                <div className={styles.suggestionMenu}>
                  {suggestions.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={styles.suggestionItem}
                      onClick={() => addPerson(s.displayName)}
                    >
                      <img src={getCartoonAvatarUrl(s.displayName)} alt={s.displayName} className={styles.suggestionAvatar} />
                      <span>{s.displayName}</span>
                    </button>
                  ))}

                  {!suggestions.some((s) => s.displayName.toLowerCase() === personQuery.trim().toLowerCase()) && (
                    <button type="button" className={styles.suggestionItem} onClick={() => addPerson(personQuery)}>
                      <div className={styles.customDot}>+</div>
                      <span>添加 “{personQuery.trim()}”</span>
                    </button>
                  )}
                </div>
              )}

              <div className={styles.selectedPeople}>
                {selectedPeople.map((name) => (
                  <div key={name} className={styles.personTag}>
                    <img src={getCartoonAvatarUrl(name)} alt={name} className={styles.tagAvatar} />
                    <span>{name}</span>
                    <button type="button" onClick={() => removePerson(name)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.block}>
              <h2>
                <FontAwesomeIcon icon={faLightbulb} /> 你的问题
              </h2>

              <textarea
                className={styles.problemInput}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="例如：我最近对学习和未来很焦虑，不知道怎么重新开始。"
                rows={6}
              />

              <div className={styles.languageRow}>
                <button
                  type="button"
                  className={`${styles.langBtn} ${language === 'zh-CN' ? styles.langBtnActive : ''}`}
                  onClick={() => setLanguage('zh-CN')}
                >
                  中文
                </button>
                <button
                  type="button"
                  className={`${styles.langBtn} ${language === 'en' ? styles.langBtnActive : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
              </div>

              <button
                type="button"
                className={styles.generateBtn}
                disabled={isGenerating || !problem.trim() || selectedMentors.length === 0}
                onClick={handleGenerate}
              >
                <FontAwesomeIcon icon={faLightbulb} /> {isGenerating ? '生成中...' : '进入名人圆桌'}
              </button>
            </div>

            {result && (
              <div className={styles.disclaimer}>
                <FontAwesomeIcon icon={faCircleInfo} /> {result.meta.disclaimer}
              </div>
            )}
          </aside>

          <div className={styles.stage}>
            <div className={styles.viewHint}>第一人称视角: 你正坐在桌前，名人们在对面与两侧。</div>
            <div className={styles.tableArena}>
              <div className={styles.roomGlow} />

              <div className={styles.tableTop}>
                <div className={styles.tableInner} />
              </div>

              <div className={styles.userSeat}>
                <div className={styles.userAvatar}>
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className={styles.userLabel}>你（第一视角）</div>
                <p className={styles.userPrompt}>{problem.trim() || '输入问题后，查看每位人物在你面前的建议卡片。'}</p>
              </div>

              {selectedMentors.map((mentor: MentorProfile, index: number) => {
                const displayName = selectedPeople[index] || mentor.displayName;
                const seatClass = VIEWPOINT_POSITIONS[index] || VIEWPOINT_POSITIONS[VIEWPOINT_POSITIONS.length - 1];
                const reply = getReplyByMentorName(displayName) || getReplyByMentorName(mentor.displayName);
                const isActive = activeMentorName === displayName;

                return (
                  <div
                    key={`${displayName}-${getMentorId(mentor)}`}
                    className={`${styles.mentorNode} ${(styles as Record<string, string>)[seatClass]}`}
                    onMouseEnter={() => setActiveMentorName(displayName)}
                  >
                    <button
                      type="button"
                      className={`${styles.mentorAvatar} ${isActive ? styles.mentorAvatarActive : ''}`}
                      onClick={() => setActiveMentorName(displayName)}
                    >
                      <img src={getCartoonAvatarUrl(displayName)} alt={displayName} />
                    </button>
                    <div className={styles.mentorName}>{displayName}</div>

                    {reply && (
                      <div className={`${styles.suggestionCard} ${isActive ? styles.suggestionVisible : ''}`}>
                        <h3>{displayName}（第一人称）</h3>
                        <p>{reply.likelyResponse}</p>
                        <div className={styles.cardMeta}>
                          <strong>我会建议你：</strong> {reply.oneActionStep}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {result?.safety.riskLevel === 'high' && (
              <div className={styles.riskBanner}>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>{result.safety.emergencyMessage}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MentorTablePage;
