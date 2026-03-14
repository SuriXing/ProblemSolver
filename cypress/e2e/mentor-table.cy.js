describe('Mentor Table critical flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/mentor-table', (req) => {
      req.reply({
        delay: 1200,
        statusCode: 200,
        body: {
          schemaVersion: 'mentor_table.v1',
          language: 'zh-CN',
          safety: {
            riskLevel: 'low',
            needsProfessionalHelp: false,
            emergencyMessage: ''
          },
          mentorReplies: [
            {
              mentorId: 'custom_intj',
              mentorName: 'INTJ',
              likelyResponse: '我理解你现在很难受。先不要试图一次解决全部问题，先把最消耗你的那一部分单独拆出来。',
              whyThisFits: 'INTJ 会先建模再行动。',
              oneActionStep: '下一步：写下 1 个最卡住你的点，并给它 20 分钟处理时间。',
              confidenceNote: '这是基于公开信息生成的AI模拟视角，不代表本人真实发言。'
            },
            {
              mentorId: 'custom_esfj',
              mentorName: 'ESFJ',
              likelyResponse: '你现在需要先把自己照顾好。先找一个能支持你的人，把你的情绪和需求说清楚。',
              whyThisFits: 'ESFJ 会先关注人和支持系统。',
              oneActionStep: '下一步：今天联系 1 个可信的人，告诉对方你现在最需要什么帮助。',
              confidenceNote: '这是基于公开信息生成的AI模拟视角，不代表本人真实发言。'
            }
          ],
          meta: {
            disclaimer: '名人桌为AI模拟建议，仅用于启发，不构成医疗/法律/财务等专业意见。',
            generatedAt: '2026-02-10T12:00:00.000Z',
            provider: 'test-double',
            model: 'test-model',
            source: 'llm'
          }
        }
      });
    }).as('mentorApi');
  });

  it('shows localized loading, renders mentor replies, and saves a memory', () => {
    cy.visit('/#/mentor-table', {
      onBeforeLoad(win) {
        win.localStorage.setItem('language', 'zh-CN');
        win.localStorage.setItem('mentorTableOnboardingHiddenV2', '1');
      }
    });

    cy.contains('名人桌 · 召唤房间').should('be.visible');

    cy.get('[data-testid="mentor-person-input"]').type('INTJ');
    cy.get('[data-testid="mentor-add-person"]').click();
    cy.get('[data-testid="mentor-person-input"]').type('ESFJ');
    cy.get('[data-testid="mentor-add-person"]').click();

    cy.get('[data-testid="mentor-continue-scene"]').click();
    cy.get('[data-testid="mentor-lock-world"]').click();
    cy.get('[data-testid="mentor-problem-input"]').type('我最近很难过，也很累。');
    cy.get('[data-testid="mentor-begin-session"]').click();

    cy.get('[data-testid="mentor-conversation-panel"]').within(() => {
      cy.contains('你').should('be.visible');
      cy.contains('输入中').should('be.visible');
    });

    cy.wait('@mentorApi');
    cy.contains('INTJ').should('be.visible');
    cy.contains('ESFJ').should('be.visible');
    cy.contains('我理解你现在很难受').should('be.visible');

    cy.wait(3200);
    cy.contains('显示总结').click();
    cy.get('[data-testid="mentor-save-chat"]').click();

    cy.get('[data-testid="mentor-save-notice"]').should('contain', '聊天记录已成功保存');
    cy.get('[data-testid="mentor-memory-drawer"]').should('be.visible');
    cy.get('[data-testid="mentor-memory-drawer"]').should('contain', '今晚总结');
    cy.get('[data-testid="mentor-memory-drawer"]').should('contain', '写下 1 个最卡住你的点');
  });
});
