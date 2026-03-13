export interface PersonOption {
  name: string;
  imageUrl?: string;
  candidateImageUrls?: string[];
}

const imageCache = new Map<string, string | undefined>();
const VERIFIED_PLACEHOLDER_IMAGE = 'https://ui-avatars.com/api/?size=512&background=e7efff&color=2a4f90&name=Mentor';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

const VERIFIED_PEOPLE: Array<{
  canonical: string;
  aliases: string[];
  imageUrl: string;
  candidateImageUrls?: string[];
}> = [
  {
    canonical: 'Bill Gates',
    aliases: ['bill gates', 'bill_gates', 'gates', 'william henry gates iii', '比尔·盖茨', '比尔盖茨'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Bill_Gates_at_the_European_Commission_-_2025_-_P067383-987995_%28cropped%29.jpg',
    candidateImageUrls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/512px-Bill_Gates_2018.jpg']
  },
  {
    canonical: 'Oprah Winfrey',
    aliases: ['oprah winfrey', 'oprah', 'oprah_gail_winfrey', '奥普拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Oprah_Winfrey_2016.jpg/960px-Oprah_Winfrey_2016.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Oprah_Winfrey_2014.jpg/512px-Oprah_Winfrey_2014.jpg'
    ]
  },
  {
    canonical: 'Kobe Bryant',
    aliases: ['kobe bryant', 'kobe', 'kobe_bean_bryant', '科比', '科比·布莱恩特'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Kobe_Bryant_Dec_2014.jpg/960px-Kobe_Bryant_Dec_2014.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Kobe_Bryant_2019.jpg/512px-Kobe_Bryant_2019.jpg'
    ]
  },
  {
    canonical: 'Hayao Miyazaki',
    aliases: ['hayao miyazaki', 'miyazaki', 'miyazaki_hayao', '宫崎骏'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Hayao_Miyazaki_%282019%29.jpg/512px-Hayao_Miyazaki_%282019%29.jpg'
  },
  {
    canonical: 'Elon Musk',
    aliases: ['elon musk', 'musk', 'elon', 'elon_musk', '埃隆·马斯克', '马斯克'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Elon_Musk_Royal_Society_%28crop2%29.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Elon_Musk_Royal_Society_%28crop2%29.jpg/512px-Elon_Musk_Royal_Society_%28crop2%29.jpg'
    ]
  },
  {
    canonical: 'Steve Jobs',
    aliases: ['steve jobs', 'jobs', '史蒂夫·乔布斯', '乔布斯'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/512px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg'
  },
  {
    canonical: 'Super Mario',
    aliases: ['super mario', 'mario', '马里奥'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png',
      'https://ui-avatars.com/api/?size=512&background=e73a2c&color=ffffff&bold=true&name=Mario'
    ]
  },
  {
    canonical: 'Iron Man',
    aliases: ['iron man', 'ironman', 'tony stark', '钢铁侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg',
      'https://ui-avatars.com/api/?size=512&background=b71c1c&color=ffd54f&bold=true&name=IM'
    ]
  },
  {
    canonical: 'Pikachu',
    aliases: ['pikachu', '皮卡丘'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Pikachu.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Pikachu.png',
      'https://ui-avatars.com/api/?size=512&background=fdd835&color=795548&bold=true&name=Pk'
    ]
  },
  {
    canonical: 'Naruto Uzumaki',
    aliases: ['naruto', 'naruto uzumaki', '鸣人'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
      'https://ui-avatars.com/api/?size=512&background=ff9800&color=1a237e&bold=true&name=NU'
    ]
  },
  {
    canonical: 'Monkey D. Luffy',
    aliases: ['luffy', 'monkey d luffy', '路飞'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
      'https://ui-avatars.com/api/?size=512&background=d32f2f&color=ffffff&bold=true&name=ML'
    ]
  },
  {
    canonical: 'Son Goku',
    aliases: ['goku', 'son goku', '悟空'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Son_Goku_Character.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/6/6f/Son_Goku_Character.jpg',
      'https://ui-avatars.com/api/?size=512&background=ff6f00&color=ffffff&bold=true&name=SG'
    ]
  },
  {
    canonical: 'Spider-Man',
    aliases: ['spiderman', 'spider man', '彼得帕克', '蜘蛛侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg',
      'https://ui-avatars.com/api/?size=512&background=d50000&color=1565c0&bold=true&name=SM'
    ]
  },
  {
    canonical: 'Batman',
    aliases: ['batman', '布鲁斯韦恩', '蝙蝠侠'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg',
      'https://ui-avatars.com/api/?size=512&background=212121&color=fdd835&bold=true&name=BM'
    ]
  },
  {
    canonical: 'Link',
    aliases: ['link', 'zelda link', '林克'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Link_Hyrule_Warriors.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/2/2f/Link_Hyrule_Warriors.png',
      'https://ui-avatars.com/api/?size=512&background=2e7d32&color=ffffff&bold=true&name=LK'
    ]
  },
  {
    canonical: 'Lara Croft',
    aliases: ['lara croft', 'lara', '劳拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Lara_Croft.png',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/en/7/7e/Lara_Croft.png',
      'https://ui-avatars.com/api/?size=512&background=4e342e&color=ffffff&bold=true&name=LC'
    ]
  },
  {
    canonical: 'Lisa Su',
    aliases: ['lisa su', 'lisa', 'su', '苏姿丰'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lisa_Su_2024_%28cropped%29.jpg/512px-Lisa_Su_2024_%28cropped%29.jpg',
    candidateImageUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lisa_Su_2024_%28cropped%29.jpg/512px-Lisa_Su_2024_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/AMD_CEO_Lisa_Su_20130415_cropped.jpg/512px-AMD_CEO_Lisa_Su_20130415_cropped.jpg'
    ]
  },
  {
    canonical: 'Satya Nadella',
    aliases: ['satya nadella', 'satya', 'nadella', '萨提亚·纳德拉', '纳德拉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/512px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg'
  },
  {
    canonical: 'Taylor Swift',
    aliases: ['taylor swift', 'taylor', 'swift', '泰勒·斯威夫特', '泰勒斯威夫特', '霉霉'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/512px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png'
  }
];

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
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
  return {
    name: normalized,
    imageUrl: localMbtiAvatar,
    candidateImageUrls: [localMbtiAvatar, mbtiAvatar, mbtiImage, fallback]
  };
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
  return results.filter((item): item is PersonOption => Boolean(item?.imageUrl));
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
      candidateImageUrls: person.candidateImageUrls
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
  // Fall back to Wikipedia search when title lookup fails (e.g. "lisa" → "Lisa Su")
  const searchResults = await searchWikipediaPeople(name, 1);
  const image = searchResults[0]?.imageUrl;
  imageCache.set(key, image);
  return image;
}

export async function fetchPersonImageCandidates(name: string): Promise<string[] | undefined> {
  if (isMbtiCode(name)) {
    const mbti = buildMbtiOption(name).imageUrl;
    return mbti ? [mbti] : undefined;
  }
  const verified = findVerifiedPerson(name);
  if (verified) {
    const combined = [verified.imageUrl, ...(verified.candidateImageUrls || [])].filter(Boolean);
    return Array.from(new Set(combined));
  }
  // Try exact Wikipedia title lookup first
  const wiki = await fetchWikiImageByTitle(name);
  if (wiki?.imageUrl) return [wiki.imageUrl];
  // Fall back to Wikipedia search when title lookup fails
  const searchResults = await searchWikipediaPeople(name, 3);
  const images = searchResults.map((r) => r.imageUrl).filter(Boolean) as string[];
  return images.length > 0 ? images : undefined;
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
    .map((person) => ({
      name: person.canonical,
      imageUrl: person.imageUrl,
      candidateImageUrls: person.candidateImageUrls
    }));

  const mbtiMatches = MBTI_TYPES
    .filter((code) => normalizeName(code).includes(normalized))
    .map((code) => buildMbtiOption(code));

  const wikiMatches = await searchWikipediaPeople(q, limit);
  const merged = [...verifiedMatches, ...mbtiMatches, ...wikiMatches];
  const unique = new Map<string, PersonOption>();
  for (const person of merged) {
    const key = normalizeName(person.name);
    if (!key) continue;
    if (!unique.has(key)) unique.set(key, person);
  }
  return Array.from(unique.values()).slice(0, limit);
}
