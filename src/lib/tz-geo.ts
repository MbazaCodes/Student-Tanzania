// Tanzania Regions → Districts (wards live in gov.schools for the school form)
// Shared list of all 31 regions and their districts for admin assignment.

export const TZ_REGIONS = [
  "Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma",
  "Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza",
  "Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga",
  "Simiyu","Singida","Songwe","Tabora","Tanga","Unguja North","Unguja South","Zanzibar",
];

export const TZ_DISTRICTS: Record<string, string[]> = {
  "Arusha": ["Arusha CC","Arusha DC","Karatu","Longido","Monduli","Ngorongoro"],
  "Dar es Salaam": ["Ilala MC","Kinondoni MC","Temeke MC","Ubungo MC","Kigamboni MC"],
  "Dodoma": ["Dodoma CC","Bahi","Chamwino","Kondoa","Mpwapwa","Chemba","Kongwa"],
  "Geita": ["Geita TC","Bukombe","Chato","Mbogwe","Nyang'hwale"],
  "Iringa": ["Iringa MC","Iringa DC","Kilolo","Mufindi"],
  "Kagera": ["Bukoba MC","Bukoba DC","Biharamulo","Karagwe","Kyerwa","Misenyi","Muleba","Ngara"],
  "Katavi": ["Mpanda MC","Mpanda DC","Mlele"],
  "Kigoma": ["Kigoma-Ujiji MC","Buhigwe","Kakonko","Kasulu","Kibondo","Kigoma DC","Uvinza"],
  "Kilimanjaro": ["Moshi MC","Hai","Moshi DC","Mwanga","Rombo","Same","Siha"],
  "Lindi": ["Lindi MC","Kilwa","Lindi DC","Liwale","Nachingwea","Ruangwa"],
  "Manyara": ["Babati TC","Babati DC","Hanang","Kiteto","Mbulu","Simanjiro"],
  "Mara": ["Musoma MC","Butiama","Musoma DC","Rorya","Serengeti","Tarime"],
  "Mbeya": ["Mbeya CC","Busokelo","Chunya","Mbarali","Mbeya DC","Rungwe"],
  "Morogoro": ["Morogoro MC","Gairo","Ifakara","Kilosa","Kilombero","Malinyi","Morogoro DC","Mvomero","Ulanga"],
  "Mtwara": ["Mtwara-Mikindani MC","Masasi","Mtwara DC","Nanyumbu","Newala","Tandahimba"],
  "Mwanza": ["Mwanza CC","Ilemela MC","Kwimba","Magu","Misungwi","Sengerema","Ukerewe"],
  "Njombe": ["Njombe TC","Ludewa","Makete","Njombe DC","Wanging'ombe"],
  "Pemba North": ["Micheweni","Wete"],
  "Pemba South": ["Chake Chake","Mkoani"],
  "Pwani": ["Bagamoyo","Kibaha TC","Kibaha DC","Kisarawe","Mafia","Mkuranga","Rufiji"],
  "Rukwa": ["Sumbawanga MC","Kalambo","Nkasi","Sumbawanga DC"],
  "Ruvuma": ["Songea MC","Mbinga","Namtumbo","Nyasa","Songea DC","Tunduru"],
  "Shinyanga": ["Shinyanga MC","Kahama TC","Kahama DC","Kishapu","Shinyanga DC"],
  "Simiyu": ["Bariadi TC","Bariadi DC","Busega","Itilima","Maswa","Meatu"],
  "Singida": ["Singida MC","Ikungi","Iramba","Manyoni","Singida DC"],
  "Songwe": ["Momba","Mbozi","Songwe","Tunduma TC"],
  "Tabora": ["Tabora MC","Igunga","Kaliua","Nzega","Sikonge","Tabora DC","Urambo","Uyui"],
  "Tanga": ["Tanga CC","Handeni","Kilindi","Korogwe TC","Korogwe DC","Lushoto","Mkinga","Muheza","Pangani"],
  "Unguja North": ["Kaskazini A","Kaskazini B"],
  "Unguja South": ["Kusini","Kati"],
  "Zanzibar": ["Mjini","Magharibi A","Magharibi B"],
};

// ── Student levels per school type ─────────────────────────────────────────
export const LEVELS_BY_SCHOOL_TYPE: Record<string, string[]> = {
  "Pre-School / Nursery": [
    "Baby Class", "Middle Class", "Pre-Unit (Reception)",
  ],
  "Primary School": [
    "Standard 1", "Standard 2", "Standard 3", "Standard 4",
    "Standard 5", "Standard 6", "Standard 7",
  ],
  "Secondary School": [
    "Form 1", "Form 2", "Form 3", "Form 4",
    "Form 5", "Form 6",
  ],
  "University / College": [
    "Certificate", "Diploma",
    "Year 1", "Year 2", "Year 3", "Year 4", "Year 5",
    "Postgraduate",
  ],
  "Vocational Training": [
    "Level 1", "Level 2", "Level 3",
    "NTA Level 4", "NTA Level 5", "NTA Level 6",
  ],
  "Special Needs School": [
    "Pre-Unit", "Standard 1", "Standard 2", "Standard 3", "Standard 4",
    "Standard 5", "Standard 6", "Standard 7",
    "Form 1", "Form 2", "Form 3", "Form 4",
  ],
};

/** Get the level options for a given school type (falls back to Primary). */
export function levelsForSchoolType(type: string | null | undefined): string[] {
  if (!type) return LEVELS_BY_SCHOOL_TYPE["Primary School"];
  return LEVELS_BY_SCHOOL_TYPE[type] ?? LEVELS_BY_SCHOOL_TYPE["Primary School"];
}
