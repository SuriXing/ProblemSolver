import i18next, { TOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import the translations from the original i18n.js
const translations = {
    'zh-CN': { // Chinese (Simplified)
        // Common elements
        siteName: '解忧杂货铺',
        siteDescription: '一个温暖的心灵港湾',
        pastQuestions: '过往问题',
        pastResponses: '过往回应',
        returnHome: '返回首页',
        helpOthers: '帮助他人',
        continueHelping: '继续帮助他人',
        copyright: '© 2024 解忧杂货铺 - 一个温暖的心灵港湾',

        // Home page
        homeTitle: '在这里，你的故事有人倾听',
        homeSubtitle: '匿名、安全、温暖的社区',
        confessCardTitle: '我有话想说',
        confessCardDesc: '在这里安全地分享你的困扰，收获温暖回应',
        startConfession: '开始倾诉',
        helpCardTitle: '我想帮助别人',
        helpCardDesc: '给予他人温暖的建议，成为某人的光',
        goHelp: '去帮助他人',

        // Confession page
        confessionTitle: '向杂货铺老板倾诉',
        confessionSubtitle: '在这里分享你的困扰，收到回复时将通知你',
        confessionPlaceholder: '写下你的心事、困惑或者需要的帮助...',
        addTags: '添加标签（可选）：',
        privacySettings: '隐私设置：',
        publicQuestion: '公开提问 (可被大家回答)',
        privateQuestion: '私密提问 (仅管理员可见)',
        emailNotify: '有回复时通过邮件通知我',
        emailPlaceholder: '请输入你的邮箱',
        send: '发送',
        enterThoughts: '请先写下你的心事。',
        enterEmail: '请填写你的邮箱地址以接收通知。',

        // Tags
        tagPressure: '压力',
        tagAnxiety: '焦虑',
        tagInsomnia: '失眠',
        tagRelationship: '感情',
        tagWork: '工作',
        tagStudy: '学业',
        tagLife: '生活',
        tagThoughts: '心事',

        // Confession success page
        thankYouTitle: '感谢你的分享',
        thankYouSubtitle: '你的心声已经被记录，我们会尽快回应',
        yourAccessCode: '你的访问码',
        saveAccessCode: '请保存这个访问码，以便稍后查看回复',
        yourAnonymousId: '你的匿名ID: #',
        justPosted: '刚刚发布',
        notifyMessage: '我们将在有回复时通知你',
        whatHappensNext: '接下来会发生什么？',
        communityWillSee: '我们的社区成员将会看到你的问题并提供帮助',
        replyIn24h: '通常在24小时内你会收到回复',
        emailNotification: '如果你提供了邮箱，我们会在有回复时通知你',
        checkWithCode: '你可以使用访问码通过"过往问题"查看你的问题状态和回复',
        copied: '已复制!',
        copyAccessCode: '复制访问码',
        viewMyPost: '查看我的帖子',
        
        // Help page
        helpTitle: '帮助他人',
        helpSubtitle: '你的一句话可能照亮他人的一片天空',
        anonymousAsker: '匿名提问者 #',
        hoursAgo: '小时前',
        replyPlaceholder: '写下你的建议和鼓励...',
        sendReply: '送出回应',
        todayHelped: '今日已帮助',
        totalHelped: '累计帮助',
        receivedThanks: '收到感谢',
        people: '人',
        times: '次',
        enterSuggestion: '请先写下你的建议和鼓励。',
        replyThanks: '感谢你的回应！你的温暖将传递给需要帮助的人。',
        anonymousUser: '匿名用户',
        
        // Helper success page
        thankHelperTitle: '感谢你的温暖回应',
        thankHelperSubtitle: '你的建议和鼓励将带给对方力量和希望',
        helperStats: '你的帮助统计',
        yourReply: '你的回应:',
        kindnessMatters: '你的善举很重要',
        replyDelivered: '你的回应已经传递给了需要帮助的人',
        mightThankYou: '对方收到后可能会给你发送感谢',
        checkPastResponses: '你可以在"过往回应"中查看你的所有回应和对方的反馈',
        everyReplyMatters: '每一个温暖的回应都可能改变一个人的处境',
        thankYouForHelping: '感谢你的帮助！',
        replySent: '回复已发送',

        // Language selector
        language: '语言',
        chinese: '中文',
        english: 'English',
        spanish: 'Español',
        japanese: '日本語',
        korean: '한국어',

        // Past questions page
        accessCodeTitle: '输入访问码',
        accessCodeDesc: '通过访问码查看你的提问和回复',
        enterAccessCode: '输入访问码',
        fetchButton: '获取内容',
        loadDemo: '加载示例',
        noQuestionsFound: '未找到任何问题',
        tryAgain: '请重试或联系支持',
        loading: '加载中...',
        errorAccessCode: '我们找不到与此访问码关联的帖子。请检查您的访问码并重试。',
        replies: '回复',
        noRepliesYet: '暂无回复',
        checkBackLater: '请稍后再来查看',
        
        // Search and navigation
        searchPlaceholder: '搜索问题...',
        noPostsFound: '没有找到相关帖子',
        viewDetail: '查看详情',
        replyToPost: '回复',
        
        // Confession page
        shareYourConcerns: '分享你的心事',
        safeAnonymousSharing: '安全、匿名的分享，收获温暖回应',
        selectTags: '选择标签（最多3个）',
        notificationOption: '有回复时通知我（可选）',
        pleaseEnterConfession: '请输入内容再提交',
        submitting: '正在提交...',
        submitConfession: '提交'
    },
    'en': { // English
        // Common elements
        siteName: 'Worry-Free Store',
        siteDescription: 'A warm harbor for your soul',
        pastQuestions: 'Past Questions',
        pastResponses: 'Past Responses',
        returnHome: 'Return Home',
        helpOthers: 'Help Others',
        continueHelping: 'Continue Helping',
        copyright: '© 2024 Worry-Solving Shop - A warm harbor for your soul',

        // Home page
        homeTitle: 'Here, your story will be heard',
        homeSubtitle: 'Anonymous, safe, and warm community',
        confessCardTitle: 'I want to share',
        confessCardDesc: 'Share your concerns safely here and receive warm responses',
        startConfession: 'Start Sharing',
        helpCardTitle: 'I want to help others',
        helpCardDesc: 'Give warm advice to others, be someone\'s light',
        goHelp: 'Go Help Others',

        // Confession page
        confessionTitle: 'Share with the Shopkeeper',
        confessionSubtitle: 'Share your concerns here, we\'ll notify you when you receive replies',
        confessionPlaceholder: 'Write down your thoughts, confusion, or help needed...',
        addTags: 'Add tags (optional):',
        privacySettings: 'Privacy settings:',
        publicQuestion: 'Public question (can be answered by everyone)',
        privateQuestion: 'Private question (admin only)',
        emailNotify: 'Notify me by email when there\'s a reply',
        emailPlaceholder: 'Please enter your email',
        send: 'Send',
        enterThoughts: 'Please write down your thoughts first.',
        enterEmail: 'Please fill in your email to receive notifications.',

        // Tags
        tagPressure: 'Pressure',
        tagAnxiety: 'Anxiety',
        tagInsomnia: 'Insomnia',
        tagRelationship: 'Relationship',
        tagWork: 'Work',
        tagStudy: 'Study',
        tagLife: 'Life',
        tagThoughts: 'Thoughts',

        // Confession success page
        thankYouTitle: 'Thank you for sharing',
        thankYouSubtitle: 'Your message has been recorded, we\'ll respond as soon as possible',
        yourAccessCode: 'Your Access Code',
        saveAccessCode: 'Please save this access code to check for replies later',
        yourAnonymousId: 'Your Anonymous ID: #',
        justPosted: 'Just posted',
        notifyMessage: 'We\'ll notify you when there are replies',
        whatHappensNext: 'What happens next?',
        communityWillSee: 'Our community members will see your question and provide help',
        replyIn24h: 'You\'ll usually receive a reply within 24 hours',
        emailNotification: 'If you provided an email, we\'ll notify you when there\'s a reply',
        checkWithCode: 'You can use the access code to check your question status and replies via "Past Questions"',
        copied: 'Copied!',
        copyAccessCode: 'Copy access code',
        viewMyPost: 'View My Post',
        
        // Help page
        helpTitle: 'Help a Stranger',
        helpSubtitle: 'These questions come from people who truly need support, please answer with a gentle heart',
        anonymousAsker: 'Anonymous Asker #',
        hoursAgo: 'hours ago',
        replyPlaceholder: 'Write your advice and encouragement...',
        sendReply: 'Send Response',
        todayHelped: 'Helped Today',
        totalHelped: 'Total Helped',
        receivedThanks: 'Received Thanks',
        people: '',
        times: 'times',
        enterSuggestion: 'Please write your advice and encouragement first.',
        replyThanks: 'Thank you for your response! Your warmth will be passed on to those who need help.',
        anonymousUser: 'Anonymous User',
        
        // Helper success page
        thankHelperTitle: 'Thank you for your warm response',
        thankHelperSubtitle: 'Your suggestions and encouragement will bring strength and hope to others',
        helperStats: 'Your Help Statistics',
        yourReply: 'Your Reply:',
        kindnessMatters: 'Your Kindness Matters',
        replyDelivered: 'Your response has been delivered to someone who needs help',
        mightThankYou: 'The recipient may send you thanks after they receive it',
        checkPastResponses: 'You can check all your responses and their feedback in "Past Responses"',
        everyReplyMatters: 'Every warm response could change someone\'s situation',
        thankYouForHelping: 'Thank you for helping!',
        replySent: 'Reply Sent',

        // Language selector
        language: 'Language',
        chinese: '中文',
        english: 'English',
        spanish: 'Español',
        japanese: '日本語',
        korean: '한국어',

        // Past questions page
        accessCodeTitle: 'Enter Access Code',
        accessCodeDesc: 'View your question and replies with your access code',
        enterAccessCode: 'Enter access code',
        fetchButton: 'Fetch Content',
        loadDemo: 'Load Demo',
        noQuestionsFound: 'No questions found',
        tryAgain: 'Please try again or contact support',
        loading: 'Loading...',
        errorAccessCode: 'We couldn\'t find a post with this access code. Please check your access code and try again.',
        replies: 'Replies',
        noRepliesYet: 'No replies yet',
        checkBackLater: 'Check back later',
        
        // Search and navigation
        searchPlaceholder: 'Search questions...',
        noPostsFound: 'No posts found',
        viewDetail: 'View Details',
        replyToPost: 'Reply',
        
        // Confession page
        shareYourConcerns: 'Share Your Concerns',
        safeAnonymousSharing: 'Safe, anonymous sharing for warm responses',
        selectTags: 'Select Tags (max 3)',
        notificationOption: 'Notify me when there are replies (optional)',
        pleaseEnterConfession: 'Please enter your message before submitting',
        submitting: 'Submitting...',
        submitConfession: 'Submit'
    },
    'es': { // Spanish
        // Common elements
        siteName: 'Tienda Sin Preocupaciones',
        siteDescription: 'Un cálido refugio para tu alma',
        pastQuestions: 'Preguntas Pasadas',
        pastResponses: 'Respuestas Pasadas',
        returnHome: 'Volver al Inicio',
        helpOthers: 'Ayudar a Otros',
        continueHelping: 'Continuar Ayudando',
        copyright: '© 2024 Tienda Sin Preocupaciones - Un cálido refugio para tu alma',

        // Home page
        homeTitle: 'Aquí, tu historia será escuchada',
        homeSubtitle: 'Comunidad anónima, segura y cálida',
        confessCardTitle: 'Quiero compartir',
        confessCardDesc: 'Comparte tus preocupaciones de manera segura y recibe respuestas cálidas',
        startConfession: 'Comenzar a Compartir',
        helpCardTitle: 'Quiero ayudar a otros',
        helpCardDesc: 'Da consejos cálidos a otros, sé la luz de alguien',
        goHelp: 'Ir a Ayudar',

        // Confession page
        confessionTitle: 'Comparte con el Tendero',
        confessionSubtitle: 'Comparte tus preocupaciones aquí, te notificaremos cuando recibas respuestas',
        confessionPlaceholder: 'Escribe tus pensamientos, confusiones o ayuda que necesitas...',
        addTags: 'Añadir etiquetas (opcional):',
        privacySettings: 'Configuración de privacidad:',
        publicQuestion: 'Pregunta pública (puede ser respondida por todos)',
        privateQuestion: 'Pregunta privada (solo administrador)',
        emailNotify: 'Notificarme por correo electrónico cuando haya una respuesta',
        emailPlaceholder: 'Por favor ingresa tu correo electrónico',
        send: 'Enviar',
        enterThoughts: 'Por favor escribe tus pensamientos primero.',
        enterEmail: 'Por favor ingresa tu correo electrónico para recibir notificaciones.',

        // Tags
        tagPressure: 'Presión',
        tagAnxiety: 'Ansiedad',
        tagInsomnia: 'Insomnio',
        tagRelationship: 'Relación',
        tagWork: 'Trabajo',
        tagStudy: 'Estudio',
        tagLife: 'Vida',
        tagThoughts: 'Pensamientos',

        // Confession success page
        thankYouTitle: 'Gracias por compartir',
        thankYouSubtitle: 'Tu mensaje ha sido registrado, responderemos lo antes posible',
        yourAccessCode: 'Tu Código de Acceso',
        saveAccessCode: 'Por favor guarda este código de acceso para verificar respuestas más tarde',
        yourAnonymousId: 'Tu ID Anónimo: #',
        justPosted: 'Recién publicado',
        notifyMessage: 'Te notificaremos cuando haya respuestas',
        whatHappensNext: '¿Qué sucede después?',
        communityWillSee: 'Los miembros de nuestra comunidad verán tu pregunta y brindarán ayuda',
        replyIn24h: 'Normalmente recibirás una respuesta dentro de 24 horas',
        emailNotification: 'Si proporcionaste un correo electrónico, te notificaremos cuando haya una respuesta',
        checkWithCode: 'Puedes usar el código de acceso para verificar el estado de tu pregunta y las respuestas a través de "Preguntas Pasadas"',
        copied: '¡Copiado!',
        copyAccessCode: 'Copiar código de acceso',
        viewMyPost: 'Ver Mi Publicación',
        
        // Help page
        helpTitle: 'Ayudar a un Extraño',
        helpSubtitle: 'Estas preguntas provienen de personas que realmente necesitan apoyo, por favor responde con un corazón amable',
        anonymousAsker: 'Preguntador Anónimo #',
        hoursAgo: 'horas atrás',
        replyPlaceholder: 'Escribe tu consejo y palabras de ánimo...',
        sendReply: 'Enviar Respuesta',
        todayHelped: 'Ayudados Hoy',
        totalHelped: 'Total Ayudados',
        receivedThanks: 'Agradecimientos Recibidos',
        people: '',
        times: 'veces',
        enterSuggestion: 'Por favor escribe tu consejo y palabras de ánimo primero.',
        replyThanks: '¡Gracias por tu respuesta! Tu calidez será transmitida a quienes necesitan ayuda.',
        anonymousUser: 'Usuario Anónimo',
        
        // Helper success page
        thankHelperTitle: 'Gracias por tu cálida respuesta',
        thankHelperSubtitle: 'Tu consejo y aliento brindarán fuerza y esperanza a otros',
        helperStats: 'Tus Estadísticas de Ayuda',
        yourReply: 'Tu Respuesta:',
        kindnessMatters: 'Tu amabilidad importa',
        replyDelivered: 'Tu respuesta ha sido entregada a la persona que necesita ayuda',
        mightThankYou: 'Pueden enviarte agradecimientos después de recibirla',
        checkPastResponses: 'Puedes verificar todas tus respuestas y comentarios en "Respuestas Pasadas"',
        everyReplyMatters: 'Cada respuesta cálida puede cambiar la situación de alguien',
        thankYouForHelping: '¡Gracias por ayudar!',
        replySent: 'Respuesta Enviada',

        // Language selector
        language: 'Idioma',
        chinese: '中文',
        english: 'English',
        spanish: 'Español',
        japanese: '日本語',
        korean: '한국어',

        // Past questions page
        accessCodeTitle: 'Ingresar Código de Acceso',
        accessCodeDesc: 'Ver tu pregunta y respuestas con tu código de acceso',
        enterAccessCode: 'Ingresar código de acceso',
        fetchButton: 'Obtener Contenido',
        loadDemo: 'Cargar Demostración',
        noQuestionsFound: 'No se encontraron preguntas',
        tryAgain: 'Por favor intenta de nuevo o contacta soporte',
        loading: 'Cargando...',
        errorAccessCode: 'No pudimos encontrar una publicación con este código de acceso. Por favor, verifica tu código de acceso e intenta nuevamente.',
        replies: 'Respuestas',
        noRepliesYet: 'Aún no hay respuestas',
        checkBackLater: 'Revisa más tarde',
        
        // Search and navigation
        searchPlaceholder: 'Buscar preguntas...',
        noPostsFound: 'No se encontraron publicaciones',
        viewDetail: 'Ver Detalles',
        replyToPost: 'Responder',
        
        // Confession page
        shareYourConcerns: 'Comparte Tus Preocupaciones',
        safeAnonymousSharing: 'Compartición segura y anónima para respuestas cálidas',
        selectTags: 'Seleccionar Etiquetas (máx 3)',
        notificationOption: 'Notificarme cuando haya respuestas (opcional)',
        pleaseEnterConfession: 'Por favor ingresa tu mensaje antes de enviar',
        submitting: 'Enviando...',
        submitConfession: 'Enviar'
    },
    'ja': { // Japanese
        // Common elements
        siteName: '悩み解決ショップ',
        siteDescription: '心の安らぎ場所',
        pastQuestions: '過去の質問',
        pastResponses: '過去の回答',
        returnHome: 'ホームに戻る',
        helpOthers: '他の人を助ける',
        continueHelping: '助け続ける',
        copyright: '© 2024 悩み解決ショップ - 心の安らぎ場所',

        // Home page
        homeTitle: 'ここでは、あなたの話に耳を傾けます',
        homeSubtitle: '匿名、安全、温かいコミュニティ',
        confessCardTitle: '話したいことがあります',
        confessCardDesc: 'ここで安全に悩みを共有し、温かい返答を受け取りましょう',
        startConfession: '話し始める',
        helpCardTitle: '他の人を助けたい',
        helpCardDesc: '他の人に温かいアドバイスを与え、誰かの光になりましょう',
        goHelp: '助けに行く',

        // Confession page
        confessionTitle: '店主に相談する',
        confessionSubtitle: 'ここで悩みを共有すると、返信があった時に通知します',
        confessionPlaceholder: '思いや悩み、必要な助けを書き込んでください...',
        addTags: 'タグを追加（任意）：',
        privacySettings: 'プライバシー設定：',
        publicQuestion: '公開質問（誰でも回答可能）',
        privateQuestion: '非公開質問（管理者のみ）',
        emailNotify: '返信があった時にメールで通知する',
        emailPlaceholder: 'メールアドレスを入力してください',
        send: '送信',
        enterThoughts: '最初に考えを書いてください。',
        enterEmail: '通知を受け取るためにメールアドレスを入力してください。',

        // Tags
        tagPressure: 'プレッシャー',
        tagAnxiety: '不安',
        tagInsomnia: '不眠',
        tagRelationship: '人間関係',
        tagWork: '仕事',
        tagStudy: '勉強',
        tagLife: '生活',
        tagThoughts: '考え',

        // Confession success page
        thankYouTitle: '共有してくれてありがとう',
        thankYouSubtitle: 'あなたのメッセージが記録されました。できるだけ早く返信します',
        yourAccessCode: 'アクセスコード',
        saveAccessCode: '後で返信を確認するためにこのアクセスコードを保存してください',
        yourAnonymousId: '匿名ID: #',
        justPosted: '投稿したばかり',
        notifyMessage: '返信があった時に通知します',
        whatHappensNext: '次に何が起こるか？',
        communityWillSee: 'コミュニティのメンバーがあなたの質問を見て助けを提供します',
        replyIn24h: '通常、24時間 以内に返信があります',
        emailNotification: 'メールを提供した場合、返信があった時に通知します',
        checkWithCode: 'アクセスコードを使用して「過去の質問」から質問の状態と返信を確認できます',
        copied: 'コピーしました！',
        copyAccessCode: 'アクセスコードをコピー',
        viewMyPost: '自分の投稿を見る',
        
        // Help page
        helpTitle: '見知らぬ人を助ける',
        helpSubtitle: 'これらの質問は本当にサポートが必要な人々からのものです。優しい心で答えてください',
        anonymousAsker: '匿名の質問者 #',
        hoursAgo: '時間前',
        replyPlaceholder: 'アドバイスと励ましを書いてください...',
        sendReply: '返信を送信',
        todayHelped: '今日の助け',
        totalHelped: '累計の助け',
        receivedThanks: '受け取った感謝',
        people: '人',
        times: '回',
        enterSuggestion: 'まずアドバイスと励ましを書いてください。',
        replyThanks: '返信ありがとうございます！あなたの温かさは助けが必要な人に届けられます。',
        anonymousUser: '匿名ユーザー',
        
        // Helper success page
        thankHelperTitle: '温かい返信をありがとう',
        thankHelperSubtitle: 'あなたのアドバイスと励ましは他の人に力と希望をもたらします',
        helperStats: '助けの統計',
        yourReply: 'あなたの返信:',
        kindnessMatters: '優しさが大切です',
        replyDelivered: 'あなたの返信は助けを必要とする人に届けられました',
        mightThankYou: '相手は受け取った後にお礼を送るかもしれません',
        checkPastResponses: '"これまでの回答"ですべての返信と相手からのフィードバックを確認できます',
        everyReplyMatters: 'すべての温かい返信が誰かの状況を変える可能性があります',
        thankYouForHelping: '助けてくれてありがとう！',
        replySent: '返信を送信しました',

        // Language selector
        language: '言語',
        chinese: '中文',
        english: 'English',
        spanish: 'Español',
        japanese: '日本語',
        korean: '한국어',

        // Past questions page
        accessCodeTitle: 'アクセスコードを入力',
        accessCodeDesc: 'アクセスコードで質問と返信を表示',
        enterAccessCode: 'アクセスコードを入力',
        fetchButton: '内容を取得',
        loadDemo: 'デモをロード',
        noQuestionsFound: '質問が見つかりません',
        tryAgain: 'もう一度試すかサポートに連絡してください',
        loading: '読み込み中...',
        errorAccessCode: 'このアクセスコードでは投稿が見つかりませんでした。アクセスコードを確認して、もう一度お試しください。',
        replies: '返信',
        noRepliesYet: 'まだ返信がありません',
        checkBackLater: '後で確認してください',
        
        // Search and navigation
        searchPlaceholder: '質問を検索...',
        noPostsFound: '投稿が見つかりません',
        viewDetail: '詳細を見る',
        replyToPost: '返信',
        
        // Confession page
        shareYourConcerns: 'あなたの悩みを共有',
        safeAnonymousSharing: '安全で匿名の共有、温かい返答を受け取る',
        selectTags: 'タグを選択（最大3つ）',
        notificationOption: '返信があったら通知する（任意）',
        pleaseEnterConfession: '送信前に内容を入力してください',
        submitting: '送信中...',
        submitConfession: '送信'
    },
    'ko': { // Korean
        // Common elements
        siteName: '고민 해결 상점',
        siteDescription: '마음의 따뜻한 안식처',
        pastQuestions: '이전 질문들',
        pastResponses: '이전 답변들',
        returnHome: '홈으로 돌아가기',
        helpOthers: '다른 사람 돕기',
        continueHelping: '계속 돕기',
        copyright: '© 2024 고민 해결 상점 - 마음의 따뜻한 안식처',

        // Home page
        homeTitle: '여기서 당신의 이야기를 들어드립니다',
        homeSubtitle: '익명, 안전, 따뜻한 커뮤니티',
        confessCardTitle: '말하고 싶은 것이 있어요',
        confessCardDesc: '여기서 안전하게 고민을 공유하고 따뜻한 답변을 받으세요',
        startConfession: '이야기 시작하기',
        helpCardTitle: '다른 사람을 돕고 싶어요',
        helpCardDesc: '다른 사람에게 따뜻한 조언을 주고 누군가의 빛이 되세요',
        goHelp: '도우러 가기',

        // Confession page
        confessionTitle: '가게 주인에게 이야기하기',
        confessionSubtitle: '여기에 고민을 공유하면 답변이 왔을 때 알려드립니다',
        confessionPlaceholder: '생각, 고민 또는 필요한 도움을 적어주세요...',
        addTags: '태그 추가 (선택사항):',
        privacySettings: '개인정보 설정:',
        publicQuestion: '공개 질문 (모두가 답변 가능)',
        privateQuestion: '비공개 질문 (관리자만)',
        emailNotify: '답변이 있을 때 이메일로 알림 받기',
        emailPlaceholder: '이메일을 입력해주세요',
        send: '보내기',
        enterThoughts: '먼저 생각을 적어주세요.',
        enterEmail: '알림을 받으려면 이메일을 입력해주세요.',

        // Tags
        tagPressure: '압박감',
        tagAnxiety: '불안',
        tagInsomnia: '불면증',
        tagRelationship: '인간관계',
        tagWork: '일',
        tagStudy: '공부',
        tagLife: '생활',
        tagThoughts: '생각',

        // Confession success page
        thankYouTitle: '공유해주셔서 감사합니다',
        thankYouSubtitle: '메시지가 기록되었습니다. 최대한 빨리 답변드리겠습니다',
        yourAccessCode: '접근 코드',
        saveAccessCode: '나중에 답변을 확인하기 위해 이 접근 코드를 저장해주세요',
        yourAnonymousId: '익명 ID: #',
        justPosted: '방금 게시됨',
        notifyMessage: '답변이 있을 때 알려드리겠습니다',
        whatHappensNext: '다음에 무슨 일이 일어날까요?',
        communityWillSee: '우리 커뮤니티 멤버들이 당신의 질문을 보고 도움을 줄 것입니다',
        replyIn24h: '보통 24시간 이내에 답변을 받게 됩니다',
        emailNotification: '이메일을 제공하셨다면, 답변이 있을 때 알려드리겠습니다',
        checkWithCode: '"이전 질문들"에서 접근 코드를 사용해 질문 상태와 답변을 확인할 수 있습니다',
        copied: '복사되었습니다!',
        copyAccessCode: '접근 코드 복사',
        viewMyPost: '내 게시물 보기',
        
        // Help page
        helpTitle: '낯선 사람 돕기',
        helpSubtitle: '이 질문들은 정말 도움이 필요한 사람들로부터 온 것입니다. 따뜻한 마음으로 답변해주세요',
        anonymousAsker: '익명 질문자 #',
        hoursAgo: '시간 전',
        replyPlaceholder: '당신의 조언과 격려를 적어주세요...',
        sendReply: '답변 보내기',
        todayHelped: '오늘 도움',
        totalHelped: '총 도움',
        receivedThanks: '받은 감사',
        people: '명',
        times: '번',
        enterSuggestion: '먼저 조언과 격려를 적어주세요.',
        replyThanks: '답변해주셔서 감사합니다! 당신의 따뜻함이 도움이 필요한 사람에게 전달될 것입니다.',
        anonymousUser: '익명 사용자',
        
        // Helper success page
        thankHelperTitle: '따뜻한 답변 감사합니다',
        thankHelperSubtitle: '당신의 조언과 격려는 다른 사람에게 힘과 희망을 줄 것입니다',
        helperStats: '당신의 도움 통계',
        yourReply: '당신의 답변:',
        kindnessMatters: '당신의 친절이 중요합니다',
        replyDelivered: '당신의 답변이 도움이 필요한 사람에게 전달되었습니다',
        mightThankYou: '상대방은 받은 후에 감사의 말을 보낼 수도 있습니다',
        checkPastResponses: '"이전 답변들"에서 모든 답변과 피드백을 확인할 수 있습니다',
        everyReplyMatters: '모든 따뜻한 답변은 누군가의 상황을 바꿀 수 있습니다',
        thankYouForHelping: '도와주셔서 감사합니다!',
        replySent: '답변 전송됨',

        // Language selector
        language: '언어',
        chinese: '中文',
        english: 'English',
        spanish: 'Español',
        japanese: '日本語',
        korean: '한국어',

        // Past questions page
        accessCodeTitle: '접근 코드 입력',
        accessCodeDesc: '접근 코드로 질문과 답변 보기',
        enterAccessCode: '접근 코드 입력',
        fetchButton: '내용 가져오기',
        loadDemo: '데모 로드',
        noQuestionsFound: '질문을 찾을 수 없습니다',
        tryAgain: '다시 시도하거나 지원팀에 문의해주세요',
        loading: '로딩 중...',
        errorAccessCode: '이 접근 코드로 게시물을 찾을 수 없습니다. 접근 코드를 확인하고 다시 시도해주세요.',
        replies: '답변',
        noRepliesYet: '아직 답변이 없습니다',
        checkBackLater: '나중에 다시 확인해주세요',
        
        // Search and navigation
        searchPlaceholder: '질문 검색...',
        noPostsFound: '게시물을 찾을 수 없습니다',
        viewDetail: '상세 보기',
        replyToPost: '답변',
        
        // Confession page
        shareYourConcerns: '당신의 고민 공유하기',
        safeAnonymousSharing: '안전하고 익명의 공유, 따뜻한 답변 받기',
        selectTags: '태그 선택 (최대 3개)',
        notificationOption: '답변이 있을 때 알림 받기 (선택사항)',
        pleaseEnterConfession: '제출 전에 내용을 입력해주세요',
        submitting: '제출 중...',
        submitConfession: '제출'
    }
};

// Convert translations to the format i18next expects
const resources = {
    'zh-CN': {
        translation: translations['zh-CN']
    },
    en: {
        translation: translations['en']
    },
    es: {
        translation: translations['es']
    },
    ja: {
        translation: translations['ja']
    },
    ko: {
        translation: translations['ko']
    }
};

// Function to safely get the saved language or default to zh-CN
const getSavedLanguage = (): string => {
    let savedLanguage = 'zh-CN';
    
    try {
        const storedLanguage = localStorage.getItem('language');
        if (storedLanguage) {
            savedLanguage = storedLanguage;
        }
    } catch (error) {
        console.error('Error getting language from localStorage:', error);
    }
    
    return savedLanguage;
};

// Initialize i18next with proper typings
const i18n = i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    parseMissingKeyHandler: (key) => {
      console.warn(`Missing translation key: ${key}`);
      return key;
    }
  });

// Add type declarations for the window object extensions
declare global {
  interface Window {
    currentLanguage: string;
    i18n: {
      init: () => void;
      changeLanguage: (lang: string) => void;
      translatePage: () => void;
      t: (key: string, options?: TOptions) => string;
      currentLanguage: string;
    };
  }
}

// Add legacy compatibility for old code
if (typeof window !== 'undefined') {
    window.currentLanguage = getSavedLanguage();
    
    // Expose i18n methods globally in a way compatible with the original code
    window.i18n = {
        init: () => {
            console.log('Legacy i18n initialized');
        },
        changeLanguage: (lang: string) => {
            i18next.changeLanguage(lang);
            localStorage.setItem('language', lang);
            window.currentLanguage = lang;
        },
        translatePage: () => {
            console.log('Legacy translatePage called, no action needed in React implementation');
        },
        t: (key: string, options?: TOptions) => {
            // @ts-ignore - This works at runtime
            return i18next.t(key, options);
        },
        currentLanguage: getSavedLanguage()
    };
}

export default i18n;
