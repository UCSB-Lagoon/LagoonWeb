// Ported from Lagoon iOS: Lagoon/Models/Map/CampusBuilding.swift.
// Keep in sync with the iOS source of truth.

export type BuildingCategory =
  | "academic"
  | "dining"
  | "recreation"
  | "housing"
  | "services"
  | "landmark";

export type CampusBuilding = {
  id: string;
  name: string;
  code: string;
  aliases?: string[];
  lat: number;
  lng: number;
  category: BuildingCategory;
};

/**
 * One pin colour, on purpose.
 *
 * Six categories can't be given six colours that separate — coral↔gold is
 * ΔE 0.7 under deuteranopia, and the previous palette had teal↔violet at
 * ΔE 14.4 for *normal* vision. Every pin carries an emoji and a label, so the
 * colour was redundant encoding that implied a distinction the eye couldn't
 * make. `color` is kept on the shape so callers don't change.
 */
const PIN = "var(--color-navy-500)";

export const CATEGORY_META: Record<
  BuildingCategory,
  { label: string; color: string; emoji: string }
> = {
  academic:   { label: "Academic",   color: PIN, emoji: "📘" },
  dining:     { label: "Dining",     color: PIN, emoji: "🍽" },
  recreation: { label: "Recreation", color: PIN, emoji: "🏃" },
  housing:    { label: "Housing",    color: PIN, emoji: "🏠" },
  services:   { label: "Services",   color: PIN, emoji: "🛎" },
  landmark:   { label: "Landmark",   color: PIN, emoji: "📍" },
};

export const CAMPUS_CENTER = { lat: 34.4140, lng: -119.8489 };

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { id: "campbell",     name: "Campbell Hall",                       code: "CAMPB", aliases: ["CAMP","CH"],                        lat: 34.41490, lng: -119.84960, category: "academic" },
  { id: "buchanan",     name: "Buchanan Hall",                       code: "BUCHN", aliases: ["BUCH","BUCHANAN"],                  lat: 34.41340, lng: -119.84820, category: "academic" },
  { id: "south",        name: "South Hall",                          code: "SOUTH", aliases: ["SH","SOUTH HALL"],                  lat: 34.41380, lng: -119.85060, category: "academic" },
  { id: "north",        name: "North Hall",                          code: "NORTH", aliases: ["NH","NORTH HALL"],                  lat: 34.41523, lng: -119.84785, category: "academic" },
  { id: "girvetz",      name: "Girvetz Hall",                        code: "GIRV",  aliases: ["GIRVETZ"],                          lat: 34.41390, lng: -119.84710, category: "academic" },
  { id: "phelps",       name: "Phelps Hall",                         code: "PHELP", aliases: ["PH","PHELPS"],                      lat: 34.41610, lng: -119.84580, category: "academic" },
  { id: "webb",         name: "Webb Hall",                           code: "WEBB",                                                 lat: 34.41530, lng: -119.84680, category: "academic" },
  { id: "broida",       name: "Broida Hall",                         code: "BROID", aliases: ["BROIDA"],                           lat: 34.41540, lng: -119.84970, category: "academic" },
  { id: "chem",         name: "Chemistry Building",                  code: "CHEM",  aliases: ["CHEMISTRY"],                        lat: 34.41500, lng: -119.85120, category: "academic" },
  { id: "engr",         name: "Engineering Sciences",                code: "ESB",   aliases: ["ENGR"],                             lat: 34.41610, lng: -119.84440, category: "academic" },
  { id: "hfh",          name: "Harold Frank Hall",                   code: "HFH",   aliases: ["HAROLD FRANK"],                     lat: 34.41640, lng: -119.84330, category: "academic" },
  { id: "hssb",         name: "Humanities & Social Sciences",        code: "HSSB",                                                 lat: 34.41458, lng: -119.84754, category: "academic" },
  { id: "ilp",          name: "Instructional Development",           code: "ILP",                                                  lat: 34.41490, lng: -119.84450, category: "academic" },
  { id: "ssms",         name: "Social Sciences & Media Studies",     code: "SSMS",                                                 lat: 34.41318, lng: -119.84469, category: "academic" },
  { id: "music",        name: "Music Building",                      code: "MUSIC", aliases: ["MUS"],                              lat: 34.41415, lng: -119.84795, category: "academic" },
  { id: "arts",         name: "Arts Building",                       code: "ARTS",                                                 lat: 34.41304, lng: -119.84928, category: "academic" },
  { id: "library",      name: "Davidson Library",                    code: "LIB",   aliases: ["DAVIDSON","UCSB LIBRARY"],          lat: 34.41399, lng: -119.84552, category: "academic" },
  { id: "storke",       name: "Storke Tower",                        code: "STRKE", aliases: ["STORKE"],                           lat: 34.41160, lng: -119.84720, category: "landmark" },
  { id: "recen",        name: "Recreation Center",                   code: "RECEN", aliases: ["REC","REC CENTER"],                 lat: 34.41460, lng: -119.84280, category: "recreation" },
  { id: "srb",          name: "Student Resource Building",           code: "SRB",                                                  lat: 34.41260, lng: -119.84850, category: "services" },
  { id: "ucen",         name: "UCen",                                code: "UCEN",  aliases: ["UNIVERSITY CENTER"],                lat: 34.41176, lng: -119.84826, category: "services" },
  { id: "dlg",          name: "De La Guerra Dining",                 code: "DLG",   aliases: ["DE LA GUERRA"],                     lat: 34.40990, lng: -119.85540, category: "dining" },
  { id: "ortega",       name: "Ortega Dining",                       code: "ORTEG", aliases: ["ORTEGA"],                           lat: 34.41030, lng: -119.84970, category: "dining" },
  { id: "carrillo",     name: "Carrillo Dining",                     code: "CARRI", aliases: ["CARRILLO"],                         lat: 34.40900, lng: -119.85820, category: "dining" },
  { id: "portola",      name: "Portola Dining",                      code: "PORTO", aliases: ["PORTOLA"],                          lat: 34.41570, lng: -119.84530, category: "dining" },
  { id: "harder",       name: "Harder Stadium",                      code: "STADI", aliases: ["HARDER"],                           lat: 34.41760, lng: -119.85170, category: "recreation" },
  { id: "robgym",       name: "Robertson Gym",                       code: "ROBGY", aliases: ["ROB GYM","ROBERTSON"],              lat: 34.41290, lng: -119.84930, category: "recreation" },
  { id: "thunderdome",  name: "Thunderdome",                         code: "EVNTS", aliases: ["EVENTS CENTER"],                    lat: 34.41160, lng: -119.85040, category: "recreation" },
  { id: "henley",       name: "Henley Gate",                         code: "HENL",  aliases: ["HENLEY"],                           lat: 34.41200, lng: -119.84400, category: "landmark" },
  { id: "manzanita",    name: "Manzanita Village",                   code: "MANZ",  aliases: ["MANZI"],                            lat: 34.41800, lng: -119.84600, category: "housing" },
];

export function searchBuildings(q: string): CampusBuilding[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const nq = norm(q);
  if (!nq) return CAMPUS_BUILDINGS;
  return CAMPUS_BUILDINGS.filter((b) => {
    const hay = [b.name, b.code, ...(b.aliases ?? [])].map(norm).join(" | ");
    return hay.includes(nq);
  });
}
