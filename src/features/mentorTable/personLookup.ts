export interface PersonOption {
  name: string;
  imageUrl?: string;
}

const imageCache = new Map<string, string | undefined>();
const VERIFIED_PLACEHOLDER_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const VERIFIED_PEOPLE: Array<{ canonical: string; aliases: string[]; imageUrl: string }> = [
  {
    canonical: 'Bill Gates',
    aliases: ['bill gates', 'bill_gates', 'gates', 'william henry gates iii'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/512px-Bill_Gates_2018.jpg'
  },
  {
    canonical: 'Oprah Winfrey',
    aliases: ['oprah winfrey', 'oprah', 'oprah_gail_winfrey'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Oprah_Winfrey_2014.jpg/512px-Oprah_Winfrey_2014.jpg'
  },
  {
    canonical: 'Kobe Bryant',
    aliases: ['kobe bryant', 'kobe', 'kobe_bean_bryant'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Kobe_Bryant_2019.jpg/512px-Kobe_Bryant_2019.jpg'
  },
  {
    canonical: 'Hayao Miyazaki',
    aliases: ['hayao miyazaki', 'miyazaki', 'miyazaki_hayao'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Hayao_Miyazaki_%282019%29.jpg/512px-Hayao_Miyazaki_%282019%29.jpg'
  },
  {
    canonical: 'Elon Musk',
    aliases: ['elon musk', 'musk', 'elon', 'elon_musk'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Elon_Musk_Royal_Society_%28crop1%29.jpg/512px-Elon_Musk_Royal_Society_%28crop1%29.jpg'
  }
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findVerifiedPerson(name: string): { canonical: string; imageUrl: string } | undefined {
  const key = normalizeName(name).replace(/_/g, ' ');
  for (const person of VERIFIED_PEOPLE) {
    if (normalizeName(person.canonical) === key) return { canonical: person.canonical, imageUrl: person.imageUrl };
    if (person.aliases.some((alias) => normalizeName(alias).replace(/_/g, ' ') === key)) {
      return { canonical: person.canonical, imageUrl: person.imageUrl };
    }
  }
  return undefined;
}

export function getVerifiedPlaceholderImage(): string {
  return VERIFIED_PLACEHOLDER_IMAGE;
}

export async function fetchPersonImage(name: string): Promise<string | undefined> {
  const key = normalizeName(name);
  if (!key) return undefined;
  if (imageCache.has(key)) return imageCache.get(key);

  const verified = findVerifiedPerson(name);
  const image = verified?.imageUrl;
  imageCache.set(key, image);
  return image;
}

export async function searchPeopleWithPhotos(query: string, limit = 6): Promise<PersonOption[]> {
  const q = query.trim();
  if (!q) return [];

  const normalized = normalizeName(q);
  return VERIFIED_PEOPLE
    .filter((person) => {
      const haystack = [person.canonical, ...person.aliases].map((s) => normalizeName(s).replace(/_/g, ' '));
      return haystack.some((text) => text.includes(normalized));
    })
    .slice(0, limit)
    .map((person) => ({
      name: person.canonical,
      imageUrl: person.imageUrl
    }));
}
