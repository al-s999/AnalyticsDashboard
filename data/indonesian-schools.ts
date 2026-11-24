export interface IndonesianSchool {
  id: string;
  npsn: string;
  name: string;
  level: "SD" | "SMP" | "SMA" | "SMK";
  status: "NEGERI" | "SWASTA";
  province: string;
  city: string;
  district: string;
  address: string;
  postalCode?: string;
  totalStudents?: number;
  accreditation?: "A" | "B" | "C";
}

export const INDONESIAN_SCHOOLS_DATA: IndonesianSchool[] = [
  // --- JAWA TIMUR (Surabaya, Malang, Sidoarjo) ---
  {
    id: "sch-20532247",
    npsn: "20532247",
    name: "SMAN 1 SURABAYA",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Genteng",
    address: "Jl. Wijaya Kusuma No. 48",
    postalCode: "60272",
    totalStudents: 1045,
    accreditation: "A"
  },
  {
    id: "sch-20532248",
    npsn: "20532248",
    name: "SMAN 2 SURABAYA",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Genteng",
    address: "Jl. Wijaya Kusuma No. 48",
    postalCode: "60272",
    totalStudents: 1080,
    accreditation: "A"
  },
  {
    id: "sch-20532249",
    npsn: "20532249",
    name: "SMAN 5 SURABAYA",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Genteng",
    address: "Jl. Kusuma Bangsa No. 21",
    postalCode: "60272",
    totalStudents: 1120,
    accreditation: "A"
  },
  {
    id: "sch-20532250",
    npsn: "20532250",
    name: "SMKN 1 SURABAYA",
    level: "SMK",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Wonokromo",
    address: "Jl. SMEA No. 4",
    postalCode: "60243",
    totalStudents: 1450,
    accreditation: "A"
  },
  {
    id: "sch-20532251",
    npsn: "20532251",
    name: "SMPN 1 SURABAYA",
    level: "SMP",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Genteng",
    address: "Jl. Pacar No. 4",
    postalCode: "60272",
    totalStudents: 960,
    accreditation: "A"
  },
  {
    id: "sch-20532252",
    npsn: "20532252",
    name: "SDN KETABANG 1 SURABAYA",
    level: "SD",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    district: "Genteng",
    address: "Jl. Ambengan No. 29",
    postalCode: "60272",
    totalStudents: 540,
    accreditation: "A"
  },
  {
    id: "sch-20533801",
    npsn: "20533801",
    name: "SMAN 1 MALANG",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Malang",
    district: "Klojen",
    address: "Jl. Tugu No. 1",
    postalCode: "65111",
    totalStudents: 980,
    accreditation: "A"
  },
  {
    id: "sch-20533802",
    npsn: "20533802",
    name: "SMAN 3 MALANG",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Malang",
    district: "Klojen",
    address: "Jl. Sultan Agung No. 7",
    postalCode: "65111",
    totalStudents: 1020,
    accreditation: "A"
  },
  {
    id: "sch-20533803",
    npsn: "20533803",
    name: "SMKN 4 MALANG",
    level: "SMK",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kota Malang",
    district: "Klojen",
    address: "Jl. Tanimbar No. 22",
    postalCode: "65117",
    totalStudents: 1600,
    accreditation: "A"
  },
  {
    id: "sch-20501830",
    npsn: "20501830",
    name: "SMAN 1 SIDOARJO",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Timur",
    city: "Kab. Sidoarjo",
    district: "Sidoarjo",
    address: "Jl. Jenggolo No. 1",
    postalCode: "61219",
    totalStudents: 1050,
    accreditation: "A"
  },

  // --- DKI JAKARTA ---
  {
    id: "sch-20107297",
    npsn: "20107297",
    name: "SMAN 8 JAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Selatan",
    district: "Tebet",
    address: "Jl. Taman Bukit Duri No. 2",
    postalCode: "12840",
    totalStudents: 1100,
    accreditation: "A"
  },
  {
    id: "sch-20107298",
    npsn: "20107298",
    name: "SMAN 28 JAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Selatan",
    district: "Pasar Minggu",
    address: "Jl. Ragunan Raya No. 47",
    postalCode: "12540",
    totalStudents: 990,
    accreditation: "A"
  },
  {
    id: "sch-20107299",
    npsn: "20107299",
    name: "SMAN 68 JAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Pusat",
    district: "Senen",
    address: "Jl. Salemba Raya No. 18",
    postalCode: "10430",
    totalStudents: 1025,
    accreditation: "A"
  },
  {
    id: "sch-20107300",
    npsn: "20107300",
    name: "SMKN 26 JAKARTA",
    level: "SMK",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Timur",
    district: "Pulo Gadung",
    address: "Jl. Balai Pustaka Baru I No. 2",
    postalCode: "13220",
    totalStudents: 1350,
    accreditation: "A"
  },
  {
    id: "sch-20107301",
    npsn: "20107301",
    name: "SMPN 115 JAKARTA",
    level: "SMP",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Selatan",
    district: "Tebet",
    address: "Jl. KH. Abdullah Syafei No. 1",
    postalCode: "12840",
    totalStudents: 920,
    accreditation: "A"
  },
  {
    id: "sch-20107302",
    npsn: "20107302",
    name: "SDN MENTENG 01 JAKARTA",
    level: "SD",
    status: "NEGERI",
    province: "DKI Jakarta",
    city: "Kota Jakarta Pusat",
    district: "Menteng",
    address: "Jl. Besuki No. 1",
    postalCode: "10310",
    totalStudents: 620,
    accreditation: "A"
  },

  // --- JAWA BARAT (Bandung, Bogor, Bekasi) ---
  {
    id: "sch-20219741",
    npsn: "20219741",
    name: "SMAN 3 BANDUNG",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Barat",
    city: "Kota Bandung",
    district: "Sumur Bandung",
    address: "Jl. Belitung No. 8",
    postalCode: "40113",
    totalStudents: 1010,
    accreditation: "A"
  },
  {
    id: "sch-20219742",
    npsn: "20219742",
    name: "SMAN 1 BOGOR",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Barat",
    city: "Kota Bogor",
    district: "Bogor Tengah",
    address: "Jl. Ir. H. Juanda No. 16",
    postalCode: "16121",
    totalStudents: 1040,
    accreditation: "A"
  },
  {
    id: "sch-20219743",
    npsn: "20219743",
    name: "SMKN 1 BANDUNG",
    level: "SMK",
    status: "NEGERI",
    province: "Jawa Barat",
    city: "Kota Bandung",
    district: "Wastukencana",
    address: "Jl. Wastukencana No. 3",
    postalCode: "40117",
    totalStudents: 1520,
    accreditation: "A"
  },
  {
    id: "sch-20219744",
    npsn: "20219744",
    name: "SMPN 1 BANDUNG",
    level: "SMP",
    status: "NEGERI",
    province: "Jawa Barat",
    city: "Kota Bandung",
    district: "Sumur Bandung",
    address: "Jl. Kesatriaan No. 12",
    postalCode: "40171",
    totalStudents: 890,
    accreditation: "A"
  },

  // --- DI YOGYAKARTA ---
  {
    id: "sch-20403161",
    npsn: "20403161",
    name: "SMAN 1 YOGYAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "DI Yogyakarta",
    city: "Kota Yogyakarta",
    district: "Wirobrajan",
    address: "Jl. H.O.S. Cokroaminoto No. 10",
    postalCode: "55252",
    totalStudents: 980,
    accreditation: "A"
  },
  {
    id: "sch-20403162",
    npsn: "20403162",
    name: "SMAN 3 YOGYAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "DI Yogyakarta",
    city: "Kota Yogyakarta",
    district: "Gondokusuman",
    address: "Jl. Laksda Yos Sudarso No. 7",
    postalCode: "55224",
    totalStudents: 960,
    accreditation: "A"
  },
  {
    id: "sch-20403163",
    npsn: "20403163",
    name: "SMKN 2 YOGYAKARTA",
    level: "SMK",
    status: "NEGERI",
    province: "DI Yogyakarta",
    city: "Kota Yogyakarta",
    district: "Jetis",
    address: "Jl. AM. Sangaji No. 47",
    postalCode: "55233",
    totalStudents: 1700,
    accreditation: "A"
  },

  // --- JAWA TENGAH (Semarang, Surakarta) ---
  {
    id: "sch-20328892",
    npsn: "20328892",
    name: "SMAN 3 SEMARANG",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Tengah",
    city: "Kota Semarang",
    district: "Semarang Tengah",
    address: "Jl. Pemuda No. 149",
    postalCode: "50132",
    totalStudents: 1080,
    accreditation: "A"
  },
  {
    id: "sch-20328893",
    npsn: "20328893",
    name: "SMAN 1 SURAKARTA",
    level: "SMA",
    status: "NEGERI",
    province: "Jawa Tengah",
    city: "Kota Surakarta",
    district: "Banjarsari",
    address: "Jl. Monginsidi No. 40",
    postalCode: "57134",
    totalStudents: 990,
    accreditation: "A"
  },

  // --- SUMATERA UTARA (Medan) ---
  {
    id: "sch-10210850",
    npsn: "10210850",
    name: "SMAN 1 MEDAN",
    level: "SMA",
    status: "NEGERI",
    province: "Sumatera Utara",
    city: "Kota Medan",
    district: "Medan Baru",
    address: "Jl. Teuku Cik Ditiro No. 1",
    postalCode: "20152",
    totalStudents: 1050,
    accreditation: "A"
  },

  // --- SULAWESI SELATAN (Makassar) ---
  {
    id: "sch-40311985",
    npsn: "40311985",
    name: "SMAN 1 MAKASSAR",
    level: "SMA",
    status: "NEGERI",
    province: "Sulawesi Selatan",
    city: "Kota Makassar",
    district: "Ujung Pandang",
    address: "Jl. Gunung Bawakaraeng No. 53",
    postalCode: "90115",
    totalStudents: 1020,
    accreditation: "A"
  },

  // --- BALI (Denpasar) ---
  {
    id: "sch-50103175",
    npsn: "50103175",
    name: "SMAN 1 DENPASAR",
    level: "SMA",
    status: "NEGERI",
    province: "Bali",
    city: "Kota Denpasar",
    district: "Denpasar Barat",
    address: "Jl. Kamboja No. 4",
    postalCode: "80233",
    totalStudents: 1060,
    accreditation: "A"
  }
];

