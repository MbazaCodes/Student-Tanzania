import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, BadgeCheck, BadgeX, Copy, Pencil, Trash2, StickyNote, KeyRound, Upload } from "lucide-react";
import { BulkUpload } from "@/components/tsid/bulk-upload";

export const Route = createFileRoute("/_authenticated/gov/schools")({ component: Page });

type SchoolType = string;

const SCHOOL_TYPES: SchoolType[] = [
  "Pre-School / Nursery",
  "Primary School",
  "Secondary School",
  "University / College",
  "Vocational Training",
  "Special Needs School",
];

// Tanzania Regions → Districts → Wards
const TZ_GEO: Record<string, Record<string, string[]>> = {
  "Arusha": {
    "Arusha CC": ["Elerai","Engutoto","Kati","Kimandolu","Levolosi","Muriet","Nessuit","Ngarenaro","Olasiti","Sekei","Sokon I","Sokon II","Themi","Unga Limited","Uwanja wa Ndege"],
    "Arusha DC": ["Bwawani","Ilkiurei","Kimnyaki","Kiranyi","Kiserian","Lekitatu","Maroroni","Mlangarini","Moshono","Mwandet","Nduruma","Ngarenanyuki","Oldonyosambu","Olmolog","Oltrumet","Osunyai","Poli","Qarus","Seliani","Sura","Tml"],
    "Karatu": ["Buger","Endabash","Endamaghang","Galappo","Karatu","Kilimatembo","Kansay","Mangola","Mbulumbulu","Quiloto","Rhotia","Tloma"],
    "Longido": ["Gelai Bomba","Gelai Lumbwa","Kimokouwa","Lengijave","Matale","Mifugo","Mundarara","Naberera","Ngereyani","Oltepesi","Orng'arwa","Pakasi","Tingatinga"],
    "Monduli": ["Engare Nairobi","Esilalei","Lolkisale","Makuyuni","Manyara","Monduli","Monduli Juu","Mto wa Mbu","Naitolia","Selela"],
    "Ngorongoro": ["Alailelai","Digodigo","Endulen","Kakesio","Loosoito","Maaloni","Malambo","Mateves","Nainokanoka","Ndutu","Ng'iresi","Ngorongoro","Olbalbal","Oloirien","Olpiro","Olyoirobi","Piyaya","Sale"],
  },
  "Dar es Salaam": {
    "Ilala MC": ["Buguruni","Chang'ombe","Charambe","Gerezani","Ilala","Jangwani","Kariakoo","Kisutu","Kitunda","Kivukoni","Mchikichini","Msongola","Mtambani","Vingunguti"],
    "Kinondoni MC": ["Bonyokwa","Bunju","Goba","Kawe","Kibamba","Kigogo","Kijitonyama","Kinondoni","Kunduchi","Kwembe","Mabibo","Magomeni","Makuburi","Makurumla","Manzese","Mbezi","Mburahati","Mwananyamala","Ndugumbi","Oysterbay","Tandale","Ubungo","Wazo"],
    "Temeke MC": ["Azimio","Chamazi","Chang'ombe","Charambe","Keko","Kibondemaji","Kigamboni","Kurasini","Mbagala","Mjimwema","Mtoni","Pemba Mnazi","Sandali","Somangira","Temeke","Toangoma","Tupendane","Yombo Vituka"],
    "Ubungo MC": ["Goba","Kibamba","Kimara","Kwembe","Mbezi","Saranga","Sinza","Ubungo"],
    "Kigamboni MC": ["Kigamboni","Kibondemaji","Mjimwema","Somangira","Tuangoma","Kibamba"],
  },
  "Dodoma": {
    "Dodoma CC": ["Chalinze","Chang'ombe","Dodoma Urban","Ipagala","Kikuyu","Kikombo","Kilimani","Kisasa","Makole","Makorora","Mbwanga","Msalato","Mtumba","Muungano","Nzuguni"],
    "Bahi": ["Bahi","Chipanga","Handali","Ikoja","Ilolo","Itiso","Kibakwe","Kigwe","Makang'wa","Mbalawala","Mpamantwa","Msisi","Mundemu"],
    "Chamwino": ["Buigiri","Chamwino","Chipanga","Galigali","Ikowa","Ihumwa","Ipala","Isanga","Makutopora","Matumbulu","Nala","Nzasa","Seriani"],
    "Kondoa": ["Bereko","Bolisa","Bumbuta","Haubi","Itololo","Kiberashi","Kikore","Kinango","Kolo","Kondoa","Lalaji","Masange","Mondo","Mrijo Chini"],
    "Mpwapwa": ["Berege","Chipogoro","Chunyu","Godegode","Kibakwe","Kifimbo","Mima","Mpwapwa","Rudi","Wotta"],
  },
  "Geita": {
    "Geita TC": ["Butimba","Geita","Ilemela","Kalangalala","Katoro","Lubaga"],
    "Bukombe": ["Bukombe","Iponjola","Ushirombo","Uswagwa"],
    "Chato": ["Bwanga","Chato","Ilemela","Katoro","Murutunguru"],
    "Mbogwe": ["Bulyanhulu","Iyenze","Karumo","Mbogwe","Nyangh'wale"],
    "Nyang'hwale": ["Idukilo","Mwingiro","Nyang'hwale","Nyantira"],
  },
  "Iringa": {
    "Iringa MC": ["Idodi","Ifunda","Ilula","Iringa Urban","Kalenga","Kilolo","Mafinga","Mtwivila","Nduli","Pawaga","Tosamaganga"],
    "Iringa DC": ["Idodi","Ifunda","Kalenga","Kilolo","Mafinga","Mtwivila","Nduli","Pawaga"],
    "Kilolo": ["Idete","Kilolo","Kimala","Kiponzelo","Magulilwa","Mahenge","Mfrikano","Mseke","Munisagara","Mwembe","Tagamenda","Uhafiwa"],
    "Mufindi": ["Ifwagi","Igomaa","Ikangaivwi","Imalinyi","Kasanga","Mafinga","Mbalamaziwa","Mdabulo","Mgololo","Mtwango","Mufindi","Ruaha"],
  },
  "Kagera": {
    "Bukoba MC": ["Bukoba","Butuja","Hamugembe","Kahororo","Kibeta","Korera","Lugalo","Maruku","Nyakishaka"],
    "Bukoba DC": ["Butayunja","Kabirizi","Katerero","Kibuyuni","Kyamulaile","Maruku","Nshamba","Rubale","Ruhunga"],
    "Biharamulo": ["Biharamulo","Bukiriro","Buyaga","Kayenzi","Lusahunga","Muganza","Murutunguru","Nyantakara","Runazi"],
    "Karagwe": ["Bugomora","Bweranyange","Ihembe","Iyobozi","Kayanga","Kerenge","Kibale","Kituntu","Maruku","Murongo"],
    "Kyerwa": ["Bugomora","Chonyonyo","Kaisho","Kanoni","Mataba","Murongo","Nyakabanga","Nyakayanja","Ruziba"],
    "Misenyi": ["Bunazi","Kabango","Kafunzo","Kakunyu","Kashai","Kyaka","Minziro","Rulenge"],
    "Muleba": ["Buhendangabo","Bujugo","Bubeke","Bwanjai","Ibuga","Ijumbi","Kagoma","Kasharu","Kibingo","Muleba","Nshamba","Nyabionza"],
    "Ngara": ["Benaco","Bugarama","Kasulo","Kibimba","Kinazi","Muganza","Murongo","Nkora","Rulenge","Rusumo"],
  },
  "Katavi": {
    "Mpanda MC": ["Kakese","Mpanda","Inyonga","Mishamo"],
    "Mpanda DC": ["Inyonga","Karema","Kipili","Laela","Mishamo","Mpanda","Nsimbo"],
    "Mlele": ["Katumba","Mamba","Mlele","Mpanda","Nsimba"],
  },
  "Kigoma": {
    "Kigoma-Ujiji MC": ["Gungu","Kagera","Kigoma","Nkuruma","Remera","Ujiji"],
    "Buhigwe": ["Buhigwe","Muyama","Nguruka","Uvinza"],
    "Kakonko": ["Kakonko","Kasanda","Mugunzu","Nyamtukuza","Rugongwe"],
    "Kasulu": ["Kasulu","Kibondo","Manyovu","Murgwanza","Nyarugusu"],
    "Kibondo": ["Kibondo","Kumsenga","Mugunzu","Nyarugusu","Rugombo"],
    "Kigoma DC": ["Buhingu","Kigoma","Kigoma Kasimba","Mwandiga","Ujiji"],
    "Uvinza": ["Ilagala","Igalula","Simbo","Uvinza","Vikonge"],
  },
  "Kilimanjaro": {
    "Moshi MC": ["Kaloleni","Kiboriloni","Kimanthi","Longuo A","Longuo B","Mawenzi","Mjini","Rau","Shantytown","Soweto"],
    "Hai": ["Bomang'ombe","Boma la Ng'ombe","Machame","Masama","Mbokomu","Moshi","Nkuu","Old Moshi","Sanya Juu"],
    "Moshi DC": ["Kirua Vunjo","Longuo","Mamba","Moshi","Old Moshi","Uru","Vunjo"],
    "Mwanga": ["Kihurio","Lembeni","Mwanga","Ngujini","Rundugai","Same"],
    "Rombo": ["Boro","Holili","Keni","Kiboriloni","Mkuu","Rombo","Useri"],
    "Same": ["Chome","Goha","Hedaru","Kihurio","Kisiwani","Lembeni","Makanya","Mamba","Same","Toloha"],
    "Siha": ["Kishisha","Longuo","Sanya","Siha","Soko"],
  },
  "Lindi": {
    "Lindi MC": ["Lindi","Chikundi","Mitwero","Ndoro","Rasbura"],
    "Kilwa": ["Kilwa Kisiwani","Kilwa Kivinje","Kilwa Masoko","Nangurukuru","Njinjo","Nkowe","Somanga"],
    "Lindi DC": ["Chikonji","Kiranjeranje","Lindi","Mandawa","Mnolela","Mtama","Mwenge","Nyangao"],
    "Liwale": ["Liwale","Nalasi","Nawenge","Ngarama","Ngongowele"],
    "Nachingwea": ["Chimbuko","Kilimarondo","Mahiwa","Nachingwea","Naikiu","Nanganga","Namalenga","Ruponda"],
    "Ruangwa": ["Chienjere","Mlawe","Nandonde","Nanganga","Ruangwa","Rushwa"],
  },
  "Manyara": {
    "Babati TC": ["Babati","Dareda","Gallapo","Madunga","Managhat","Mwada","Ndalat","Ufana"],
    "Babati DC": ["Bashnet","Dabil","Dareda","Gallapo","Gichameda","Haraa","Magugu","Magungu","Managhat","Mbuguni","Mwada","Ndalat","Seloto"],
    "Hanang": ["Basotu","Dabil","Endasak","Gawal","Gidahababieg","Hirbadaw","Katesh","Mureru","Nangwa","Simbay"],
    "Kiteto": ["Dosidosi","Engusero","Kibaya","Kimotorok","Laiseri","Lengatei","Ngorika","Songambele"],
    "Mbulu": ["Balaaa","Daudi","Dongobesh","Gehandu","Hadza","Haydom","Ilkiushu","Karatu","Labay","Maretadu","Mbulu","Seloto"],
    "Simanjiro": ["Emboret","Kimotorok","Loiborsireet","Makuyuni","Msitu wa Tembo","Naberera","Ngage","Ngurunit","Nkoaranga","Orkesumet","Sukuro"],
  },
  "Mara": {
    "Musoma MC": ["Buhare","Iringo","Makoko","Mugango","Musoma","Nyakato","Nyamagana"],
    "Butiama": ["Butiama","Kisangura","Komarera","Kyandege","Mugeta","Nyichoka","Rorya"],
    "Musoma DC": ["Bunda","Kiabakari","Mugumo","Musoma","Nyakanga","Obulangeti","Roche"],
    "Rorya": ["Kowak","Mchauru","Mugango","Nyamwaga","Rorya","Shirati"],
    "Serengeti": ["Mugumu","Nata","Nyamuma","Robanda","Isenye","Mbiso"],
    "Tarime": ["Borega","Gorong'a","Kemathe","Kerende","Kiserogota","Nyansincha","Sirari","Tarime","Turwa"],
  },
  "Mbeya": {
    "Mbeya CC": ["Forest","Iyela","Jacaranda","Kalobe","Lwanjilo","Mbeya","Mwanjelwa","Nsalaga","Sisimba","Uyole"],
    "Busokelo": ["Ipinda","Kabula","Lufilyo","Masoko","Ngosi","Rungwe"],
    "Chunya": ["Chunya","Ifumbo","Lupa","Mtanila","Ngwala","Songwe"],
    "Mbarali": ["Chimala","Igurusi","Itagata","Mbarali","Rujewa","Utengule Usongwe"],
    "Mbeya DC": ["Inyala","Iwindi","Lufubu","Mbeya","Mwansekwa","Nsalaga","Ulenje"],
    "Rungwe": ["Ibula","Isongole","Kiwira","Makwale","Mwakaleli","Nkuka","Rungwe","Tukuyu"],
  },
  "Morogoro": {
    "Morogoro MC": ["Bigwa","Bonde","Chamwino","Kilakala","Kichangani","Kihonda","Kingolwira","Kiroka","Mazimbu","Mji Mkuu","Mwembesongo","Sabasaba","Saba Saba"],
    "Gairo": ["Gairo","Idibo","Ilakala","Itiso","Nongwe","Rudewa","Ulaya"],
    "Ifakara": ["Ifakara","Igima","Katindiuka","Lupiro","Minepa","Mlimba"],
    "Kilosa": ["Dumila","Kilosa","Kimamba","Mikumi","Msowero","Rudewa","Ulaya"],
    "Kilombero": ["Ifakara","Mwaya","Sanje"],
    "Malinyi": ["Malinyi","Mbogo","Mlimba"],
    "Morogoro DC": ["Kiroka","Mzumbe","Ngerengere","Mkuyuni","Mvomero"],
    "Mvomero": ["Hembeti","Kibati","Kigugu","Mziha","Turiani"],
    "Ulanga": ["Kilosa","Lupiro","Mahenge","Malinyi","Msogezi","Vigoi"],
  },
  "Mtwara": {
    "Mtwara-Mikindani MC": ["Chikongola","Mtwara","Mikindani","Shangani","Magomeni"],
    "Masasi": ["Chiwale","Chiungutwa","Luchelegwa","Masasi","Mbua","Mchauru","Mihambwe","Mtama","Nanyamba","Ruponda"],
    "Mtwara DC": ["Dihimba","Kitangari","Lulindi","Mkomaindo","Namanga","Ntomoko","Rwelu"],
    "Nanyumbu": ["Lukuledi","Mkangala","Nanyumbu","Naumbu","Ntomoko"],
    "Newala": ["Chichiwe","Mahuta","Namikupa","Newala","Ntomoko","Ntwari","Pemba"],
    "Tandahimba": ["Chiponda","Luchelegwa","Mkomaindo","Mnacho","Namikupa","Nanyamba","Tandahimba"],
  },
  "Mwanza": {
    "Mwanza CC": ["Bugando","Buswelu","Butimba","Igogo","Ilemela","Kirumba","Kitangiri","Lwanhima","Mbugani","Mkuyuni","Nyamagana","Pamba","Pasiansi","Shibula"],
    "Ilemela MC": ["Bugando","Ilemela","Kirumba","Lwanhima","Mkuyuni","Nyamagana","Shibula"],
    "Kwimba": ["Bupamwa","Dutwa","Hungumalwa","Kikoa","Lubiri","Magu","Nkome","Sumve"],
    "Magu": ["Kabila","Lubiri","Magu","Nyigamba","Shishiyu","Sumve"],
    "Misungwi": ["Igokelo","Kijima","Magu","Misungwi","Ngudu","Nyamilama"],
    "Sengerema": ["Busisi","Igara","Nyampande","Nyehunge","Sengerema"],
    "Ukerewe": ["Bwiro","Kagunguli","Murutunguru","Namagondo","Nkilizya","Ukara","Ukerewe"],
  },
  "Njombe": {
    "Njombe TC": ["Njombe","Igagala","Imalinyi","Lupembe","Makambako"],
    "Ludewa": ["Ludewa","Manda","Mlangali","Mkiu","Iyayi"],
    "Makete": ["Bulongwa","Iwela","Kindamba","Makete","Mapanda"],
    "Njombe DC": ["Igagala","Imalinyi","Lupembe","Makambako","Njombe"],
    "Wanging'ombe": ["Imalinyi","Igima","Mdandu","Ulembwe","Wanging'ombe"],
  },
  "Pemba North": {
    "Micheweni": ["Chambani","Konde","Maziwa Ng'ombe","Mgogoni","Micheweni","Njuguni","Wingwi"],
    "Wete": ["Gando","Kinyasini","Kojani","Maziwa Ng'ombe","Ole","Pujini","Wete"],
  },
  "Pemba South": {
    "Chake Chake": ["Chake Chake","Madungu","Makombeni","Mchanga Mdogo","Pujini","Vitongoji","Ziwani"],
    "Mkoani": ["Chole","Kengeja","Kichunguu","Kiuyu","Mkoani","Ole","Pujini","Wawi"],
  },
  "Pwani": {
    "Bagamoyo": ["Bagamoyo","Dunda","Kaole","Kerege","Kiromo","Miono","Msata","Zinga"],
    "Kibaha TC": ["Kibaha","Kwala","Mlandizi","Msata"],
    "Kibaha DC": ["Kibaha","Mlandizi","Msata","Ruvu"],
    "Kisarawe": ["Kisewe","Kisarawe","Kurui","Makurunge","Mtamba","Vikumburu"],
    "Mafia": ["Bweni","Jibondo","Juani","Kilindoni","Kirongwe","Kiegeani"],
    "Mkuranga": ["Kibiti","Mkuranga","Msanga","Mtawanya","Vikindu"],
    "Rufiji": ["Ikwiriri","Kibiti","Mohoro","Mwaseni","Nyamisati","Utete"],
  },
  "Rukwa": {
    "Sumbawanga MC": ["Ilemba","Kala","Katazi","Kipande","Kirando","Nkundi","Sumbawanga"],
    "Kalambo": ["Kirando","Laela","Matai","Ninde","Nkweto","Nzovwe","Titye"],
    "Nkasi": ["Chala","Ilemba","Kirando","Nkasi","Wampembe"],
    "Sumbawanga DC": ["Chapota","Ilemba","Katazi","Kipande","Sumbawanga","Nkundi"],
  },
  "Ruvuma": {
    "Songea MC": ["Mfaranyaki","Mji Mpya","Mjimwema","Songea","Ruhuwiko"],
    "Mbinga": ["Kigonsera","Litembo","Mbamba Bay","Mbinga","Mkongo","Mtiri","Muungano"],
    "Namtumbo": ["Gumbiro","Kihagara","Madaba","Namtumbo","Namabengo"],
    "Nyasa": ["Liuli","Mbamba Bay","Mkenda","Mkongo","Nyasa"],
    "Songea DC": ["Gumbiro","Kigonsera","Madaba","Songea","Ruhuwiko"],
    "Tunduru": ["Nakapanya","Nalasi","Namtumbo","Tunduru"],
  },
  "Shinyanga": {
    "Shinyanga MC": ["Kambarage","Kizumbi","Lubaga","Malagarasi","Mjini","Sabasaba","Shinyanga"],
    "Kahama TC": ["Isaka","Kahama","Kaseme","Mwakitolyo","Nzega"],
    "Kahama DC": ["Bugarama","Isaka","Kahama","Lunguya","Masunga","Ndolage","Nzega","Salawe"],
    "Kishapu": ["Ihanda","Kishapu","Mwamapalala","Mwanangwa","Ndagalu","Tinde"],
    "Shinyanga DC": ["Ikungu","Kambarage","Mwadui","Samuye","Utemini","Usanda"],
  },
  "Simiyu": {
    "Bariadi TC": ["Bariadi","Isanga","Lalago","Mwabayanda","Mwanjolo"],
    "Bariadi DC": ["Bariadi","Isanga","Lalago","Mwabayanda","Mwanjolo","Nguliguli"],
    "Busega": ["Badi","Busega","Dutwa","Lugata","Maliti","Mwamashimba"],
    "Itilima": ["Bariadi","Itilima","Mwanhuzi","Ntuzu","Seke"],
    "Maswa": ["Gumali","Isaka","Kinangiri","Malampaka","Maswa","Mwanhuzi","Nguliguli"],
    "Meatu": ["Dutwa","Mwabayanda","Mwanjolo","Nkula","Nguliguli","Tinde"],
  },
  "Singida": {
    "Singida MC": ["Iguguno","Ikungi","Ilongero","Isimani","Puna","Singida"],
    "Ikungi": ["Iguguno","Ikungi","Ilongero","Isimani","Mungaa","Nkinto"],
    "Iramba": ["Iguguno","Iramba","Kiomboi","Mwanga","Ntuntu"],
    "Manyoni": ["Itigi","Kintinku","Manyoni","Mkwese","Nkinto","Sanjaranda"],
    "Singida DC": ["Ilongero","Isimani","Mungaa","Puma","Singida","Unyihe"],
  },
  "Songwe": {
    "Momba": ["Chinya","Ivuna","Kapele","Kaseye","Momba","Ndaga"],
    "Mbozi": ["Ihanda","Isangati","Kayula","Mbozi","Mlowo","Nteba","Vwawa"],
    "Songwe": ["Mlowo","Songwe","Vwawa"],
    "Tunduma TC": ["Lupa","Manda","Mlowo","Tunduma"],
  },
  "Tabora": {
    "Tabora MC": ["Cheyo","Gongoni","Ipuli","Isevya","Kampisakatoto","Kanyenye","Mtendeni","Ng'ambo","Tumbi"],
    "Igunga": ["Igunga","Igurubi","Mwanzugi","Ndevelwa","Nzega"],
    "Kaliua": ["Inyonga","Kaliua","Kamsamba","Ukumbi"],
    "Nzega": ["Itobo","Ndevelwa","Nzega","Puge"],
    "Sikonge": ["Igalula","Itigi","Sikonge","Mwese"],
    "Tabora DC": ["Cheyo","Kampisakatoto","Kanyenye","Tumbi","Utemini"],
    "Urambo": ["Ichemba","Kaliua","Ulyankulu","Urambo"],
    "Uyui": ["Igalula","Isevya","Itembo","Mbugwe","Uyui"],
  },
  "Tanga": {
    "Tanga CC": ["Chumbageni","Duga","Makorora","Marungu","Maweni","Mzingani","Ngamiani","Pongwe","Rangi","Tanga"],
    "Handeni": ["Handeni","Kwamasimba","Kideleko","Misozwe","Mgambo","Sindeni"],
    "Kilindi": ["Handeni","Kigombe","Kilindi","Lushoto","Mgambo"],
    "Korogwe TC": ["Korogwe","Makorora","Maweni","Mazinde"],
    "Korogwe DC": ["Bungu","Korogwe","Magamba","Maweni","Mazinde","Mkumbara"],
    "Lushoto": ["Gare","Lushoto","Magamba","Mlalo","Mtae","Soni","Sunga"],
    "Mkinga": ["Daluni","Kasera","Mkinga","Muungano","Ngomeni"],
    "Muheza": ["Amani","Maramba","Mkinga","Muheza","Ndola","Tongwe"],
    "Pangani": ["Bweni","Kabuku","Kipumbwi","Mkwaja","Pangani","Ushongo"],
  },
  "Unguja North": {
    "Kaskazini A": ["Donge","Kijini","Mkwajuni","Nungwi","Tumbatu"],
    "Kaskazini B": ["Matemwe","Mkwajuni","Pwani Mchangani","Tumbatu"],
  },
  "Unguja South": {
    "Kusini": ["Chwaka","Fumba","Kibele","Kiongoni","Koani","Muyuni","Paje","Uzini"],
    "Kati": ["Bwejuu","Charawe","Dunga","Chwaka","Mkokotoni","Muyuni"],
  },
  "Zanzibar": {
    "Mjini": ["Fundo","Gulioni","Kikwajuni","Kisiwandui","Kivunge","Magogoni","Mchangani","Mchauru","Mji Mkongwe","Mlandege","Ng'ambo","Shangani","Stone Town","Vikokotoni"],
    "Magharibi A": ["Bububu","Fuoni","Imbomba","Kizenga","Mwanakwerekwe","Mwera","Tumbe"],
    "Magharibi B": ["Chuini","Fuoni","Imbomba","Kiembe Samaki","Mwanakwerekwe","Tumbe"],
  },
};

const REGION_PREFIX: Record<string, string> = {
  "Dar es Salaam":"DS","Arusha":"AR","Mbeya":"MB","Dodoma":"DO","Mwanza":"MW",
  "Tanga":"TG","Morogoro":"MO","Kagera":"KG","Kigoma":"KI","Lindi":"LD",
  "Mara":"MR","Mtwara":"MT","Pwani":"PW","Rukwa":"RK","Shinyanga":"SH",
  "Singida":"SG","Tabora":"TB","Geita":"GT","Katavi":"KV","Njombe":"NJ",
  "Simiyu":"SM","Songwe":"SW","Ruvuma":"RV","Iringa":"IR","Kilimanjaro":"KL",
  "Manyara":"MY","Pemba North":"PN","Pemba South":"PS","Unguja North":"UN",
  "Unguja South":"US","Zanzibar":"ZB",
};

function genCode(region: string) {
  const prefix = REGION_PREFIX[region] ?? region.slice(0,2).toUpperCase();
  return `${prefix}${Math.floor(1000 + Math.random()*9000)}`;
}
function genPassword() {
  return "sc" + Math.random().toString(36).slice(2,8).toUpperCase() + "!";
}

function Page() {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const [open, setOpen] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ["gov-schools"],
    queryFn: async () => (await supabase.from("schools").select("school_code,school_name,type,region,district,ward,cred_username,status,notes,auth_uid,email").order("school_name")).data ?? [],
  });

  async function toggleStatus(code: string, currentStatus: string) {
    const next = currentStatus === "active" ? "suspended" : "active";
    const { error } = await supabase.from("schools").update({ status: next }).eq("school_code", code);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["gov-schools"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Schools</h1>
          <p className="text-sm text-muted-foreground">Register institutions and issue their admin credentials.</p>
        </div>
        <div className="flex gap-2">
        <BulkSchoolUpload actorName={me.fullName ?? "Gov Admin"} me={me} onDone={() => qc.invalidateQueries({ queryKey: ["gov-schools"] })} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="h-4 w-4 mr-2" /> Register school</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register New School</DialogTitle></DialogHeader>
            <RegisterSchoolForm
              actorName={me.fullName ?? "Gov Admin"}
              onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["gov-schools"] }); }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total schools", value: schools.length },
          { label: "Active", value: schools.filter((s) => s.status === "active").length },
          { label: "Suspended", value: schools.filter((s) => s.status !== "active").length },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-4">
            <div className="text-2xl font-bold">{t.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Registered schools ({schools.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">School</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.school_code} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{s.school_code}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.school_name}</div>
                    <div className="text-xs text-muted-foreground">{s.type}</div>
                    {s.notes && <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1"><StickyNote className="h-3 w-3 mt-0.5 shrink-0" />{s.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.region}{s.district ? ` · ${s.district}` : ""}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.cred_username}</td>
                  <td className="px-4 py-3">
                    {s.status === "active"
                      ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold"><BadgeCheck className="h-3.5 w-3.5" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><BadgeX className="h-3.5 w-3.5" /> {s.status}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(s.school_code, s.status)} title={s.status === "active" ? "Suspend" : "Activate"}>
                        {s.status === "active" ? <BadgeX className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                      </Button>
                      {/* Reset password — available to all gov admins (scope-enforced server-side) */}
                      <ResetSchoolPassword school={s} />
                      {/* Edit + delete — National only */}
                      {me.tier === 0 && (
                        <SchoolActions school={s} actorName={me.fullName ?? "Gov Admin"}
                          onChange={() => qc.invalidateQueries({ queryKey: ["gov-schools"] })} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No schools registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegisterSchoolForm({ actorName, onDone }: { actorName: string; onDone: () => void }) {
  const [name, setName]         = useState("");
  const [type, setType]         = useState<SchoolType>("Primary School");
  const [category, setCategory] = useState<"normal" | "special" | "hardship">("normal");
  const [region, setRegion]     = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard]         = useState("");
  const [address, setAddress]   = useState("");
  const [contact, setContact]   = useState("");
  const [email, setEmail]       = useState("");
  const [code, setCode]         = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(genPassword());
  const [loading, setLoading]   = useState(false);
  const [issued, setIssued]     = useState<{ code: string; username: string; password: string } | null>(null);

  // Derived cascades
  const districts = region ? Object.keys(TZ_GEO[region] ?? {}) : [];
  const wards     = (region && district) ? (TZ_GEO[region]?.[district] ?? []) : [];

  function onRegionChange(r: string) {
    setRegion(r);
    setDistrict("");
    setWard("");
    if (!code) setCode(genCode(r));
  }

  function onDistrictChange(d: string) {
    setDistrict(d);
    setWard("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !region || !district || !ward || !code || !username || !password) {
      toast.error("Fill all required fields."); return;
    }
    // username is the login email — must be a valid email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      toast.error("Login email (Username) must be a valid email address."); return;
    }
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("create-school", {
      body: {
        school_code: code, school_name: name, type, region, district, ward,
        category, fee_exempt: category !== "normal",
        address: address || null,
        phone: contact || null,
        email: username,        // login email
        password,
      },
    });

    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as { context?: { body?: unknown } }).context;
        if (ctx?.body) { const pr = typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body; if (pr?.error) msg = pr.error; }
      } catch { /* keep */ }
      toast.error(msg); setLoading(false); return;
    }
    if (data?.error) { toast.error(data.error); setLoading(false); return; }

    setLoading(false);
    setIssued({ code, username, password });
    toast.success(`School ${code} registered!`);
  }

  if (issued) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 text-sm mb-3">✅ Credentials</div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">School Code</span><strong className="text-primary">{issued.code}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Login Email</span><strong>{issued.username}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Password</span><strong>{issued.password}</strong></div>
          </div>
          <Button className="mt-4 w-full" onClick={() => {
            navigator.clipboard.writeText(`School Code: ${issued.code}\nLogin Email: ${issued.username}\nPassword: ${issued.password}`);
            toast.success("Credentials copied!");
          }}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
        </div>
        <Button variant="outline" className="w-full" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">

        {/* Institution Type */}
        <div className="col-span-2 space-y-1.5">
          <Label>Institution Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Fee-exemption category */}
        <div className="col-span-2 space-y-1.5">
          <Label>School Category *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Shule ya Kawaida / Normal School</SelectItem>
              <SelectItem value="special">Shule Maalum / Special School (free services)</SelectItem>
              <SelectItem value="hardship">Shule ya Mazingira Magumu / Hardship Environment (free services)</SelectItem>
            </SelectContent>
          </Select>
          {category !== "normal" && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ All students in this school will receive free letter services.
            </p>
          )}
        </div>

        {/* School Name */}
        <div className="col-span-2 space-y-1.5">
          <Label>School Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        {/* Region */}
        <div className="col-span-2 space-y-1.5">
          <Label>Region *</Label>
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
            <SelectContent>
              {Object.keys(TZ_GEO).sort().map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* District — only enabled after region selected */}
        <div className="space-y-1.5">
          <Label>District *</Label>
          <Select value={district} onValueChange={onDistrictChange} disabled={!region}>
            <SelectTrigger>
              <SelectValue placeholder={region ? "Select district" : "Select region first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Ward — only enabled after district selected */}
        <div className="space-y-1.5">
          <Label>Ward *</Label>
          <Select value={ward} onValueChange={setWard} disabled={!district}>
            <SelectTrigger>
              <SelectValue placeholder={district ? "Select ward" : "Select district first"} />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Address & Contact */}
        <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Contact Phone</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+255 7XX XXX XXX" /></div>
        <div className="col-span-2 space-y-1.5"><Label>Contact Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>

      {/* Credentials */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">🔑 Admin Credentials</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>School Code *</Label>
            <Input className="font-mono font-bold" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MW1234" required />
          </div>
          <div className="space-y-1.5">
            <Label>Login Email *</Label>
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="school@tsid.go.tz" required />
          </div>
          <div className="space-y-1.5">
            <Label>Password *</Label>
            <Input className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { if (region) setCode(genCode(region)); setPassword(genPassword()); }}>
          ↻ Regenerate
        </Button>
      </div>

      <Button type="submit" className="w-full bg-primary" disabled={loading}>
        {loading ? "Registering…" : "🏫 Register School"}
      </Button>
    </form>
  );
}

// ── School row actions: edit / notes / delete (National only) ──────────────
function SchoolActions({ school, actorName, onChange }: {
  school: { school_code: string; school_name: string; type: string; region: string; district: string; ward: string; notes?: string | null };
  actorName: string; onChange: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  return (
    <>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit School</DialogTitle></DialogHeader>
          <EditSchoolForm school={school} actorName={actorName} onDone={() => { setEditOpen(false); onChange(); }} />
        </DialogContent>
      </Dialog>
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" title="Delete" className="text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete School</DialogTitle></DialogHeader>
          <DeleteSchoolConfirm school={school} actorName={actorName} onDone={() => { setDelOpen(false); onChange(); }} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditSchoolForm({ school, actorName, onDone }: {
  school: { school_code: string; school_name: string; type: string; notes?: string | null };
  actorName: string; onDone: () => void;
}) {
  const [name, setName] = useState(school.school_name);
  const [notes, setNotes] = useState(school.notes ?? "");
  const [loading, setLoading] = useState(false);
  async function save() {
    setLoading(true);
    const { error } = await supabase.from("schools").update({
      school_name: name, notes: notes || null,
    }).eq("school_code", school.school_code);
    if (error) { toast.error(error.message); setLoading(false); return; }
    await supabase.from("activity_logs").insert({
      action: "school:edit", message: `Edited school ${school.school_code} — ${name}`,
      by_name: actorName, by_role: "gov", by_ref: school.school_code,
    });
    setLoading(false); toast.success("Saved"); onDone();
  }
  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1.5"><Label>School Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Notes / Remarks</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal note about this school" /></div>
      <Button className="w-full bg-primary" onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}

function DeleteSchoolConfirm({ school, actorName, onDone }: {
  school: { school_code: string; school_name: string }; actorName: string; onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  async function del() {
    setLoading(true);
    const { error } = await supabase.from("schools").delete().eq("school_code", school.school_code);
    if (error) { toast.error(error.message); setLoading(false); return; }
    await supabase.from("activity_logs").insert({
      action: "school:delete", message: `Deleted school ${school.school_code} — ${school.school_name}`,
      by_name: actorName, by_role: "gov", by_ref: school.school_code,
    });
    setLoading(false); toast.success("School deleted"); onDone();
  }
  return (
    <div className="space-y-4 py-2">
      <p className="text-sm">Permanently delete <strong>{school.school_name}</strong> ({school.school_code})? This cannot be undone.</p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onDone}>Cancel</Button>
        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={del} disabled={loading}>{loading ? "Deleting…" : "Delete"}</Button>
      </div>
    </div>
  );
}

// ── School password reset — available to all gov admins (scope enforced server-side) ──
function ResetSchoolPassword({ school }: {
  school: { school_code: string; school_name: string; auth_uid?: string | null; email?: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(genPassword());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function reset() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { action: "reset_school_password", school_code: school.school_code, new_password: pw },
    });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    setDone(true);
    toast.success("School password reset");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setPw(genPassword()); setDone(false); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Reset school password"><KeyRound className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reset School Password</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            New login password for <strong>{school.school_name}</strong>
            {school.email && <> (<span className="font-mono">{school.email}</span>)</>}.
          </p>
          {!school.auth_uid && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              This school has no login account (registered before login accounts were enabled). Re-register it to enable login.
            </div>
          )}
          <div className="flex gap-2">
            <Input className="font-mono" value={pw} onChange={(e) => setPw(e.target.value)} disabled={!school.auth_uid} />
            <Button variant="outline" size="sm" onClick={() => setPw(genPassword())} disabled={!school.auth_uid}>↻</Button>
          </div>
          {done ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
              <div className="font-semibold text-emerald-800 mb-1">✅ Password reset</div>
              <div className="font-mono flex items-center justify-between">
                {pw}
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(pw); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
              <Button className="w-full mt-3" variant="outline" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <Button className="w-full bg-primary" onClick={reset} disabled={loading || !school.auth_uid}>
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk school upload (CSV/Excel) ─────────────────────────────────────────
function BulkSchoolUpload({ actorName, me, onDone }: { actorName: string; me: any; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Bulk upload</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bulk Upload Schools</DialogTitle></DialogHeader>
        <BulkUpload
          mode="schools"
          onRows={async (rows) => {
            let ok = 0, failed = 0; const errors: string[] = [];
            for (const row of rows) {
              if (!row.school_name?.trim() || !row.region?.trim() || !row.district?.trim()) {
                failed++; errors.push(`${row.school_name || "row"}: missing name/region/district`); continue;
              }
              const prefix = (row.region || "TZ").slice(0, 2).toUpperCase();
              const code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
              const email = row.email?.trim() || `${code.toLowerCase()}@schools.tsid.go.tz`;
              const password = "sc" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";
              const { data, error } = await supabase.functions.invoke("create-school", {
                body: {
                  school_code: code, school_name: row.school_name, type: row.type || "Primary School",
                  region: row.region, district: row.district, ward: row.ward || "",
                  address: row.address || null, phone: row.phone || null,
                  email, password,
                },
              });
              if (error || data?.error) { failed++; errors.push(`${row.school_name}: ${data?.error ?? error?.message}`); }
              else ok++;
            }
            onDone();
            return { ok, failed, errors };
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
