import roseImg from "@/assets/plant-rose.jpg";
import sunflowerImg from "@/assets/plant-sunflower.jpg";
import hydrangeaImg from "@/assets/plant-hydrangea.jpg";
import chicoryImg from "@/assets/plant-chicory.jpg";
import trilliumImg from "@/assets/plant-trillium.jpg";
import orchidImg from "@/assets/plant-orchid.jpg";
import monsteraImg from "@/assets/hero-monstera.jpg";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Legendary";

export type Plant = {
  id: string;
  name: string;
  latin: string;
  rarity: Rarity;
  level: number;
  xp: number;
  image: string;
  habitat: string;
  foundAt: string;
  caughtAgo: string;
  notes: string;
  caught: boolean;
};

export const plants: Plant[] = [
  {
    id: "monstera-deliciosa",
    name: "Monstera Deliciosa",
    latin: "Monstera deliciosa",
    rarity: "Uncommon",
    level: 14,
    xp: 66,
    image: monsteraImg,
    habitat: "Tropical urban park",
    foundAt: "Lincoln Park, 52.52° N",
    caughtAgo: "just now",
    notes: "Iconic split leaves. Thrives in dappled light beside high-rises.",
    caught: true,
  },
  {
    id: "crimson-rose",
    name: "Crimson Rose",
    latin: "Rosa gallica",
    rarity: "Common",
    level: 9,
    xp: 40,
    image: roseImg,
    habitat: "Garden hedgerow",
    foundAt: "Cobble Hill, 40.68° N",
    caughtAgo: "2 days ago",
    notes: "Dew clings to its petals at dawn.",
    caught: true,
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    latin: "Helianthus annuus",
    rarity: "Uncommon",
    level: 11,
    xp: 30,
    image: sunflowerImg,
    habitat: "Field margin",
    foundAt: "Prospect Farm, 40.66° N",
    caughtAgo: "4 days ago",
    notes: "Tracks the sun across the sky.",
    caught: true,
  },
  {
    id: "azure-mist",
    name: "Azure Mist",
    latin: "Hydrangea macrophylla",
    rarity: "Rare",
    level: 18,
    xp: 80,
    image: hydrangeaImg,
    habitat: "Coastal cottage garden",
    foundAt: "Montauk dunes, 41.04° N",
    caughtAgo: "1 week ago",
    notes: "Petal color shifts with the soil's pH.",
    caught: true,
  },
  {
    id: "wild-chicory",
    name: "Wild Chicory",
    latin: "Cichorium intybus",
    rarity: "Uncommon",
    level: 7,
    xp: 22,
    image: chicoryImg,
    habitat: "Roadside meadow",
    foundAt: "Old Mill Lane, 41.12° N",
    caughtAgo: "2 weeks ago",
    notes: "Opens at sunrise, closes by midday.",
    caught: true,
  },
  {
    id: "white-trillium",
    name: "White Trillium",
    latin: "Trillium grandiflorum",
    rarity: "Common",
    level: 5,
    xp: 12,
    image: trilliumImg,
    habitat: "Hardwood forest floor",
    foundAt: "Highland Reservoir, 41.34° N",
    caughtAgo: "3 weeks ago",
    notes: "Three petals, three sepals — a forest spring herald.",
    caught: true,
  },
  {
    id: "ladys-slipper",
    name: "Pink Lady's Slipper",
    latin: "Cypripedium acaule",
    rarity: "Legendary",
    level: 0,
    xp: 0,
    image: orchidImg,
    habitat: "Pine understory",
    foundAt: "—",
    caughtAgo: "Undiscovered",
    notes: "A rare orchid that takes years to bloom.",
    caught: false,
  },
];

export const featured = plants[0];

export const rarityClass: Record<Rarity, string> = {
  Common: "bg-moss/10 text-moss",
  Uncommon: "bg-gold text-forest",
  Rare: "bg-forest text-sage",
  Legendary: "bg-gradient-to-r from-gold to-moss text-forest",
};
