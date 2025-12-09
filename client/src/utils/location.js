import { AFRICAN_DIAL_CODES, getDialCodeFromPhone } from './helpers';

// Core country metadata for supported African markets
export const COUNTRY_REGION_MAP = {
  NG: {
    code: 'NG',
    name: 'Nigeria',
    regionLabel: 'State',
    regions: [
      'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
    ],
    defaultRegion: 'Lagos'
  },
  GH: {
    code: 'GH',
    name: 'Ghana',
    regionLabel: 'Region',
    regions: [
      'Ahafo','Ashanti','Bono','Bono East','Central','Eastern','Greater Accra','North East','Northern','Oti','Savannah','Upper East','Upper West','Volta','Western','Western North'
    ],
    defaultRegion: 'Greater Accra'
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    regionLabel: 'County',
    regions: [
      'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
    ],
    defaultRegion: 'Nairobi'
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    regionLabel: 'Province',
    regions: [
      'Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'
    ],
    defaultRegion: 'Gauteng'
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    regionLabel: 'Region',
    regions: [
      'Central','Eastern','Northern','Western'
    ],
    defaultRegion: 'Central'
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    regionLabel: 'Region',
    regions: [
      'Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga'
    ],
    defaultRegion: 'Dar es Salaam'
  },
  EG: {
    code: 'EG',
    name: 'Egypt',
    regionLabel: 'Governorate',
    regions: [
      'Alexandria','Aswan','Asyut','Beheira','Beni Suef','Cairo','Dakahlia','Damietta','Faiyum','Gharbia','Giza','Ismailia','Kafr El Sheikh','Luxor','Matrouh','Minya','Monufia','New Valley','North Sinai','Port Said','Qalyubia','Qena','Red Sea','Sharqia','Sohag','South Sinai','Suez'
    ],
    defaultRegion: 'Cairo'
  },
  MA: {
    code: 'MA',
    name: 'Morocco',
    regionLabel: 'Region',
    regions: [
      'Beni Mellal-Khenifra','Casablanca-Settat','Dakhla-Oued Ed-Dahab','Draa-Tafilalet','Fes-Meknes','Guelmim-Oued Noun','Laayoune-Sakia El Hamra','Marrakesh-Safi','Oriental','Rabat-Sale-Kenitra','Souss-Massa','Tangier-Tetouan-Al Hoceima'
    ],
    defaultRegion: 'Casablanca-Settat'
  },
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    regionLabel: 'Regional State',
    regions: [
      'Addis Ababa','Afar','Amhara','Benishangul-Gumuz','Dire Dawa','Gambela','Harari','Oromia','Sidama','Somali','South West Ethiopia Peoples','Southern Nations, Nationalities, and Peoples','Tigray'
    ],
    defaultRegion: 'Addis Ababa'
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    regionLabel: 'Province',
    regions: [
      'Kigali','Eastern','Northern','Western','Southern'
    ],
    defaultRegion: 'Kigali'
  },
  SN: {
    code: 'SN',
    name: 'Senegal',
    regionLabel: 'Region',
    regions: [
      'Dakar','Diourbel','Fatick','Kaffrine','Kaolack','Kedougou','Kolda','Louga','Matam','Saint-Louis','Sedhiou','Tambacounda','Thies','Ziguinchor'
    ],
    defaultRegion: 'Dakar'
  },
  CI: {
    code: 'CI',
    name: "Cote d'Ivoire",
    regionLabel: 'District',
    regions: [
      'Abidjan','Bas-Sassandra','Comoe','Denguele','Goh-Djiboua','Lacs','Lagunes','Montagnes','Sassandra-Marahoue','Savanes','Vallee du Bandama','Woroba','Yamoussoukro','Zanzan'
    ],
    defaultRegion: 'Abidjan'
  },
  SL: {
    code: 'SL',
    name: 'Sierra Leone',
    regionLabel: 'Province',
    regions: [
      'Eastern','Northern','North West','Southern','Western Area'
    ],
    defaultRegion: 'Western Area'
  },
  ML: {
    code: 'ML',
    name: 'Mali',
    regionLabel: 'Region',
    regions: [
      'Bamako','Gao','Kayes','Kidal','Koulikoro','Menaka','Mopti','Segou','Sikasso','Taoudenit','Tombouctou'
    ],
    defaultRegion: 'Bamako'
  },
  NE: {
    code: 'NE',
    name: 'Niger',
    regionLabel: 'Region',
    regions: [
      'Agadez','Diffa','Dosso','Maradi','Niamey','Tahoua','Tillaberi','Zinder'
    ],
    defaultRegion: 'Niamey'
  },
  BJ: {
    code: 'BJ',
    name: 'Benin',
    regionLabel: 'Department',
    regions: [
      'Alibori','Atakora','Atlantique','Borgou','Collines','Couffo','Donga','Littoral','Mono','Oueme','Plateau','Zou'
    ],
    defaultRegion: 'Littoral'
  },
  TG: {
    code: 'TG',
    name: 'Togo',
    regionLabel: 'Region',
    regions: [
      'Centrale','Kara','Maritime','Plateaux','Savanes'
    ],
    defaultRegion: 'Maritime'
  },
  LR: {
    code: 'LR',
    name: 'Liberia',
    regionLabel: 'County',
    regions: [
      'Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','River Cess','River Gee','Sinoe'
    ],
    defaultRegion: 'Montserrado'
  },
  NA: {
    code: 'NA',
    name: 'Namibia',
    regionLabel: 'Region',
    regions: [
      'Erongo','Hardap','Karas','Kavango East','Kavango West','Khomas','Kunene','Ohangwena','Omaheke','Omusati','Oshana','Oshikoto','Otjozondjupa','Zambezi'
    ],
    defaultRegion: 'Khomas'
  },
  BW: {
    code: 'BW',
    name: 'Botswana',
    regionLabel: 'District',
    regions: [
      'Central','Chobe','Ghanzi','Kgalagadi','Kgatleng','Kweneng','North East','North West','South East','Southern'
    ],
    defaultRegion: 'South East'
  },
  LS: {
    code: 'LS',
    name: 'Lesotho',
    regionLabel: 'District',
    regions: [
      'Berea','Butha-Buthe','Leribe','Mafeteng','Maseru','Mohale\'s Hoek','Mokhotlong','Qacha\'s Nek','Quthing','Thaba-Tseka'
    ],
    defaultRegion: 'Maseru'
  }
};

export const DEFAULT_COUNTRY_CODE = 'NG';

const COUNTRY_DIAL_CODES = {
  NG: ['234'],
  GH: ['233'],
  KE: ['254'],
  ZA: ['27'],
  UG: ['256'],
  TZ: ['255'],
  EG: ['20'],
  MA: ['212'],
  CM: ['237'],
  CI: ['225'],
  SN: ['221'],
  RW: ['250'],
  ET: ['251'],
  MW: ['265'],
  ZM: ['260'],
  ZW: ['263'],
  BW: ['267'],
  NA: ['264'],
  GM: ['220'],
  LR: ['231'],
  SL: ['232'],
  BJ: ['229'],
  BF: ['226'],
  ML: ['223'],
  NE: ['227'],
  TD: ['235'],
  CF: ['236'],
  CG: ['242'],
  CD: ['243'],
  GA: ['241'],
  AO: ['244'],
  MZ: ['258'],
  SZ: ['268'],
  LS: ['266'],
  MR: ['222'],
  GN: ['224'],
  GQ: ['240'],
  ST: ['239'],
  SC: ['248'],
  MU: ['230'],
  MG: ['261'],
  RE: ['262'],
  YT: ['269']
};

const DIAL_CODE_COUNTRY_MAP = Object.entries(COUNTRY_DIAL_CODES).reduce((acc, [countryCode, dialCodes]) => {
  dialCodes.forEach((code) => {
    acc[code] = countryCode;
  });
  return acc;
}, {});

export const getCountryMeta = (countryCode) => {
  if (!countryCode) {
    return COUNTRY_REGION_MAP[DEFAULT_COUNTRY_CODE];
  }
  return COUNTRY_REGION_MAP[countryCode] || {
    code: countryCode,
    name: countryCode,
    regionLabel: 'State/Region',
    regions: [],
    defaultRegion: ''
  };
};

export const getCountryCodeFromDialCode = (dialCode) => {
  if (!dialCode) return null;
  const cleaned = dialCode.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  if (!AFRICAN_DIAL_CODES.includes(cleaned)) return null;
  return DIAL_CODE_COUNTRY_MAP[cleaned] || null;
};

export const getCountryCodeFromPhone = (phone) => {
  const dialCode = getDialCodeFromPhone(phone);
  if (!dialCode) return null;
  return getCountryCodeFromDialCode(dialCode);
};

export const resolveCountryCode = ({ phone, detectedCode } = {}) => {
  return (
    getCountryCodeFromPhone(phone)
    || (detectedCode ? detectedCode.toUpperCase() : null)
    || DEFAULT_COUNTRY_CODE
  );
};

export const getRegionOptions = (countryCode) => {
  const meta = getCountryMeta(countryCode);
  return {
    regions: meta.regions,
    regionLabel: meta.regionLabel,
    countryName: meta.name,
    defaultRegion: meta.defaultRegion
  };
};
