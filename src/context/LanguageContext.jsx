import { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'pt', label: 'Português (Portuguese)', flag: '🇧🇷' },
];

export const TRANSLATIONS = {
  vi: {
    community: 'Cộng đồng',
    about: 'Giới thiệu',
    support: 'Hỗ trợ',
    language: 'Ngôn ngữ',
    register: 'Đăng ký',
    signin: 'Đăng nhập',
    welcome_sub: '▲ HÀNH TRÌNH ĐẾN NHỮNG VÙNG ĐẤT MỚI, KHÁM PHÁ VƯỜN QUỐC GIA NOTO',
    welcome_title: 'WELCOME',
    welcome_desc: 'Rời xa sự náo nhiệt của những đô thị sầm uất tại Nhật Bản là ngôi làng cổ Noto thanh bình, ẩn chứa những điều bất ngờ đầy cuốn hút.',
    start_journey: 'Bắt đầu hành trình ▸',
    experience_3d: 'TRẢI NGHIỆM 3D',
    tranquility: 'Thanh Bình',
    tranquility_desc: 'Tách biệt khỏi nhịp sống hối hả, đắm mình vào những dòng thác lung linh và hồ nước huyền bí nơi lưu giữ kho tàng mã nguồn mở huyền thoại.',
    learn_more: '— Tìm hiểu thêm',
  },
  en: {
    community: 'Community',
    about: 'About',
    support: 'Support',
    language: 'Language',
    register: 'Register',
    signin: 'Sign in',
    welcome_sub: '▲ JOURNEY TO NEW FRONTIERS, JOURNEY TO NOTO NATURE PARK',
    welcome_title: 'WELCOME',
    welcome_desc: "Away from the manic energy of Japan's famous metropolises lies the ancient hamlet of Noto. Surprising and captivating in equal measure.",
    start_journey: 'Start the journey ▸',
    experience_3d: '3D EXPERIENCE',
    tranquility: 'Tranquility',
    tranquility_desc: "Away from the manic energy of Japan's famous metropolises, soak into the ethereal waterfalls and mystic lakes harboring a vast realm of legendary open-source artifacts.",
    learn_more: '— Learn more',
  },
  ja: {
    community: 'コミュニティ',
    about: '概要',
    support: 'サポート',
    language: '言語',
    register: '新規登録',
    signin: 'ログイン',
    welcome_sub: '▲ 新たなフロンティアへ、能登自然公園への旅',
    welcome_title: 'ようこそ',
    welcome_desc: '大都市の喧騒から離れた能登の古き集落。驚きと魅力に満ちた静寂の世界。',
    start_journey: '旅を始める ▸',
    experience_3d: '3D 体験',
    tranquility: '静寂',
    tranquility_desc: '神秘的な滝と静かな湖に囲まれた、オープンソースの宝庫を探索しましょう。',
    learn_more: '— 詳細を見る',
  },
  zh: {
    community: '社区',
    about: '关于我们',
    support: '技术支持',
    language: '语言',
    register: '注册',
    signin: '登录',
    welcome_sub: '▲ 开启全新旅程，探索能登自然公园',
    welcome_title: '欢迎',
    welcome_desc: '远离大都市的喧嚣繁华，步入能登古老村落，探索充满魅力与惊喜的宝藏。',
    start_journey: '启程探索 ▸',
    experience_3d: '3D 体验',
    tranquility: '宁静',
    tranquility_desc: '沉浸于清澈瀑布与神秘湖泊之间，探索浩瀚的开源传奇代码库。',
    learn_more: '— 了解更多',
  },
  ko: {
    community: '커뮤니티',
    about: '소개',
    support: '고객지원',
    language: '언어',
    register: '회원가입',
    signin: '로그인',
    welcome_sub: '▲ 새로운 경계를 향한 여정, 노토 자연공원으로',
    welcome_title: '환영합니다',
    welcome_desc: '대도시의 복잡함을 벗어나 고요한 노토 마을에서 만나는 매혹적인 여정.',
    start_journey: '여정 시작 ▸',
    experience_3d: '3D 체험',
    tranquility: '평온',
    tranquility_desc: '신비로운 폭포와 호수 속에 펼쳐진 오픈소스 유물의 세계를 경험하세요.',
    learn_more: '— 더 알아보기',
  },
  fr: {
    community: 'Communauté',
    about: 'À propos',
    support: 'Assistance',
    language: 'Langue',
    register: "S'inscrire",
    signin: 'Connexion',
    welcome_sub: '▲ VOYAGE VERS DE NOUVELLES FRONTIÈRES, PARC NATUREL DE NOTO',
    welcome_title: 'BIENVENUE',
    welcome_desc: 'Loin du tumulte des métropoles japonaises, découvrez le paisible village de Noto.',
    start_journey: 'Commencer le voyage ▸',
    experience_3d: 'EXPÉRIENCE 3D',
    tranquility: 'Tranquillité',
    tranquility_desc: 'Plongez au cœur des cascades éthérées et découvrez un univers open-source légendaire.',
    learn_more: '— En savoir plus',
  },
  de: {
    community: 'Community',
    about: 'Über uns',
    support: 'Support',
    language: 'Sprache',
    register: 'Registrieren',
    signin: 'Anmelden',
    welcome_sub: '▲ REISE ZU NEUEN HORIZONTEN, NOTO-NATURPARK',
    welcome_title: 'WILLKOMMEN',
    welcome_desc: 'Fernab der Hektik japanischer Metropolen liegt das historische Dorf Noto.',
    start_journey: 'Reise beginnen ▸',
    experience_3d: '3D-ERLEBNIS',
    tranquility: 'Ruhe',
    tranquility_desc: 'Tauchen Sie ein in geheimnisvolle Wasserfälle und legendäre Open-Source-Schätze.',
    learn_more: '— Mehr erfahren',
  },
  es: {
    community: 'Comunidad',
    about: 'Acerca de',
    support: 'Soporte',
    language: 'Idioma',
    register: 'Registrarse',
    signin: 'Iniciar sesión',
    welcome_sub: '▲ VIAJE HACIA NUEVAS FRONTERAS, PARQUE NATURAL DE NOTO',
    welcome_title: 'BIENVENIDO',
    welcome_desc: 'Lejos del bullicio de las metrópolis japonesas, descubra la tranquilidad de Noto.',
    start_journey: 'Comenzar viaje ▸',
    experience_3d: 'EXPERIENCIA 3D',
    tranquility: 'Tranquilidad',
    tranquility_desc: 'Sumérjase en cascadas místicas que albergan un vasto reino de código abierto.',
    learn_more: '— Más información',
  },
  ru: {
    community: 'Сообщество',
    about: 'О нас',
    support: 'Поддержка',
    language: 'Язык',
    register: 'Регистрация',
    signin: 'Вход',
    welcome_sub: '▲ ПУТЕШЕСТВИЕ К НОВЫМ ГОРИЗОНТАМ, ПРИРОДНЫЙ ПАРК НОТО',
    welcome_title: 'ДОБРО ПОЖАЛОВАТЬ',
    welcome_desc: 'Вдали от суеты японских мегаполисов лежит древняя деревня Ното.',
    start_journey: 'Начать путешествие ▸',
    experience_3d: '3D-ОПЫТ',
    tranquility: 'Спокойствие',
    tranquility_desc: 'Погрузитесь в мистическую атмосферу водопадов и легендарных проектов с открытым кодом.',
    learn_more: '— Узнать больше',
  },
  pt: {
    community: 'Comunidade',
    about: 'Sobre',
    support: 'Suporte',
    language: 'Idioma',
    register: 'Cadastre-se',
    signin: 'Entrar',
    welcome_sub: '▲ UMA JORNADA PARA NOVAS FRONTEIRAS, PARQUE NATURAL DE NOTO',
    welcome_title: 'BEM-VINDO',
    welcome_desc: 'Longe da energia agitada das metrópoles japonesas, repousa o vilarejo de Noto.',
    start_journey: 'Iniciar jornada ▸',
    experience_3d: 'EXPERIÊNCIA 3D',
    tranquility: 'Tranquilidade',
    tranquility_desc: 'Explore cachoeiras etéreas e lagos místicos repletos de artefatos open-source.',
    learn_more: '— Saiba mais',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('gxp_lang') || 'en');

  const changeLanguage = (code) => {
    setLang(code);
    localStorage.setItem('gxp_lang', code);
  };

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}