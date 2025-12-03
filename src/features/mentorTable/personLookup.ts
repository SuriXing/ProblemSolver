export interface PersonOption {
  name: string;
  imageUrl?: string;
  candidateImageUrls?: string[];
  description?: string;
  descriptionZh?: string;
}

const imageCache = new Map<string, string | undefined>();
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

function createInlineAvatarDataUri(label: string, backgroundHex: string, colorHex: string): string {
  const safeLabel = (label || 'Mentor').trim() || 'Mentor';
  const initials = safeLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="${backgroundHex}"/><circle cx="256" cy="256" r="204" fill="#ffffff" opacity="0.72"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="178" font-weight="700" fill="${colorHex}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const VERIFIED_PLACEHOLDER_IMAGE = createInlineAvatarDataUri('Mentor', '#e7efff', '#2a4f90');

const VERIFIED_PEOPLE: Array<{
  canonical: string;
  aliases: string[];
  imageUrl: string;
  candidateImageUrls?: string[];
  description?: string;
  descriptionZh?: string;
}> = [
  {
    canonical: 'Bill Gates',
    aliases: ['bill gates', 'bill_gates', 'gates', 'william henry gates iii', '比尔·盖茨', '比尔盖茨'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Bill_Gates_at_the_European_Commission_-_2025_-_P067383-987995_%28cropped%29.jpg',
    candidateImageUrls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/512px-Bill_Gates_2018.jpg'],
    description: 'Co-founder of Microsoft, philanthropist',
    descriptionZh: '微软联合创始人、慈善家'
  },
  {
    canonical: 'Oprah Winfrey',
    aliases: ['oprah winfrey', 'oprah', 'oprah_gail_winfrey', '奥普拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Oprah_Winfrey_2016.jpg/960px-Oprah_Winfrey_2016.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Oprah_Winfrey_2014.jpg/512px-Oprah_Winfrey_2014.jpg'
    ],
    description: 'Media mogul, talk show host',
    descriptionZh: '媒体大亨、脱口秀主持人'
  },
  {
    canonical: 'Kobe Bryant',
    aliases: ['kobe bryant', 'kobe', 'kobe_bean_bryant', '科比', '科比·布莱恩特'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Kobe_Bryant_Dec_2014.jpg/960px-Kobe_Bryant_Dec_2014.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Kobe_Bryant_2019.jpg/512px-Kobe_Bryant_2019.jpg'
    ],
    description: 'NBA legend, Black Mamba',
    descriptionZh: 'NBA传奇球星、黑曼巴'
  },
  {
    canonical: 'Hayao Miyazaki',
    aliases: ['hayao miyazaki', 'miyazaki', 'miyazaki_hayao', '宫崎骏'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Hayao_Miyazaki_%282019%29.jpg/512px-Hayao_Miyazaki_%282019%29.jpg',
    description: 'Animator, Studio Ghibli co-founder',
    descriptionZh: '动画大师、吉卜力工作室联合创始人'
  },
  {
    canonical: 'Elon Musk',
    aliases: ['elon musk', 'musk', 'elon', 'elon_musk', '埃隆·马斯克', '马斯克'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Elon_Musk_Royal_Society_%28crop2%29.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Elon_Musk_Royal_Society_%28crop2%29.jpg/512px-Elon_Musk_Royal_Society_%28crop2%29.jpg'
    ],
    description: 'CEO of Tesla & SpaceX',
    descriptionZh: 'Tesla与SpaceX CEO'
  },
  {
    canonical: 'Steve Jobs',
    aliases: ['steve jobs', 'jobs', '史蒂夫·乔布斯', '乔布斯'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/512px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    description: 'Co-founder of Apple',
    descriptionZh: '苹果联合创始人'
  },
  {
    canonical: 'Super Mario',
    aliases: ['super mario', 'mario', '马里奥'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png',
      'https://ui-avatars.com/api/?size=512&background=e73a2c&color=ffffff&bold=true&name=Mario'
    ],
    description: 'Nintendo video game character',
    descriptionZh: '任天堂经典游戏角色'
  },
  {
    canonical: 'Iron Man',
    aliases: ['iron man', 'ironman', 'tony stark', '钢铁侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg',
      'https://ui-avatars.com/api/?size=512&background=b71c1c&color=ffd54f&bold=true&name=IM'
    ],
    description: 'Marvel superhero, Tony Stark',
    descriptionZh: '漫威超级英雄、托尼·斯塔克'
  },
  {
    canonical: 'Pikachu',
    aliases: ['pikachu', '皮卡丘'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Pikachu.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Pikachu.png',
      'https://ui-avatars.com/api/?size=512&background=fdd835&color=795548&bold=true&name=Pk'
    ],
    description: 'Pokémon electric-type mascot',
    descriptionZh: '宝可梦电属性吉祥物'
  },
  {
    canonical: 'Naruto Uzumaki',
    aliases: ['naruto', 'naruto uzumaki', '鸣人'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
      'https://ui-avatars.com/api/?size=512&background=ff9800&color=1a237e&bold=true&name=NU'
    ],
    description: 'Ninja from Naruto anime',
    descriptionZh: '火影忍者主角'
  },
  {
    canonical: 'Monkey D. Luffy',
    aliases: ['luffy', 'monkey d luffy', '路飞'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
      'https://ui-avatars.com/api/?size=512&background=d32f2f&color=ffffff&bold=true&name=ML'
    ],
    description: 'Captain of the Straw Hat Pirates',
    descriptionZh: '草帽海贼团船长'
  },
  {
    canonical: 'Son Goku',
    aliases: ['goku', 'son goku', '悟空'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Son_Goku_Character.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/6/6f/Son_Goku_Character.jpg',
      'https://ui-avatars.com/api/?size=512&background=ff6f00&color=ffffff&bold=true&name=SG'
    ],
    description: 'Saiyan warrior from Dragon Ball',
    descriptionZh: '龙珠赛亚人战士'
  },
  {
    canonical: 'Spider-Man',
    aliases: ['spiderman', 'spider man', '彼得帕克', '蜘蛛侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg',
      'https://ui-avatars.com/api/?size=512&background=d50000&color=1565c0&bold=true&name=SM'
    ],
    description: 'Marvel superhero, Peter Parker',
    descriptionZh: '漫威超级英雄、彼得·帕克'
  },
  {
    canonical: 'Batman',
    aliases: ['batman', '布鲁斯韦恩', '蝙蝠侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg',
      'https://ui-avatars.com/api/?size=512&background=212121&color=fdd835&bold=true&name=BM'
    ],
    description: 'DC superhero, Bruce Wayne',
    descriptionZh: 'DC超级英雄、布鲁斯·韦恩'
  },
  {
    canonical: 'Link',
    aliases: ['link', 'zelda link', '林克'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Link_Hyrule_Warriors.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/2/2f/Link_Hyrule_Warriors.png',
      'https://ui-avatars.com/api/?size=512&background=2e7d32&color=ffffff&bold=true&name=LK'
    ],
    description: 'Hero of The Legend of Zelda',
    descriptionZh: '塞尔达传说主角'
  },
  {
    canonical: 'Lara Croft',
    aliases: ['lara croft', 'lara', '劳拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Lara_Croft.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/7/7e/Lara_Croft.png',
      'https://ui-avatars.com/api/?size=512&background=4e342e&color=ffffff&bold=true&name=LC'
    ],
    description: 'Tomb Raider adventurer',
    descriptionZh: '古墓丽影冒险家'
  },
  {
    canonical: 'Lisa Su',
    aliases: ['lisa su', 'lisa', 'su', '苏姿丰'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lisa_Su_2024_%28cropped%29.jpg/512px-Lisa_Su_2024_%28cropped%29.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lisa_Su_2024_%28cropped%29.jpg/512px-Lisa_Su_2024_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/AMD_CEO_Lisa_Su_20130415_cropped.jpg/512px-AMD_CEO_Lisa_Su_20130415_cropped.jpg'
    ],
    description: 'CEO of AMD',
    descriptionZh: 'AMD首席执行官'
  },
  {
    canonical: 'Satya Nadella',
    aliases: ['satya nadella', 'satya', 'nadella', '萨提亚·纳德拉', '纳德拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/512px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg',
    description: 'CEO of Microsoft',
    descriptionZh: '微软首席执行官'
  },
  {
    canonical: 'Taylor Swift',
    aliases: ['taylor swift', 'taylor', 'swift', '泰勒·斯威夫特', '泰勒斯威夫特', '霉霉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/512px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
    description: 'Singer-songwriter, pop icon',
    descriptionZh: '创作型歌手、流行偶像'
  }
];

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_·.'’`-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function buildNameAvatar(name: string): string {
  const label = (name || 'Mentor').trim() || 'Mentor';
  return createInlineAvatarDataUri(label, '#e7efff', '#2a4f90');
}

function withAvatarFallback(person: PersonOption): PersonOption {
  const fallback = buildNameAvatar(person.name);
  const candidates = Array.from(
    new Set([person.imageUrl, ...(person.candidateImageUrls || []), fallback].filter(Boolean))
  ) as string[];
  return {
    ...person,
    imageUrl: person.imageUrl || fallback,
    candidateImageUrls: candidates
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = (await response.json()) as T;
    return data;
  } catch {
    return null;
  }
}

type WikipediaPage = {
  title?: string;
  thumbnail?: { source?: string };
  pageprops?: {
    wikibase_shortdesc?: string;
  };
  pageterms?: {
    description?: string[];
  };
};

type WikipediaSearchResponse = {
  query?: {
    search?: Array<{ title: string }>;
  };
};

type WikipediaPageResponse = {
  query?: {
    pages?: Record<string, WikipediaPage>;
  };
};

function buildWikiUrl(params: Record<string, string>): string {
  const search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    ...params
  });
  return `${WIKIPEDIA_API}?${search.toString()}`;
}

const EXCLUDED_TITLE_PATTERNS = [
  'discography',
  'filmography',
  'videography',
  'awards',
  'list of',
  'album',
  'albums',
  'song',
  'songs',
  'single',
  'singles',
  'tour',
  'episodes',
  'season',
  'soundtrack'
];

const SUPPORTED_ENTITY_DESCRIPTION_KEYWORDS = [
  'singer',
  'songwriter',
  'actor',
  'actress',
  'athlete',
  'player',
  'business',
  'entrepreneur',
  'writer',
  'author',
  'director',
  'producer',
  'politician',
  'scientist',
  'philosopher',
  'historian',
  'inventor',
  'composer',
  'poet',
  'novelist',
  'chef',
  'philanthropist',
  'comedian',
  'journalist',
  'television',
  'presenter',
  'host',
  'media personality',
  'model',
  'rapper',
  'coach',
  'fictional character',
  'video game character',
  'comic book character',
  'superhero',
  'personality type',
  'myers-briggs',
  'mbti'
];

const EXCLUDED_NON_MENTOR_DESCRIPTION_KEYWORDS = [
  'city',
  'capital',
  'country',
  'state',
  'province',
  'district',
  'county',
  'town',
  'village',
  'municipality',
  'river',
  'lake',
  'mountain',
  'island',
  'ocean',
  'sea',
  'airport',
  'railway station',
  'subway station',
  'bridge',
  'building',
  'museum',
  'company',
  'corporation',
  'brand',
  'consumer product',
  'software',
  'programming language'
];

function isMbtiCode(value: string): boolean {
  return /^(?:[IE][NS][FT][JP])$/i.test(value.trim());
}

function isLikelyEntityTitle(title: string): boolean {
  const lower = normalizeName(title);
  if (isMbtiCode(title)) return true;
  return !EXCLUDED_TITLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isLikelyEntityDescription(description?: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  if (EXCLUDED_TITLE_PATTERNS.some((pattern) => lower.includes(pattern))) return false;
  const hasSupportedKeyword = SUPPORTED_ENTITY_DESCRIPTION_KEYWORDS.some((keyword) => lower.includes(keyword));
  if (EXCLUDED_NON_MENTOR_DESCRIPTION_KEYWORDS.some((keyword) => lower.includes(keyword))) return false;
  return hasSupportedKeyword;
}

async function fetchWikiImageByTitle(title: string): Promise<PersonOption | undefined> {
  if (!isLikelyEntityTitle(title)) return undefined;
  const pageUrl = buildWikiUrl({
    prop: 'pageimages|pageprops|pageterms',
    piprop: 'thumbnail',
    pithumbsize: '512',
    wbptterms: 'description',
    redirects: '1',
    titles: title
  });
  const pageData = await fetchJson<WikipediaPageResponse>(pageUrl);
  const pages = pageData?.query?.pages ? Object.values(pageData.query.pages) : [];
  const page = pages.find((p) => p?.thumbnail?.source);
  if (!page?.thumbnail?.source) return undefined;
  const description = page.pageprops?.wikibase_shortdesc || page.pageterms?.description?.[0] || '';
  if (!isLikelyEntityDescription(description) && !isMbtiCode(page.title || title)) return undefined;
  return {
    name: page.title || title,
    imageUrl: page.thumbnail.source,
    candidateImageUrls: [page.thumbnail.source]
  };
}

function buildMbtiOption(code: string): PersonOption {
  const normalized = code.toUpperCase();
  const mbtiRoleSlugMap: Record<string, string> = {
    INTJ: 'architect',
    INTP: 'logician',
    ENTJ: 'commander',
    ENTP: 'debater',
    INFJ: 'advocate',
    INFP: 'mediator',
    ENFJ: 'protagonist',
    ENFP: 'campaigner',
    ISTJ: 'logistician',
    ISFJ: 'defender',
    ESTJ: 'executive',
    ESFJ: 'consul',
    ISTP: 'virtuoso',
    ISFP: 'adventurer',
    ESTP: 'entrepreneur',
    ESFP: 'entertainer'
  };
  const mbtiRole = mbtiRoleSlugMap[normalized] || 'architect';
  const localMbtiAvatar = `/assets/mbti/${normalized.toLowerCase()}.png`;
  const mbtiAvatar = `https://www.16personalities.com/static/images/personality-types/avatars/${normalized.toLowerCase()}-${mbtiRole}.png`;
  const mbtiImage = `https://www.16personalities.com/static/images/social/${normalized.toLowerCase()}.png?v=3`;
  const fallback = `https://ui-avatars.com/api/?size=512&background=d9e8ff&color=244b8f&name=${encodeURIComponent(normalized)}`;
  return withAvatarFallback({
    name: normalized,
    imageUrl: localMbtiAvatar,
    candidateImageUrls: [localMbtiAvatar, mbtiAvatar, mbtiImage, fallback]
  });
}

async function searchWikipediaPeople(query: string, limit: number): Promise<PersonOption[]> {
  const searchUrl = buildWikiUrl({
    list: 'search',
    srsearch: query,
    srnamespace: '0',
    srlimit: String(Math.max(1, Math.min(limit, 10)))
  });
  const searchData = await fetchJson<WikipediaSearchResponse>(searchUrl);
  const titles = (searchData?.query?.search || [])
    .map((item) => item.title)
    .filter((title) => Boolean(title && isLikelyEntityTitle(title)));
  if (titles.length === 0) return [];

  const results = await Promise.all(
    titles.map(async (title) => fetchWikiImageByTitle(title))
  );
  return results
    .filter((item): item is PersonOption => Boolean(item?.name))
    .map((item) => withAvatarFallback(item));
}

/**
 * Get the Chinese display name for a verified person, or return the canonical name.
 */
export function getChineseDisplayName(name: string): string {
  const key = normalizeName(name).replace(/_/g, ' ');
  for (const person of VERIFIED_PEOPLE) {
    const haystack = [normalizeName(person.canonical), ...person.aliases.map((a) => normalizeName(a).replace(/_/g, ' '))];
    if (haystack.some((text) => text === key || (key.length >= 2 && text.includes(key)))) {
      // Find the first Chinese alias
      const zhAlias = person.aliases.find((a) => /[\u3400-\u9fff]/.test(a));
      return zhAlias || person.canonical;
    }
  }
  return name;
}

export function findVerifiedPerson(name: string): { canonical: string; imageUrl: string; candidateImageUrls?: string[] } | undefined {
  const key = normalizeName(name).replace(/_/g, ' ');
  const makeResult = (person: typeof VERIFIED_PEOPLE[number]) => ({
    canonical: person.canonical,
    imageUrl: person.imageUrl,
    candidateImageUrls: person.candidateImageUrls
  });

  // 1. Exact match (fastest, most precise)
  for (const person of VERIFIED_PEOPLE) {
    if (normalizeName(person.canonical) === key) return makeResult(person);
    if (person.aliases.some((alias) => normalizeName(alias).replace(/_/g, ' ') === key)) return makeResult(person);
  }

  // 2. Partial match fallback — "bill gate" matches "bill gates", "lisa" matches "lisa su"
  if (key.length >= 3) {
    for (const person of VERIFIED_PEOPLE) {
      const haystack = [normalizeName(person.canonical), ...person.aliases.map((a) => normalizeName(a))].map((s) => s.replace(/_/g, ' '));
      if (haystack.some((text) => text.includes(key) || key.includes(text))) return makeResult(person);
    }
  }

  return undefined;
}

/**
 * Instant synchronous search of VERIFIED_PEOPLE — no network calls.
 * Returns matches with photos for use as instant autocomplete suggestions.
 */
export function searchVerifiedPeopleLocal(query: string, limit = 8): PersonOption[] {
  const q = query.trim();
  if (!q) return [];
  const normalized = normalizeName(q);
  if (normalized.length < 1) return [];

  return VERIFIED_PEOPLE
    .filter((person) => {
      const haystack = [person.canonical, ...person.aliases].map((s) => normalizeName(s).replace(/_/g, ' '));
      return haystack.some((text) => text.includes(normalized));
    })
    .slice(0, limit)
    .map((person) => ({
      name: person.canonical,
      imageUrl: person.imageUrl,
      candidateImageUrls: person.candidateImageUrls,
      description: person.description,
      descriptionZh: person.descriptionZh
    }));
}

export function getVerifiedPlaceholderImage(): string {
  return VERIFIED_PLACEHOLDER_IMAGE;
}

export async function fetchPersonImage(name: string): Promise<string | undefined> {
  const key = normalizeName(name);
  if (!key) return undefined;
  if (imageCache.has(key)) return imageCache.get(key);
  if (isMbtiCode(name)) {
    const mbti = buildMbtiOption(name).imageUrl;
    imageCache.set(key, mbti);
    return mbti;
  }

  const verified = findVerifiedPerson(name);
  if (verified?.imageUrl) {
    imageCache.set(key, verified.imageUrl);
    return verified.imageUrl;
  }
  // Try exact Wikipedia title lookup first
  const wiki = await fetchWikiImageByTitle(name);
  if (wiki?.imageUrl) {
    imageCache.set(key, wiki.imageUrl);
    return wiki.imageUrl;
  }
  // Fall back to Wikipedia search, then name avatar
  const searchResults = await searchWikipediaPeople(name, 1);
  const image = searchResults[0]?.imageUrl || buildNameAvatar(name);
  imageCache.set(key, image);
  return image;
}

export async function fetchPersonImageCandidates(name: string): Promise<string[] | undefined> {
  const fallback = buildNameAvatar(name);
  if (isMbtiCode(name)) {
    return buildMbtiOption(name).candidateImageUrls || [fallback];
  }
  const verified = findVerifiedPerson(name);
  if (verified) {
    const combined = [verified.imageUrl, ...(verified.candidateImageUrls || []), fallback].filter(Boolean);
    return Array.from(new Set(combined));
  }
  // Try exact Wikipedia title lookup first
  const wiki = await fetchWikiImageByTitle(name);
  if (wiki?.imageUrl) return Array.from(new Set([wiki.imageUrl, fallback]));
  // Fall back to Wikipedia search, then name avatar
  const searchResults = await searchWikipediaPeople(name, 3);
  const images = searchResults.map((r) => r.imageUrl).filter(Boolean) as string[];
  return images.length > 0 ? [...images, fallback] : [fallback];
}

export async function searchPeopleWithPhotos(query: string, limit = 6): Promise<PersonOption[]> {
  const q = query.trim();
  if (!q) return [];

  const normalized = normalizeName(q);
  const verifiedMatches = VERIFIED_PEOPLE
    .filter((person) => {
      const haystack = [person.canonical, ...person.aliases].map((s) => normalizeName(s).replace(/_/g, ' '));
      return haystack.some((text) => text.includes(normalized));
    })
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map((person) => withAvatarFallback({
      name: person.canonical,
      imageUrl: person.imageUrl,
      candidateImageUrls: person.candidateImageUrls,
      description: person.description,
      descriptionZh: person.descriptionZh
    }));

  const mbtiMatches = MBTI_TYPES
    .filter((code) => normalizeName(code).includes(normalized))
    .map((code) => buildMbtiOption(code));

  const wikiMatches = await searchWikipediaPeople(q, limit);
  const merged = [...verifiedMatches, ...mbtiMatches, ...wikiMatches];
  const unique = new Map<string, PersonOption>();
  const score = (person: PersonOption) => {
    const generated = (url: string) => url.startsWith('data:image/svg+xml') || url.includes('ui-avatars.com/api');
    const imageScore = person.imageUrl ? (generated(person.imageUrl) ? 1 : 6) : 0;
    const candidateScore = (person.candidateImageUrls || []).reduce((acc, url) => acc + (generated(url) ? 0.25 : 1.5), 0);
    return imageScore + candidateScore;
  };

  for (const person of merged) {
    const key = normalizeName(person.name);
    if (!key) continue;
    const next = withAvatarFallback(person);
    const current = unique.get(key);
    if (!current || score(next) > score(current)) {
      unique.set(key, next);
    }
  }

  if (!unique.has(normalizeName(q))) {
    unique.set(normalizeName(q), withAvatarFallback({ name: q }));
  }

  return Array.from(unique.values()).slice(0, Math.max(1, limit));
}
