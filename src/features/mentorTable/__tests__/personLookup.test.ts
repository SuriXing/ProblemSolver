import { afterEach, beforeEach, vi } from 'vitest';

describe('personLookup', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns verified images for known people without hitting the network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { fetchPersonImage } = await import('../personLookup');

    const image = await fetchPersonImage('Bill Gates');

    expect(image).toContain('Bill_Gates');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns MBTI local assets and candidates for MBTI personas', async () => {
    const { fetchPersonImage, fetchPersonImageCandidates } = await import('../personLookup');

    const image = await fetchPersonImage('INTJ');
    const candidates = await fetchPersonImageCandidates('INTJ');

    expect(image).toBe('/assets/mbti/intj.png');
    expect(candidates).toContain('/assets/mbti/intj.png');
    expect(candidates?.some((item) => item.includes('16personalities.com'))).toBe(true);
  });

  it('keeps verified matches ahead of the plain typed fallback option in search results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: { search: [] } })
    }));
    const { searchPeopleWithPhotos } = await import('../personLookup');

    const results = await searchPeopleWithPhotos('bill', 6);

    expect(results[0].name).toBe('Bill Gates');
    expect(results.some((item) => item.name === 'bill')).toBe(true);
    expect(results[0].imageUrl).toContain('Bill_Gates');
  });

  it('filters out wikipedia results that are not likely people or characters', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            search: [
              { title: 'Taylor Swift singles discography' },
              { title: 'Taylor Swift' }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              '1': {
                title: 'Taylor Swift',
                thumbnail: { source: 'https://example.com/taylor.jpg' },
                pageprops: { wikibase_shortdesc: 'American singer-songwriter' }
              }
            }
          }
        })
      });
    vi.stubGlobal('fetch', fetchMock);
    const { searchPeopleWithPhotos } = await import('../personLookup');

    const results = await searchPeopleWithPhotos('Taylor Swift', 6);

    expect(results.some((item) => item.name === 'Taylor Swift singles discography')).toBe(false);
    expect(results.some((item) => item.name === 'Taylor Swift')).toBe(true);
  });
});
