import "server-only";

import type { MuseumRecord } from "./types";

const MET_API = "https://collectionapi.metmuseum.org/public/collection";
const AIC_API = "https://api.artic.edu/api/v1";
const REQUEST_TIMEOUT_MS = 8000;
const MET_CANDIDATES = 10;
const MET_BATCH_SIZE = 4;
const USER_AGENT = "ArtHistoryAnalysisGenerator/1.0 (+https://github.com/Ramfouru7/art-history-analysis-generator)";
const ONE_DAY = 60 * 60 * 24;

const TITLE_STOPWORDS = new Set(["the", "a", "an", "of", "and", "la", "le", "les", "il", "der", "die", "das"]);
const MAX_EXTRA_TITLE_TOKENS = 2;
/** Words that mark a related but different object (a study, copy, or print after the work). */
const DERIVATIVE_WORDS = new Set(["study", "studies", "sketch", "copy", "after", "detail", "fragment", "reproduction"]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token && !TITLE_STOPWORDS.has(token));
}

/**
 * A record matches only when every meaningful word of the requested title is
 * present and the record title adds at most a couple of extra words. This keeps
 * "Starry Night" from matching "Starry Night and the Astronauts".
 */
function titleMatches(requested: string, candidate: string): boolean {
  const wanted = titleTokens(requested);
  const found = titleTokens(candidate);
  if (wanted.length === 0 || found.length === 0) return false;
  const foundSet = new Set(found);
  if (!wanted.every((token) => foundSet.has(token))) return false;
  const wantedSet = new Set(wanted);
  if (found.some((token) => DERIVATIVE_WORDS.has(token) && !wantedSet.has(token))) return false;
  return found.length - wanted.length <= MAX_EXTRA_TITLE_TOKENS;
}

function artistMatches(requested: string, candidate: string): boolean {
  const wanted = normalize(requested).split(" ").filter((token) => token.length > 1);
  const found = new Set(normalize(candidate).split(" "));
  return wanted.length > 0 && wanted.every((token) => found.has(token));
}

function matchScore(requestedTitle: string, candidateTitle: string): number {
  return normalize(requestedTitle) === normalize(candidateTitle) ? 2 : 1;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...init?.headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: ONE_DAY },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

interface MetObject {
  objectID: number;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  medium: string;
  culture: string;
  period: string;
  creditLine: string;
  objectURL: string;
}

async function searchMet(artist: string, title: string): Promise<MuseumRecord | null> {
  const params = new URLSearchParams({ q: `${artist} ${title}`, hasImages: "true", limit: String(MET_CANDIDATES) });
  const search = await getJson<MetSearchResponse>(`${MET_API}/v1.1/search?${params}`);
  const ids = search?.objectIDs?.slice(0, MET_CANDIDATES) ?? [];
  if (ids.length === 0) return null;

  // Fetch candidates in small batches: the Met rate-limits bursts with HTTP 403.
  const matches: MetObject[] = [];
  for (let start = 0; start < ids.length; start += MET_BATCH_SIZE) {
    const batch = await Promise.all(
      ids.slice(start, start + MET_BATCH_SIZE).map((id) => getJson<MetObject>(`${MET_API}/v1/objects/${id}`)),
    );
    for (const object of batch) {
      if (!object?.isPublicDomain || !(object.primaryImageSmall || object.primaryImage)) continue;
      if (!artistMatches(artist, object.artistDisplayName) || !titleMatches(title, object.title)) continue;
      matches.push(object);
    }
    if (matches.some((object) => matchScore(title, object.title) === 2)) break;
  }
  matches.sort((a, b) => matchScore(title, b.title) - matchScore(title, a.title));

  const best = matches[0];
  if (!best) return null;

  return {
    source: "met",
    sourceName: "The Metropolitan Museum of Art",
    objectId: String(best.objectID),
    objectUrl: best.objectURL || `https://www.metmuseum.org/art/collection/search/${best.objectID}`,
    title: best.title,
    artist: best.artistDisplayName,
    date: best.objectDate || null,
    medium: best.medium || null,
    culture: best.culture || null,
    period: best.period || null,
    creditLine: best.creditLine || null,
    imageUrl: best.primaryImageSmall || best.primaryImage,
    imageAlt: `${best.title} by ${best.artistDisplayName}, from The Metropolitan Museum of Art collection`,
  };
}

interface AicArtwork {
  id: number;
  title: string;
  artist_title: string | null;
  artist_display: string | null;
  date_display: string | null;
  medium_display: string | null;
  place_of_origin: string | null;
  style_title: string | null;
  credit_line: string | null;
  image_id: string | null;
  is_public_domain: boolean;
}

interface AicSearchResponse {
  data: AicArtwork[];
}

const AIC_FIELDS = [
  "id",
  "title",
  "artist_title",
  "artist_display",
  "date_display",
  "medium_display",
  "place_of_origin",
  "style_title",
  "credit_line",
  "image_id",
  "is_public_domain",
].join(",");

async function searchArtInstitute(artist: string, title: string): Promise<MuseumRecord | null> {
  const params = new URLSearchParams({ q: `${artist} ${title}`, limit: "15", fields: AIC_FIELDS });
  const search = await getJson<AicSearchResponse>(`${AIC_API}/artworks/search?${params}`, {
    headers: { "AIC-User-Agent": "art-history-analysis-generator" },
  });

  const matches = (search?.data ?? [])
    .filter((item) => item.is_public_domain && Boolean(item.image_id))
    .filter((item) => artistMatches(artist, item.artist_title ?? item.artist_display ?? ""))
    .filter((item) => titleMatches(title, item.title))
    .sort((a, b) => matchScore(title, b.title) - matchScore(title, a.title));

  const best = matches[0];
  if (!best?.image_id) return null;
  const artistName = best.artist_title ?? best.artist_display ?? artist;

  return {
    source: "aic",
    sourceName: "Art Institute of Chicago",
    objectId: String(best.id),
    objectUrl: `https://www.artic.edu/artworks/${best.id}`,
    title: best.title,
    artist: artistName,
    date: best.date_display,
    medium: best.medium_display,
    culture: best.place_of_origin,
    period: best.style_title,
    creditLine: best.credit_line,
    imageUrl: `https://www.artic.edu/iiif/2/${best.image_id}/full/843,/0/default.jpg`,
    imageAlt: `${best.title} by ${artistName}, from the Art Institute of Chicago collection`,
  };
}

/**
 * Looks up a public-domain image for the requested artwork. The Met Open Access
 * collection is checked first; the Art Institute of Chicago is a fallback.
 * Returns null rather than guessing when no record matches both artist and title.
 */

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsPage {
  pageid: number;
  title: string;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, CommonsPage>;
  };
}

async function searchWikimediaCommons(
  artist: string,
  title: string,
): Promise<MuseumRecord | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap "${title}" ${artist}`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "843",
    format: "json",
    origin: "*",
  });

  const search = await getJson<CommonsSearchResponse>(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  );

  const pages = Object.values(search?.query?.pages ?? {});

  const matches = pages
    .filter((page) => {
      const fileTitle = page.title.replace(/^File:/i, "");
      return (
        titleTokens(title).every((token) =>
          titleTokens(fileTitle).includes(token),
        ) &&
        artistMatches(artist, fileTitle) &&
        Boolean(page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url)
      );
    });

  const best = matches[0];
  const image = best?.imageinfo?.[0];

  if (!best || !image) return null;

  const metadata = image.extmetadata ?? {};

  return {
    source: "commons",
    sourceName: "Wikimedia Commons",
    objectId: String(best.pageid),
    objectUrl: image.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, "_"))}`,
    title,
    artist,
    date: null,
    medium: null,
    culture: null,
    period: null,
    creditLine:
      metadata.Credit?.value ||
      metadata.Artist?.value ||
      metadata.LicenseShortName?.value ||
      "Wikimedia Commons",
    imageUrl: image.thumburl || image.url || "",
    imageAlt: `${title} by ${artist}, image from Wikimedia Commons`,
  };
}
export async function findMuseumArtwork(artist: string, title: string): Promise<MuseumRecord | null> {
  const met = await searchMet(artist, title);
  if (met) return met;

  const aic = await searchArtInstitute(artist, title);
  if (aic) return aic;

  return searchWikimediaCommons(artist, title);
}
