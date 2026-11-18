import type { ArtworkDetails } from "./types";

interface CatalogEntry extends ArtworkDetails {
  keywords: string[];
}

const CATALOG: CatalogEntry[] = [
  {
    keywords: ["starry night"],
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    date: "1889",
    medium: "Oil on canvas",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/800px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
    imageAlt: "The Starry Night painting by Vincent van Gogh",
  },
  {
    keywords: ["mona lisa", "la gioconda"],
    title: "Mona Lisa",
    artist: "Leonardo da Vinci",
    date: "c. 1503\u20131519",
    medium: "Oil on poplar panel",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/640px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    imageAlt: "Mona Lisa portrait by Leonardo da Vinci",
  },
  {
    keywords: ["great wave", "kanagawa"],
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    date: "c. 1831",
    medium: "Woodblock print; ink and color on paper",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/800px-The_Great_Wave_off_Kanagawa.jpg",
    imageAlt: "The Great Wave off Kanagawa woodblock print by Hokusai",
  },
  {
    keywords: ["pearl earring"],
    title: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    date: "c. 1665",
    medium: "Oil on canvas",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/640px-1665_Girl_with_a_Pearl_Earring.jpg",
    imageAlt: "Girl with a Pearl Earring painting by Johannes Vermeer",
  },
];

export function findCatalogArtwork(query: string): ArtworkDetails | null {
  const normalized = query.toLowerCase();
  const entry = CATALOG.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  if (!entry) return null;
  const { keywords: _keywords, ...artwork } = entry;
  return artwork;
}
