export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Province → District → Cities mapping (comprehensive Nepal)
export const NEPAL_LOCATIONS = {
  "Bagmati": {
    "Kathmandu": ["Thamel","Baneshwor","Koteshwor","Baluwatar","Lazimpat","Naxal","Maharajgunj","Chabahil","Bouddha","Kapan","Mandikhatar","Sukedhara","Balaju","Swayambhu","Kirtipur","Thankot","Budhanilkantha","Gongabu","Kalanki","Sitapaila","Dallu","Narayanthan","Pashupati","Gaushala","Jorpati","Mulpani","Tokha","Tarakeshwor"],
    "Lalitpur": ["Patan","Jhamsikhel","Kupondole","Sanepa","Ekantakuna","Imadol","Lubhu","Godawari","Chapagaun","Bungamati","Khokana","Harisiddhi","Tikathali","Satdobato","Lagankhel","Jawalakhel","Pulchowk","Mangalbazar","Sunakothi","Lamatar"],
    "Bhaktapur": ["Bhaktapur","Suryabinayak","Madhyapur Thimi","Nagarkot","Changunarayan","Katunje","Bode","Lokanthali","Sipadol","Sallaghari"],
    "Makwanpur": ["Hetauda","Thaha","Manahari","Bhimphedi","Raksirang","Kailash","Bakaiya","Indrasarowar"],
    "Chitwan": ["Bharatpur","Narayanghat","Ratnanagar","Rapti","Ichchhakamana","Bharatpur-10","Bharatpur-11","Sauraha","Meghauli","Dibyanagar"],
    "Kavrepalanchok": ["Dhulikhel","Banepa","Panauti","Nala","Mandan Deupur","Khopasi","Panchkhal","Namobuddha","Roshi","Temal"],
    "Nuwakot": ["Bidur","Kakani","Tadi","Belkotgadhi","Dupcheshwar","Suryagadhi","Kispang","Shivapuri"],
    "Sindhupalchok": ["Chautara","Melamchi","Balephi","Helambu","Bhotekoshi","Jugal","Indrawati","Lisankhu Pakhar"],
    "Rasuwa": ["Dhunche","Ramche","Gosaikunda","Naukunda","Kalika"],
    "Sindhuli": ["Kamalamai","Dudhauli","Tinpatan","Golanjor","Sunkoshi","Hariharpurgadhi"],
    "Ramechhap": ["Manthali","Ramechhap","Doramba","Gokulganga","Khandadevi","Sunapati","Umakunda","Likhu Tamakoshi"],
    "Dolakha": ["Charikot","Jiri","Bhimeshwor","Gaurishankar","Bigu","Kalinchok","Melung","Sailung","Tamakoshi","Vedpu"]
  },
  "Gandaki": {
    "Kaski": ["Pokhara","Lekhnath","Machhapuchchhre","Annapurna","Rupa","Madi","Pokhara-1","Pokhara-2","Pokhara-3","Lakeside","Birauta","Prithvichowk","Mahendrapul","Chipledhunga","Simalchaur","Hemja","Sarankot"],
    "Syangja": ["Waling","Putalibazar","Galyang","Arjunchaupari","Biruwa","Bhirkot","Chapakot","Harinas","Kaligandaki","Phedikhola"],
    "Parbat": ["Kushma","Phalewas","Modi","Jaljala","Mahashila","Painyu","Bihadi"],
    "Baglung": ["Baglung","Dhorpatan","Galkot","Jaimini","Taman","Nisikhola","Bareng","Kanthekhola","Tara Hill"],
    "Myagdi": ["Beni","Annapurna","Mangala","Malika","Raghuganga","Dhaulagiri"],
    "Mustang": ["Jomsom","Mustang","Thasang","Gharapjhong","Lomanthang","Lo-Ghekar Damodarkunda"],
    "Manang": ["Chame","Narpa Bhumi","Narphu","Nasong"],
    "Lamjung": ["Besisahar","Sundarbazar","Dordi","Dudhpokhari","Kwholasothar","Marsyangdi","Rainas","Chamje"],
    "Tanahu": ["Damauli","Bhimad","Byas","Devghat","Ghiring","Myagde","Rhishing","Shuklagandaki","Bandipur"],
    "Gorkha": ["Gorkha","Palungtar","Arughat","Barpak Sulikot","Bhimsen","Chum Nubri","Dharche","Gandaki","Tsum Nubri"],
    "Nawalpur": ["Kawasoti","Bulingtar","Devchuli","Gaindakot","Hupsekot","Madhyabindu","Binayi Tribeni"]
  },
  "Lumbini": {
    "Rupandehi": ["Butwal","Bhairahawa","Siddharthanagar","Tilottama","Sainamaina","Marchawari","Omsatiya","Rohini","Siyari","Sudhdhodhan","Gaidahawa","Kotahimai","Mayadevi","Devdaha","Lumbini Sanskritik"],
    "Kapilvastu": ["Taulihawa","Banganga","Buddhabhumi","Kapilvastu","Krishnanagar","Maharajgunj","Shivaraj","Suddhodhan","Yashodhara"],
    "Palpa": ["Tansen","Rampur","Rambha","Ribdikot","Tinau","Mathagadhi","Nisdi","Bagnaskali","Rainadevi Chhahara"],
    "Arghakhanchi": ["Sandhikharka","Bhumikasthan","Chhatradev","Malarani","Panini","Sitganga"],
    "Gulmi": ["Tamghas","Musikot","Chandrakot","Gulmi Darbar","Isma","Kaligandaki","Malika","Resunga","Ruru","Satyawati"],
    "Dang": ["Tulsipur","Ghorahi","Lamahi","Banglachuli","Babai","Dangisharan","Gadhawa","Rajpur","Rapti","Shantinagar"],
    "Banke": ["Nepalgunj","Kohalpur","Narainapur","Raptisonari","Duduwa","Janki","Khajura","Baijanath"],
    "Bardiya": ["Gulariya","Rajapur","Thakurbaba","Badhaiyatal","Bansgadhi","Barbardiya","Geruwa","Madhuwan","Suryapatuwa"],
    "Nawalparasi West": ["Sunwal","Palhinandan","Pratappur","Susta","Bardaghat","Ramgram"],
    "Pyuthan": ["Pyuthan","Swargadwari","Gaumukhi","Jhimruk","Mallarani","Naubahini","Sarumarani"],
    "Rolpa": ["Rolpa","Lungri","Madi","Pariwartan","Runtigadhi","Sunchhahari","Thabang","Tribeni"],
    "Rukum East": ["Putha Uttarganga","Bhume"]
  },
  "Koshi": {
    "Morang": ["Biratnagar","Urlabari","Sundar Haraicha","Belbari","Dhanpalthan","Gramthan","Jahada","Kanepokhari","Kerabari","Letang","Miklajung","Pathari Shanischare","Ratuwamai","Rangeli","Sundarpur","Udhyogpur"],
    "Sunsari": ["Dharan","Itahari","Inaruwa","Barahakshetra","Bhokraha Narsingh","Dewanganj","Duhabi","Gadhi","Harinagar","Koshi","Ramdhuni","Triyuga"],
    "Jhapa": ["Birtamode","Damak","Mechinagar","Arjundhara","Bhadrapur","Buddhashanti","Gauradaha","Haldibari","Jhapa","Kankai","Kamal","Kechana Kavrelung","Shivasataxi","Surunga"],
    "Ilam": ["Ilam","Deumai","Maijogmai","Mangsebung","Rong","Sandakpur","Suryodaya"],
    "Dhankuta": ["Dhankuta","Chhathar Jorpati","Mahalaxmi","Pakhribas","Sangurigadhi","Shahidbhumi"],
    "Taplejung": ["Phungling","Aathrai Tribeni","Maiwakhola","Mikwakhola","Pathivara Yangwarak","Sirijangha","Sidingba","Meringden","Phaktanglung"],
    "Sankhuwasabha": ["Khandbari","Chainpur","Dharmadevi","Madi","Makalu","Panchkhapan","Sabhapokhari","Silichong"],
    "Solukhumbu": ["Solu Dudhkunda","Dudhkunda","Khumbu Pasanglhamu","Mahakulung","Necha Salyan","Sotang","Thulung Dudhkunda"],
    "Udayapur": ["Triyuga","Belaka","Chaudandigadhi","Katari","Rautamai","Sunkoshi","Udayapurgadhi"],
    "Okhaldhunga": ["Siddhicharan","Champadevi","Chisankhugadhi","Khijidemba","Likhu","Manebhanjyang","Molung","Sunkoshi"],
    "Khotang": ["Diktel Rupakot Majhuwagadhi","Aiselukharka","Barahapokhari","Diprung Chuichumma","Halesi Tuwachung","Jantedhunga","Kepilasgadhi","Khotehang","Lamidanda","Rawabesi"],
    "Bhojpur": ["Bhojpur","Aamchowk","Hatuwagadhi","Pauwadungma","Ramprasad Rai","Salpasilichho","Shadananda","Tyamke Yuwa"],
    "Terhathum": ["Myanglung","Aathrai","Chhathar","Fedap","Laligurans","Menchhayayem","Phedap"],
    "Panchthar": ["Phidim","Falgunanda","Hilihang","Kummayak","Miklajung","Phalelung","Tumbewa","Yangwarak"],
    "Taplejung": ["Phungling","Aathrai Tribeni","Maiwakhola","Mikwakhola","Pathivara Yangwarak","Sirijangha"]
  },
  "Madhesh": {
    "Sarlahi": ["Malangwa","Bagmati","Balara","Barahathawa","Basbariya","Bishnu","Bramhapuri","Chakraghatta","Chandranagar","Dhankaul","Godaita","Haripurwa","Haripur","Ishworpur","Kabilasi","Lalbandi","Parsa","Ramnagar","Saptari"],
    "Mahottari": ["Jaleshwor","Aurahi","Balwa","Bardibas","Bhangaha","Ekdara","Gaushala","Loharpatti","Manara Shiswa","Matihani","Pipra","Ramgopalpur","Samsi","Sonama"],
    "Dhanusha": ["Janakpur","Aurahi","Bateshwor","Bideha","Chhireshwornath","Dhanauji","Ganeshman Charnath","Hansapur","Hans Pur","Janaknandini","Kamala","Lakshminiya","Mithila","Mithila Bihari","Mukhiyapatti Musarmiya","Nagarain","Sahidnagar","Sabaila","Shahidnagar"],
    "Siraha": ["Siraha","Aurahi","Bariyarpatti","Bhagawanpur","Bishnupur","Dhangadhimai","Golbazar","Karjanha","Lahan","Mirchaiya","Nawarajpur","Sakhuwanankarkatti","Sukhipur"],
    "Saptari": ["Rajbiraj","Agnisair Krishna Savaran","Balan-Bihul","Belhi Chapena","Bishnupur","Bode Barsain","Chhinnamasta","Dakneshwori","Hanumannagar Kankalini","Kanchanrup","Khadak","Mahadeva","Rajgadh","Rupani","Shambhunath","Surunga","Tilathi Koiladi"],
    "Parsa": ["Birgunj","Bahudarmai","Bindabasini","Chhipaharmai","Dhobini","Jagarnathpur","Jirabhawani","Kalikamai","Pakaha Mainpur","Parsagadhi","Paterwasugauli","Pokhariya","Paterwa Sugauli","Thori"],
    "Bara": ["Kalaiya","Adarsha Kotwal","Baragadhi","Baudhimai","Bithmore","Chakrapur","Devtal","Jitpur Simara","Karaiyamai","Kolhabi","Mahagadhimai","Nijgadh","Pacharauta","Pheta","Prasauni","Simraungadh","Suwarna"],
    "Rautahat": ["Gaur","Baudhimai","Brindaban","Chandrapur","Devahi Gonahi","Durga Bhagwati","Garuda","Gadhimai","Gujara","Ishanath","Katahariya","Madhav Narayan","Maulapur","Paroha","Phatuwa Bijayapur","Rajpur","Rajdevi","Shivapur","Yamunamai"]
  },
  "Sudurpashchim": {
    "Kanchanpur": ["Mahendranagar","Bedkot","Belauri","Bhimdatta","Krishnapur","Laljhadi","Punarbas","Shuklaphanta"],
    "Kailali": ["Dhangadhi","Tikapur","Bhajani","Chure","Gauriganga","Ghodaghodi","Janaki","Joshipur","Kailari","Lamkichuha","Mohanyal","Phatepur"],
    "Dadeldhura": ["Amargadhi","Aalital","Ajayameru","Bhageshwor","Ganyapdhura","Nawadurga","Parashuram"],
    "Doti": ["Dipayal Silgadhi","Aadarsha","Badikedar","Bogtan Fudsil","Jorayal","K.I.Singh","Purbichauki","Sayal","Shikhar"],
    "Achham": ["Mangalsen","Bannigadhi Jayagadh","Chaurpati","Dhakari","Mellekh","Panchadeval Binayak","Ramaroshan","Sanphebagar","Turmakhand"],
    "Bajhang": ["Chainpur","Bungal","Chhededaha","Durgathali","Jayaprithivi","Khaptad Chhanna","Masta","Surma","Talkot","Thalara"],
    "Bajura": ["Badimalika","Budhiganga","Budinanda","Gaumul","Himali","Jagannath","Khaptad Chhanna","Pandav Gufa","Swami Kartik Khapar","Triveni"],
    "Baitadi": ["Dasharathchand","Dilasaini","Dogdakedar","Melauli","Pancheshwor","Purchaudi","Shivanath","Sigas","Surnaya"],
    "Darchula": ["Darchula","Apihimal","Byans","Duhun","Lekam","Mahakali","Marma","Naugad","Shailyashikhar"]
  },
  "Karnali": {
    "Surkhet": ["Birendranagar","Bheriganga","Chaukune","Gurbhakot","Lekbeshi","Panchapuri","Simta"],
    "Dailekh": ["Narayan","Aathabis","Bhagawatimai","Chamunda Bindrasaini","Dullu","Dungeshwor","Gurans","Mahabu","Naumule","Thantikandh"],
    "Jajarkot": ["Bheri","Barekot","Chhedagad","Junichande","Kuse","Nalgad","Shiwalaya","Tribeni"],
    "Dolpa": ["Thuli Bheri","Chharka Tangsong","Dolpo Buddha","Jagdulla","Kaike","Mudkechula","Tripurasundari"],
    "Humla": ["Simkot","Adanchuli","Chankheli","Kharpunath","Namkha","Sarkegad","Tanjakot"],
    "Jumla": ["Chandannath","Guthichaur","Hima","Kanakasundari","Patarasi","Sinja","Tatopani","Tila"],
    "Kalikot": ["Khandachakra","Mahawai","Naraharinath","Pachaljharana","Palata","Raskot","Sanni Triveni","Shubha Kalika","Tilagufa"],
    "Mugu": ["Chhayanath Rara","Khatyad","Mugum Karmarong","Soru"],
    "Rukum West": ["Musikot","Aathbiskot","Banfikot","Chaurjahari","Putha Uttarganga","Sanibheri","Triveni"],
    "Salyan": ["Sharada","Bagchaur","Bangad Kupinde","Darma","Kalimati","Kapurkot","Kumakh","Siddha Kumakh","Tribeni"]
  }
};

// Flat lookup: district → province (for reverse lookup)
export const DISTRICT_TO_PROVINCE = {};
Object.entries(NEPAL_LOCATIONS).forEach(([province, districts]) => {
  Object.keys(districts).forEach(district => {
    DISTRICT_TO_PROVINCE[district] = province;
  });
});

export const PROPERTY_CATEGORIES = {
  "House": {
    icon: "🏠",
    subCategories: [
      "Apartment / Flat",
      "House / Villa",
      "Bungalow",
      "Townhouse",
      "Duplex",
      "Penthouse",
      "Studio Apartment",
      "1 BHK",
      "2 BHK",
      "3 BHK",
      "4+ BHK"
    ]
  },
  "Room": {
    icon: "🚪",
    subCategories: [
      "Single Room",
      "Double Room",
      "Room with Attached Bath",
      "Room with Shared Bath",
      "Hostel Room",
      "PG / Paying Guest",
      "Room - Office Use",
      "Room - Storage"
    ]
  },
  "Land": {
    icon: "🌿",
    subCategories: [
      "Residential Land / Plot",
      "Agricultural Land",
      "Commercial Land",
      "Industrial Land",
      "Mixed Use Land",
      "Roadside Land",
      "River-side Land",
      "Hill / Mountain Land"
    ]
  },
  "Commercial": {
    icon: "🏢",
    subCategories: [
      "Office Space",
      "Shop / Showroom",
      "Restaurant Space",
      "Warehouse / Godown",
      "Factory / Industrial",
      "Hotel / Lodge Space",
      "Co-working Space",
      "Clinic / Hospital Space",
      "School / Training Space",
      "Garage / Parking Space"
    ]
  }
};
