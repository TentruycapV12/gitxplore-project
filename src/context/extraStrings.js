/**
 * Chuỗi giao diện bổ sung cho cả 10 ngôn ngữ (trang chủ, About, Footer, popup, Tin tức, 404...).
 * Mỗi khóa là một mảng theo ĐÚNG thứ tự: vi, en, ja, zh, ko, fr, de, es, ru, pt.
 * LanguageContext tra file này sau TRANSLATIONS và UI_STRINGS. Chuỗi có {n}, {q}... sẽ được thay
 * bằng t('khóa', { n: 3 }).
 */
const ORDER = ['vi', 'en', 'ja', 'zh', 'ko', 'fr', 'de', 'es', 'ru', 'pt'];

const E = {
  // ---------- Thanh điều hướng ----------
  ui_forum: ['Diễn đàn', 'Forum', 'フォーラム', '论坛', '포럼', 'Forum', 'Forum', 'Foro', 'Форум', 'Fórum'],

  // ---------- Danh mục dự án ----------
  cat_ai: ['AI & Học máy', 'AI & Machine Learning', 'AI・機械学習', 'AI 与机器学习', 'AI & 머신러닝', 'IA & Apprentissage automatique', 'KI & Maschinelles Lernen', 'IA y Aprendizaje automático', 'ИИ и машинное обучение', 'IA e Aprendizado de máquina'],
  cat_gamedev: ['Phát triển game', 'Game Dev', 'ゲーム開発', '游戏开发', '게임 개발', 'Développement de jeux', 'Spieleentwicklung', 'Desarrollo de juegos', 'Разработка игр', 'Desenvolvimento de jogos'],
  cat_agents: ['Avatar ảo & Tác tử', 'Virtual Avatars & Agents', 'バーチャルアバター＆エージェント', '虚拟形象与智能体', '가상 아바타 & 에이전트', 'Avatars virtuels & Agents', 'Virtuelle Avatare & Agenten', 'Avatares virtuales y Agentes', 'Виртуальные аватары и агенты', 'Avatares virtuais e Agentes'],
  cat_web: ['Phát triển Web', 'Web Development', 'Web開発', 'Web 开发', '웹 개발', 'Développement Web', 'Webentwicklung', 'Desarrollo web', 'Веб-разработка', 'Desenvolvimento Web'],
  cat_devtools: ['Công cụ lập trình & Runtime', 'DevTools & Runtimes', '開発ツール＆ランタイム', '开发工具与运行时', '개발 도구 & 런타임', 'Outils de dev & Runtimes', 'Entwicklertools & Laufzeiten', 'Herramientas de desarrollo y Runtimes', 'Инструменты разработки и среды выполнения', 'Ferramentas de dev e Runtimes'],
  cat_cloud: ['Đám mây & DevOps', 'Cloud & DevOps', 'クラウド＆DevOps', '云与 DevOps', '클라우드 & DevOps', 'Cloud & DevOps', 'Cloud & DevOps', 'Nube y DevOps', 'Облако и DevOps', 'Nuvem e DevOps'],
  cat_security: ['Bảo mật & Mạng', 'Security & Network', 'セキュリティ＆ネットワーク', '安全与网络', '보안 & 네트워크', 'Sécurité & Réseau', 'Sicherheit & Netzwerk', 'Seguridad y Redes', 'Безопасность и сети', 'Segurança e Redes'],
  cat_databases: ['Cơ sở dữ liệu & Dữ liệu lớn', 'Databases & Big Data', 'データベース＆ビッグデータ', '数据库与大数据', '데이터베이스 & 빅데이터', 'Bases de données & Big Data', 'Datenbanken & Big Data', 'Bases de datos y Big Data', 'Базы данных и Big Data', 'Bancos de dados e Big Data'],

  // ---------- Thẻ dự án + cửa sổ chi tiết ----------
  pm_stars: ['Sao', 'Stars', 'スター', '星标', '스타', 'Étoiles', 'Sterne', 'Estrellas', 'Звёзды', 'Estrelas'],
  pm_forks: ['Nhánh (Fork)', 'Forks', 'フォーク', '复刻', '포크', 'Forks', 'Forks', 'Forks', 'Форки', 'Forks'],
  pm_copy: ['Sao chép', 'Copy', 'コピー', '复制', '복사', 'Copier', 'Kopieren', 'Copiar', 'Копировать', 'Copiar'],
  pm_copied: ['✓ Đã sao chép!', '✓ Copied!', '✓ コピーしました！', '✓ 已复制！', '✓ 복사됨!', '✓ Copié !', '✓ Kopiert!', '✓ ¡Copiado!', '✓ Скопировано!', '✓ Copiado!'],
  pm_demo: ['Xem demo trực tiếp ↗', 'Live Demonstration ↗', 'ライブデモ ↗', '在线演示 ↗', '라이브 데모 ↗', 'Démo en direct ↗', 'Live-Demo ↗', 'Demostración en vivo ↗', 'Живая демонстрация ↗', 'Demonstração ao vivo ↗'],
  pm_open: ['Mở trên GitHub ↗', 'Open on GitHub ↗', 'GitHubで開く ↗', '在 GitHub 打开 ↗', 'GitHub에서 열기 ↗', 'Ouvrir sur GitHub ↗', 'Auf GitHub öffnen ↗', 'Abrir en GitHub ↗', 'Открыть на GitHub ↗', 'Abrir no GitHub ↗'],

  // ---------- Giới thiệu (About) ----------
  ab_title_a: ['Cổng tuyển chọn dành cho', 'A Curated Portal for High-Performance', '厳選されたポータル：', '精选门户：', '엄선된 포털:', 'Un portail sélectionné pour les', 'Ein kuratiertes Portal für', 'Un portal curado de', 'Кураторский портал', 'Um portal curado de'],
  ab_title_b: ['Mã nguồn mở hiệu năng cao', 'Open-Source Artifacts', '高性能オープンソース', '高性能开源项目', '고성능 오픈소스', 'projets open source performants', 'leistungsstarke Open-Source-Projekte', 'proyectos de código abierto de alto rendimiento', 'высокопроизводительных open-source проектов', 'projetos open source de alto desempenho'],
  ab_f1_t: ['Tuyển chọn & kiểm duyệt', 'Curated & Audited', '厳選＆検証済み', '精选且经审核', '엄선 & 검증', 'Sélectionné & audité', 'Kuratiert & geprüft', 'Curado y auditado', 'Отобрано и проверено', 'Curado e auditado'],
  ab_f1_d: [
    'Tổng hợp các kho GitHub chất lượng cao, được phân loại kỹ theo công nghệ, mức độ sẵn sàng cho sản xuất và giá trị thực tế.',
    'Aggregating high-caliber GitHub repositories, rigorously categorized by tech stack, production-readiness, and real-world utility.',
    '質の高いGitHubリポジトリを集め、技術スタック・本番運用への適合度・実用性ごとに厳密に分類しています。',
    '汇集高质量 GitHub 仓库，并按技术栈、生产就绪程度和实际用途严格分类。',
    '고품질 GitHub 저장소를 모아 기술 스택, 실서비스 적합도, 실제 활용도에 따라 엄격하게 분류했습니다.',
    'Des dépôts GitHub de haut niveau, classés avec rigueur selon la pile technique, la maturité en production et l’utilité réelle.',
    'Hochwertige GitHub-Repositories, streng nach Tech-Stack, Produktionsreife und praktischem Nutzen kategorisiert.',
    'Reúne repositorios de GitHub de alto nivel, clasificados con rigor por stack tecnológico, preparación para producción y utilidad real.',
    'Подборка качественных репозиториев GitHub, строго разделённых по стеку, готовности к продакшену и практической пользе.',
    'Reúne repositórios do GitHub de alto nível, categorizados com rigor por stack, prontidão para produção e utilidade real.',
  ],
  ab_f2_t: ['Tăng tốc công việc', 'Accelerate Workflow', 'ワークフローを加速', '加速工作流程', '작업 속도 향상', 'Accélérez votre flux de travail', 'Arbeitsabläufe beschleunigen', 'Acelera tu flujo de trabajo', 'Ускорьте рабочий процесс', 'Acelere seu fluxo de trabalho'],
  ab_f2_d: [
    'Giúp kỹ sư và lập trình viên tìm ngay mẫu dự án, bộ khung kiến trúc và mã nguồn module hóa chỉ trong vài phút.',
    'Empowering engineers and developers to instantly discover templates, architectural boilerplates, and modular codebases within minutes.',
    'テンプレート、アーキテクチャのボイラープレート、モジュール化されたコードベースを数分で見つけられます。',
    '帮助工程师和开发者在几分钟内找到模板、架构脚手架和模块化代码库。',
    '엔지니어와 개발자가 템플릿, 아키텍처 보일러플레이트, 모듈형 코드베이스를 몇 분 안에 찾을 수 있습니다.',
    'Aide les ingénieurs et développeurs à trouver en quelques minutes modèles, squelettes d’architecture et bases de code modulaires.',
    'Ingenieure und Entwickler finden in Minuten Vorlagen, Architektur-Boilerplates und modulare Codebasen.',
    'Permite a ingenieros y desarrolladores encontrar en minutos plantillas, bases de arquitectura y código modular.',
    'Помогает инженерам и разработчикам за минуты находить шаблоны, архитектурные заготовки и модульные кодовые базы.',
    'Ajuda engenheiros e desenvolvedores a encontrar em minutos templates, bases de arquitetura e códigos modulares.',
  ],
  ab_f3_t: ['Hệ sinh thái đa nền tảng', 'Cross-Platform Ecosystem', 'クロスプラットフォームのエコシステム', '跨平台生态系统', '크로스 플랫폼 생태계', 'Écosystème multiplateforme', 'Plattformübergreifendes Ökosystem', 'Ecosistema multiplataforma', 'Кроссплатформенная экосистема', 'Ecossistema multiplataforma'],
  ab_f3_d: [
    'Bao quát phát triển web, framework di động, AI & học máy, đến hạ tầng đám mây và công cụ DevOps cấp doanh nghiệp.',
    'Spanning Web Development, Mobile Frameworks, AI & Machine Learning, to enterprise-grade Cloud Infrastructure and DevOps tooling.',
    'Web開発やモバイルフレームワーク、AI・機械学習から、エンタープライズ級のクラウド基盤やDevOpsツールまで網羅します。',
    '涵盖 Web 开发、移动框架、AI 与机器学习，直至企业级云基础设施和 DevOps 工具。',
    '웹 개발, 모바일 프레임워크, AI·머신러닝부터 엔터프라이즈급 클라우드 인프라와 DevOps 도구까지 아우릅니다.',
    'Du développement web aux frameworks mobiles, de l’IA et du machine learning à l’infrastructure cloud et aux outils DevOps d’entreprise.',
    'Von Webentwicklung und Mobile-Frameworks über KI und Machine Learning bis zu Cloud-Infrastruktur und DevOps-Tools für Unternehmen.',
    'Abarca desarrollo web, frameworks móviles, IA y aprendizaje automático, hasta infraestructura cloud y herramientas DevOps empresariales.',
    'От веб-разработки и мобильных фреймворков до ИИ, машинного обучения, облачной инфраструктуры и DevOps корпоративного уровня.',
    'Do desenvolvimento web e frameworks móveis a IA, aprendizado de máquina, infraestrutura em nuvem e ferramentas DevOps corporativas.',
  ],
  ab_f4_t: ['Do cộng đồng dẫn dắt', 'Community-Driven', 'コミュニティ主導', '社区驱动', '커뮤니티 중심', 'Porté par la communauté', 'Community-getrieben', 'Impulsado por la comunidad', 'Развивается сообществом', 'Movido pela comunidade'],
  ab_f4_d: [
    'Trung tâm mở kết nối lập trình viên mã nguồn mở khắp thế giới để trao đổi kiến thức kiến trúc, cùng viết mã và mở rộng phần mềm tự do.',
    'An open hub uniting open-source developers worldwide to exchange architectural knowledge, collaborate on code, and expand free software.',
    '世界中のオープンソース開発者が集い、設計の知見を交換し、コードを共同開発し、フリーソフトウェアを広げるオープンなハブです。',
    '一个开放的枢纽，汇聚全球开源开发者，交流架构知识、协作编码并壮大自由软件。',
    '전 세계 오픈소스 개발자가 모여 아키텍처 지식을 나누고, 함께 코딩하며, 자유 소프트웨어를 넓혀 가는 열린 허브입니다.',
    'Un hub ouvert qui réunit les développeurs open source du monde entier pour partager leurs savoirs, coder ensemble et faire grandir le logiciel libre.',
    'Ein offener Hub, der Open-Source-Entwickler weltweit vernetzt, um Architekturwissen zu teilen, gemeinsam zu programmieren und freie Software zu fördern.',
    'Un centro abierto que une a desarrolladores de código abierto de todo el mundo para compartir conocimiento, colaborar en código y ampliar el software libre.',
    'Открытая площадка, объединяющая разработчиков open source по всему миру: обмен знаниями, совместная работа над кодом и развитие свободного ПО.',
    'Um hub aberto que une desenvolvedores open source do mundo todo para trocar conhecimento, colaborar em código e ampliar o software livre.',
  ],

  // ---------- Footer ----------
  ft_brand: [
    'Thương hiệu HKA, do một nhóm ba thành viên cùng sáng lập và vận hành.',
    'The HKA brand, co-founded and operated by a collaborative team of three members.',
    'HKAブランドは、3名のチームが共同で設立・運営しています。',
    'HKA 品牌由三位成员组成的团队共同创立并运营。',
    'HKA 브랜드는 세 명의 팀원이 함께 설립하고 운영합니다.',
    'La marque HKA, cofondée et exploitée par une équipe collaborative de trois membres.',
    'Die Marke HKA wird von einem Team aus drei Mitgliedern gemeinsam gegründet und betrieben.',
    'La marca HKA, cofundada y gestionada por un equipo colaborativo de tres miembros.',
    'Бренд HKA основан и управляется командой из трёх человек.',
    'A marca HKA, cofundada e operada por uma equipe colaborativa de três membros.',
  ],
  ft_desc: [
    'Nền tảng web chuyên khảo sát, khám phá và tìm hiểu các kho mã nguồn mở nhiều tiềm năng. Chúng tôi cung cấp tích hợp tài nguyên, quản lý rủi ro và triển khai dự án chiến lược, mang lại giá trị vượt trội cho lập trình viên và đối tác trên toàn thế giới.',
    'The web platform is designed to specialize in surveying, discovering, and exploring high-potential open-source repositories. We provide resource integration, risk management, and strategic project deployments that deliver exceptional value to developers and partners worldwide.',
    'このウェブプラットフォームは、将来性の高いオープンソースリポジトリの調査・発見・探索に特化しています。リソース統合、リスク管理、戦略的なプロジェクト展開を通じて、世界中の開発者とパートナーに卓越した価値を提供します。',
    '本网站平台专注于调研、发现和探索极具潜力的开源仓库。我们提供资源整合、风险管理和战略性项目部署，为全球开发者和合作伙伴创造卓越价值。',
    '이 웹 플랫폼은 잠재력이 높은 오픈소스 저장소를 조사하고 발견하고 탐색하는 데 특화되어 있습니다. 자원 통합, 위험 관리, 전략적 프로젝트 배포를 제공하여 전 세계 개발자와 파트너에게 뛰어난 가치를 전합니다.',
    'Cette plateforme web est conçue pour étudier, découvrir et explorer des dépôts open source à fort potentiel. Nous proposons intégration de ressources, gestion des risques et déploiements stratégiques de projets, pour une valeur exceptionnelle auprès des développeurs et partenaires du monde entier.',
    'Die Webplattform ist darauf spezialisiert, vielversprechende Open-Source-Repositories zu recherchieren, zu entdecken und zu erkunden. Wir bieten Ressourcenintegration, Risikomanagement und strategische Projektumsetzung, die Entwicklern und Partnern weltweit außergewöhnlichen Mehrwert bringen.',
    'La plataforma web se especializa en analizar, descubrir y explorar repositorios de código abierto con gran potencial. Ofrecemos integración de recursos, gestión de riesgos y despliegue estratégico de proyectos que aportan un valor excepcional a desarrolladores y socios de todo el mundo.',
    'Веб-платформа специализируется на изучении, поиске и исследовании перспективных open-source репозиториев. Мы предлагаем интеграцию ресурсов, управление рисками и стратегическое внедрение проектов, приносящие исключительную ценность разработчикам и партнёрам по всему миру.',
    'A plataforma web é especializada em pesquisar, descobrir e explorar repositórios open source de alto potencial. Oferecemos integração de recursos, gestão de riscos e implantação estratégica de projetos, entregando valor excepcional a desenvolvedores e parceiros em todo o mundo.',
  ],
  ft_rights: ['© 2026 HKA. Bảo lưu mọi quyền.', '© 2026 HKA. All Rights Reserved.', '© 2026 HKA. 無断転載を禁じます。', '© 2026 HKA. 保留所有权利。', '© 2026 HKA. 모든 권리 보유.', '© 2026 HKA. Tous droits réservés.', '© 2026 HKA. Alle Rechte vorbehalten.', '© 2026 HKA. Todos los derechos reservados.', '© 2026 HKA. Все права защищены.', '© 2026 HKA. Todos os direitos reservados.'],

  // ---------- Thanh phụ cuối trang ----------
  sn_repos: ['Kho mã nguồn', 'Repositories', 'リポジトリ', '仓库', '저장소', 'Dépôts', 'Repositories', 'Repositorios', 'Репозитории', 'Repositórios'],
  sn_discussions: ['Thảo luận', 'Discussions', 'ディスカッション', '讨论', '토론', 'Discussions', 'Diskussionen', 'Debates', 'Обсуждения', 'Discussões'],
  sn_support: ['Hỗ trợ & Hỏi đáp', 'Support & FAQ', 'サポート＆FAQ', '支持与常见问题', '지원 & FAQ', 'Assistance & FAQ', 'Support & FAQ', 'Soporte y FAQ', 'Поддержка и FAQ', 'Suporte e FAQ'],
  sn_sponsor: ['Tài trợ', 'Sponsor', 'スポンサー', '赞助', '후원', 'Soutenir', 'Sponsern', 'Patrocinar', 'Спонсировать', 'Patrocinar'],
  sn_top: ['Lên đầu trang', 'Scroll to top', 'ページ上部へ', '回到顶部', '맨 위로', 'Haut de page', 'Nach oben', 'Ir arriba', 'Наверх', 'Voltar ao topo'],

  // ---------- Popup đăng nhập / đăng ký ----------
  auth_category: ['Xác thực', 'Authentication', '認証', '身份验证', '인증', 'Authentification', 'Authentifizierung', 'Autenticación', 'Аутентификация', 'Autenticação'],
  auth_create: ['Tạo tài khoản', 'Create an account', 'アカウントを作成', '创建账户', '계정 만들기', 'Créer un compte', 'Konto erstellen', 'Crear una cuenta', 'Создать аккаунт', 'Criar uma conta'],
  auth_welcome: ['Chào mừng trở lại', 'Welcome back', 'おかえりなさい', '欢迎回来', '다시 오신 것을 환영합니다', 'Bon retour', 'Willkommen zurück', 'Bienvenido de nuevo', 'С возвращением', 'Bem-vindo de volta'],
  auth_signup_sub: ['Đăng ký để lưu repo và dùng các tính năng dành cho lập trình viên.', 'Sign up to bookmark repositories and access dev features.', '登録すると、リポジトリを保存して開発者向け機能を使えます。', '注册后即可收藏仓库并使用开发者功能。', '가입하면 저장소를 북마크하고 개발자 기능을 사용할 수 있습니다.', 'Inscrivez-vous pour enregistrer des dépôts et accéder aux fonctions pour développeurs.', 'Registriere dich, um Repositories zu speichern und Entwicklerfunktionen zu nutzen.', 'Regístrate para guardar repositorios y acceder a funciones para desarrolladores.', 'Зарегистрируйтесь, чтобы сохранять репозитории и пользоваться функциями для разработчиков.', 'Cadastre-se para salvar repositórios e acessar recursos para desenvolvedores.'],
  auth_signin_sub: ['Đăng nhập để vào bảng điều khiển cá nhân.', 'Sign in to access your personal dashboard.', 'ログインして個人ダッシュボードにアクセスします。', '登录以访问你的个人面板。', '로그인하여 개인 대시보드에 접속하세요.', 'Connectez-vous pour accéder à votre tableau de bord personnel.', 'Melde dich an, um auf dein persönliches Dashboard zuzugreifen.', 'Inicia sesión para acceder a tu panel personal.', 'Войдите, чтобы открыть личную панель.', 'Entre para acessar seu painel pessoal.'],
  auth_id_ph: ['Email hoặc số điện thoại', 'Email or phone number', 'メールアドレスまたは電話番号', '邮箱或手机号', '이메일 또는 전화번호', 'E-mail ou numéro de téléphone', 'E-Mail oder Telefonnummer', 'Correo o número de teléfono', 'Email или номер телефона', 'E-mail ou número de telefone'],
  auth_pw_ph: ['Mật khẩu', 'Password', 'パスワード', '密码', '비밀번호', 'Mot de passe', 'Passwort', 'Contraseña', 'Пароль', 'Senha'],
  auth_confirm_ph: ['Nhập lại mật khẩu', 'Confirm password', 'パスワード（確認）', '确认密码', '비밀번호 확인', 'Confirmer le mot de passe', 'Passwort bestätigen', 'Confirmar contraseña', 'Подтвердите пароль', 'Confirmar senha'],
  auth_mismatch: ['Mật khẩu không khớp.', 'Passwords do not match.', 'パスワードが一致しません。', '两次输入的密码不一致。', '비밀번호가 일치하지 않습니다.', 'Les mots de passe ne correspondent pas.', 'Die Passwörter stimmen nicht überein.', 'Las contraseñas no coinciden.', 'Пароли не совпадают.', 'As senhas não coincidem.'],
  auth_have: ['Đã có tài khoản?', 'Already have an account?', 'すでにアカウントをお持ちですか？', '已有账户？', '이미 계정이 있나요?', 'Vous avez déjà un compte ?', 'Du hast bereits ein Konto?', '¿Ya tienes una cuenta?', 'Уже есть аккаунт?', 'Já tem uma conta?'],
  auth_no_have: ['Chưa có tài khoản?', 'Don’t have an account?', 'アカウントをお持ちでないですか？', '还没有账户？', '계정이 없나요?', 'Pas encore de compte ?', 'Noch kein Konto?', '¿No tienes una cuenta?', 'Нет аккаунта?', 'Não tem uma conta?'],
  auth_or: ['Hoặc tiếp tục với', 'Or continue with', 'または次で続行', '或使用以下方式继续', '또는 다음으로 계속', 'Ou continuer avec', 'Oder weiter mit', 'O continúa con', 'Или продолжите через', 'Ou continue com'],
  auth_oauth_fail: ['Đăng nhập OAuth thất bại.', 'OAuth authentication failed.', 'OAuth認証に失敗しました。', 'OAuth 认证失败。', 'OAuth 인증에 실패했습니다.', 'Échec de l’authentification OAuth.', 'OAuth-Authentifizierung fehlgeschlagen.', 'Falló la autenticación OAuth.', 'Не удалось пройти OAuth-аутентификацию.', 'Falha na autenticação OAuth.'],

  // ---------- 404 ----------
  nf_text: ['Trang bạn tìm không tồn tại.', 'The page you are looking for does not exist.', 'お探しのページは存在しません。', '你要找的页面不存在。', '찾으시는 페이지가 존재하지 않습니다.', 'La page que vous cherchez n’existe pas.', 'Die gesuchte Seite existiert nicht.', 'La página que buscas no existe.', 'Страница, которую вы ищете, не существует.', 'A página que você procura não existe.'],
  nf_home: ['⬅️ Về trang chủ', '⬅️ Back to home', '⬅️ ホームへ戻る', '⬅️ 返回首页', '⬅️ 홈으로 돌아가기', '⬅️ Retour à l’accueil', '⬅️ Zur Startseite', '⬅️ Volver al inicio', '⬅️ На главную', '⬅️ Voltar ao início'],

  // ---------- Trang Tin tức ----------
  nw_back: ['← Quay lại', '← Back', '← 戻る', '← 返回', '← 뒤로', '← Retour', '← Zurück', '← Volver', '← Назад', '← Voltar'],
  nw_title: ['Tin tức mã nguồn mở', 'Open-source News', 'オープンソースニュース', '开源资讯', '오픈소스 뉴스', 'Actualités open source', 'Open-Source-News', 'Noticias de código abierto', 'Новости open source', 'Notícias de código aberto'],
  nw_searching: ['Đang tìm…', 'Searching…', '検索中…', '搜索中…', '검색 중…', 'Recherche…', 'Suche läuft…', 'Buscando…', 'Поиск…', 'Pesquisando…'],
  nw_results: ['{n} kết quả', '{n} results', '{n} 件の結果', '{n} 条结果', '결과 {n}개', '{n} résultats', '{n} Ergebnisse', '{n} resultados', 'Результатов: {n}', '{n} resultados'],
  nw_updating: ['Đang cập nhật…', 'Updating…', '更新中…', '更新中…', '업데이트 중…', 'Mise à jour…', 'Aktualisierung…', 'Actualizando…', 'Обновление…', 'Atualizando…'],
  nw_updated: ['Cập nhật {t}', 'Updated {t}', '{t}に更新', '{t}更新', '{t} 업데이트', 'Mis à jour {t}', 'Aktualisiert {t}', 'Actualizado {t}', 'Обновлено {t}', 'Atualizado {t}'],
  nw_waiting: ['Đang chờ…', 'Waiting…', '待機中…', '等待中…', '대기 중…', 'En attente…', 'Warten…', 'Esperando…', 'Ожидание…', 'Aguardando…'],
  nw_auto: ['Tự làm mới', 'Auto-refresh', '自動更新', '自动刷新', '자동 새로고침', 'Actualisation auto', 'Auto-Aktualisierung', 'Actualización automática', 'Автообновление', 'Atualização automática'],
  nw_off: ['Tắt', 'Off', 'オフ', '关闭', '끄기', 'Désactivé', 'Aus', 'Apagado', 'Выкл.', 'Desligado'],
  nw_min: ['{n} phút', '{n} min', '{n}分', '{n} 分钟', '{n}분', '{n} min', '{n} Min.', '{n} min', '{n} мин', '{n} min'],
  nw_refresh: ['↻ Làm mới', '↻ Refresh', '↻ 更新', '↻ 刷新', '↻ 새로고침', '↻ Actualiser', '↻ Aktualisieren', '↻ Actualizar', '↻ Обновить', '↻ Atualizar'],
  nw_results_for: ['Kết quả cho “{q}”', 'Results for “{q}”', '「{q}」の検索結果', '“{q}”的搜索结果', '“{q}” 검색 결과', 'Résultats pour « {q} »', 'Ergebnisse für „{q}“', 'Resultados para “{q}”', 'Результаты по запросу «{q}»', 'Resultados para “{q}”'],
  nw_head_search: ['Đang tìm trên GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News và Stack Overflow.', 'Searching GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News and Stack Overflow.', 'GitHub、GitLab、npm、crates.io、Hugging Face、Hacker News、Stack Overflow を検索しています。', '正在搜索 GitHub、GitLab、npm、crates.io、Hugging Face、Hacker News 和 Stack Overflow。', 'GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News, Stack Overflow에서 검색 중입니다.', 'Recherche sur GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News et Stack Overflow.', 'Suche auf GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News und Stack Overflow.', 'Buscando en GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News y Stack Overflow.', 'Поиск по GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News и Stack Overflow.', 'Pesquisando no GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News e Stack Overflow.'],
  nw_head_feed: ['Kho mã, bài viết, thảo luận và bài đăng mới nhất. Gõ từ khóa để tìm bất kỳ dự án nào.', 'Latest repositories, articles, discussions and posts. Type a keyword to search any project.', '最新のリポジトリ、記事、ディスカッション、投稿。キーワードを入力すると任意のプロジェクトを検索できます。', '最新的仓库、文章、讨论和帖子。输入关键词即可搜索任意项目。', '최신 저장소, 글, 토론, 게시물. 키워드를 입력하면 어떤 프로젝트든 검색할 수 있습니다.', 'Derniers dépôts, articles, discussions et publications. Saisissez un mot-clé pour chercher n’importe quel projet.', 'Neueste Repositories, Artikel, Diskussionen und Beiträge. Gib ein Stichwort ein, um jedes Projekt zu suchen.', 'Últimos repositorios, artículos, debates y publicaciones. Escribe una palabra clave para buscar cualquier proyecto.', 'Свежие репозитории, статьи, обсуждения и посты. Введите ключевое слово, чтобы найти любой проект.', 'Últimos repositórios, artigos, discussões e publicações. Digite uma palavra-chave para buscar qualquer projeto.'],
  nw_search_ph: ['Tìm dự án, gói hoặc chủ đề… (vd: react, ollama, redis)', 'Search any project, package or topic… (e.g. react, ollama, redis)', 'プロジェクト・パッケージ・トピックを検索…（例: react, ollama, redis）', '搜索项目、软件包或主题…（如 react、ollama、redis）', '프로젝트, 패키지, 주제 검색… (예: react, ollama, redis)', 'Rechercher un projet, un paquet ou un sujet… (ex. react, ollama, redis)', 'Projekt, Paket oder Thema suchen… (z. B. react, ollama, redis)', 'Busca un proyecto, paquete o tema… (p. ej. react, ollama, redis)', 'Поиск проекта, пакета или темы… (например, react, ollama, redis)', 'Busque um projeto, pacote ou tema… (ex.: react, ollama, redis)'],
  nw_search_aria: ['Tìm dự án', 'Search projects', 'プロジェクトを検索', '搜索项目', '프로젝트 검색', 'Rechercher des projets', 'Projekte suchen', 'Buscar proyectos', 'Поиск проектов', 'Buscar projetos'],
  nw_type: ['Loại', 'Type', '種類', '类型', '유형', 'Type', 'Typ', 'Tipo', 'Тип', 'Tipo'],
  nw_all_sources: ['Tất cả nguồn', 'All sources', 'すべてのソース', '所有来源', '모든 출처', 'Toutes les sources', 'Alle Quellen', 'Todas las fuentes', 'Все источники', 'Todas as fontes'],
  nw_source: ['Nguồn', 'Source', 'ソース', '来源', '출처', 'Source', 'Quelle', 'Fuente', 'Источник', 'Fonte'],
  nw_sort: ['Sắp xếp', 'Sort', '並べ替え', '排序', '정렬', 'Trier', 'Sortieren', 'Ordenar', 'Сортировка', 'Ordenar'],
  nw_best: ['Khớp nhất', 'Best match', '最も関連性が高い', '最佳匹配', '관련도순', 'Pertinence', 'Beste Übereinstimmung', 'Mejor coincidencia', 'Лучшее совпадение', 'Melhor correspondência'],
  nw_newest: ['Hoạt động mới nhất', 'Newest activity', '最新のアクティビティ', '最新动态', '최근 활동순', 'Activité récente', 'Neueste Aktivität', 'Actividad más reciente', 'Недавняя активность', 'Atividade mais recente'],
  nw_show_new: ['↑ Hiện mục mới ({n})', '↑ Show new items ({n})', '↑ 新着を表示 ({n})', '↑ 显示新内容 ({n})', '↑ 새 항목 보기 ({n})', '↑ Afficher les nouveautés ({n})', '↑ Neue Einträge anzeigen ({n})', '↑ Mostrar novedades ({n})', '↑ Показать новые ({n})', '↑ Mostrar novidades ({n})'],
  nw_load_fail: ['Không tải được: {list}', 'Couldn’t load: {list}', '読み込めませんでした: {list}', '无法加载：{list}', '불러오지 못함: {list}', 'Chargement impossible : {list}', 'Laden fehlgeschlagen: {list}', 'No se pudo cargar: {list}', 'Не удалось загрузить: {list}', 'Não foi possível carregar: {list}'],
  nw_retry: [' (sẽ thử lại ở lần làm mới tiếp theo).', ' (will retry on next refresh).', '（次回の更新時に再試行します）。', '（下次刷新时将重试）。', ' (다음 새로고침 때 다시 시도합니다).', ' (nouvel essai à la prochaine actualisation).', ' (wird beim nächsten Aktualisieren erneut versucht).', ' (se reintentará en la próxima actualización).', ' (повторим при следующем обновлении).', ' (tentaremos novamente na próxima atualização).'],
  nw_no_results: ['Không có kết quả cho “{q}”. Hãy thử từ khóa khác.', 'No results for “{q}”. Try another keyword.', '「{q}」の結果はありません。別のキーワードをお試しください。', '没有找到“{q}”的结果。请尝试其他关键词。', '“{q}”에 대한 결과가 없습니다. 다른 키워드를 시도해 보세요.', 'Aucun résultat pour « {q} ». Essayez un autre mot-clé.', 'Keine Ergebnisse für „{q}“. Versuche ein anderes Stichwort.', 'Sin resultados para “{q}”. Prueba con otra palabra clave.', 'Ничего не найдено по запросу «{q}». Попробуйте другое слово.', 'Nenhum resultado para “{q}”. Tente outra palavra-chave.'],
  nw_no_match: ['Không có tin nào khớp bộ lọc.', 'No news matches your filters.', '条件に一致するニュースはありません。', '没有符合筛选条件的资讯。', '필터에 맞는 뉴스가 없습니다.', 'Aucune actualité ne correspond à vos filtres.', 'Keine News entsprechen deinen Filtern.', 'Ninguna noticia coincide con tus filtros.', 'Нет новостей, подходящих под фильтры.', 'Nenhuma notícia corresponde aos filtros.'],
  nw_loading: ['Đang tải…', 'Loading…', '読み込み中…', '加载中…', '불러오는 중…', 'Chargement…', 'Wird geladen…', 'Cargando…', 'Загрузка…', 'Carregando…'],
  nw_show_more: ['Xem thêm (còn {n})', 'Show more ({n} left)', 'さらに表示（残り {n} 件）', '显示更多（还剩 {n} 条）', '더 보기 ({n}개 남음)', 'Afficher plus ({n} restants)', 'Mehr anzeigen ({n} übrig)', 'Mostrar más (quedan {n})', 'Показать ещё (осталось {n})', 'Mostrar mais (restam {n})'],
  nw_load_more: ['Tải thêm kết quả', 'Load more results', 'さらに結果を読み込む', '加载更多结果', '결과 더 불러오기', 'Charger plus de résultats', 'Weitere Ergebnisse laden', 'Cargar más resultados', 'Загрузить ещё результаты', 'Carregar mais resultados'],
  nw_k_all: ['Tất cả', 'All', 'すべて', '全部', '전체', 'Tous', 'Alle', 'Todos', 'Все', 'Todos'],
  nw_k_repo: ['Kho mã', 'Repositories', 'リポジトリ', '仓库', '저장소', 'Dépôts', 'Repositories', 'Repositorios', 'Репозитории', 'Repositórios'],
  nw_k_package: ['Gói', 'Packages', 'パッケージ', '软件包', '패키지', 'Paquets', 'Pakete', 'Paquetes', 'Пакеты', 'Pacotes'],
  nw_k_article: ['Bài viết', 'Articles', '記事', '文章', '글', 'Articles', 'Artikel', 'Artículos', 'Статьи', 'Artigos'],
  nw_k_discussion: ['Thảo luận', 'Discussions', 'ディスカッション', '讨论', '토론', 'Discussions', 'Diskussionen', 'Debates', 'Обсуждения', 'Discussões'],
  nw_k_social: ['Mạng xã hội', 'Social', 'ソーシャル', '社交', '소셜', 'Réseaux sociaux', 'Soziale Medien', 'Redes sociales', 'Соцсети', 'Redes sociais'],
  nw_t_repo: ['Kho mã', 'Repo', 'リポジトリ', '仓库', '저장소', 'Dépôt', 'Repo', 'Repo', 'Репо', 'Repo'],
  nw_t_package: ['Gói', 'Package', 'パッケージ', '软件包', '패키지', 'Paquet', 'Paket', 'Paquete', 'Пакет', 'Pacote'],
  nw_t_article: ['Bài viết', 'Article', '記事', '文章', '글', 'Article', 'Artikel', 'Artículo', 'Статья', 'Artigo'],
  nw_t_discussion: ['Thảo luận', 'Discussion', 'ディスカッション', '讨论', '토론', 'Discussion', 'Diskussion', 'Debate', 'Обсуждение', 'Discussão'],
  nw_t_social: ['Mạng xã hội', 'Social', 'ソーシャル', '社交', '소셜', 'Social', 'Social', 'Social', 'Соцсети', 'Social'],
  nw_now: ['vừa xong', 'just now', 'たった今', '刚刚', '방금', 'à l’instant', 'gerade eben', 'ahora mismo', 'только что', 'agora mesmo'],
  nw_ago_m: ['{n} phút trước', '{n}m ago', '{n}分前', '{n} 分钟前', '{n}분 전', 'il y a {n} min', 'vor {n} Min.', 'hace {n} min', '{n} мин назад', 'há {n} min'],
  nw_ago_h: ['{n} giờ trước', '{n}h ago', '{n}時間前', '{n} 小时前', '{n}시간 전', 'il y a {n} h', 'vor {n} Std.', 'hace {n} h', '{n} ч назад', 'há {n} h'],
  nw_ago_d: ['{n} ngày trước', '{n}d ago', '{n}日前', '{n} 天前', '{n}일 전', 'il y a {n} j', 'vor {n} Tg.', 'hace {n} d', '{n} дн. назад', 'há {n} d'],
};

export const EXTRA_STRINGS = {};
ORDER.forEach((code) => { EXTRA_STRINGS[code] = {}; });
Object.entries(E).forEach(([key, arr]) => {
  ORDER.forEach((code, i) => { EXTRA_STRINGS[code][key] = arr[i]; });
});
