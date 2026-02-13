// ============================================
// src/lib/cv/cv-domains.ts
// Domain Definitions, Detection & Registry
// ============================================

import {
  CVDomain,
  CVDomainId,
  DomainSpecificSection,
} from '@/lib/types/cv-domain.types';

// ═══════════════════════════════════════════
// تعریف تمام حوزه‌های شغلی
// ═══════════════════════════════════════════

export const CV_DOMAINS: Record<CVDomainId, CVDomain> = {

  // ─────────────────────────────────────────
  // TECHNOLOGY
  // ─────────────────────────────────────────

  software_engineering: {
    id: 'software_engineering',
    label_en: 'Software Engineering',
    label_fa: 'مهندسی نرم‌افزار',
    icon: '💻',
    description_en: 'Software development, web, mobile, backend, frontend, DevOps',
    description_fa: 'توسعه نرم‌افزار، وب، موبایل، بک‌اند، فرانت‌اند، دوآپس',
    specific_sections: [
      {
        id: 'technical_skills',
        label_en: 'Technical Skills & Stack',
        label_fa: 'مهارت‌های فنی و استک فناوری',
        description_en: 'Programming languages, frameworks, tools, and platforms you work with',
        description_fa: 'زبان‌های برنامه‌نویسی، فریمورک‌ها، ابزارها و پلتفرم‌ها',
        is_required: true,
        example_en: 'React, TypeScript, Node.js, PostgreSQL, AWS, Docker, Git',
        example_fa: 'React, TypeScript, Node.js, PostgreSQL, AWS, Docker, Git',
      },
      {
        id: 'github_portfolio',
        label_en: 'GitHub / Portfolio Links',
        label_fa: 'لینک‌های گیت‌هاب / نمونه‌کار',
        description_en: 'Links to your GitHub profile, portfolio website, or notable open-source contributions',
        description_fa: 'لینک پروفایل گیت‌هاب، وبسایت نمونه‌کار، یا مشارکت‌های متن‌باز',
        is_required: false,
        example_en: 'github.com/username, portfolio.dev',
        example_fa: 'github.com/username, portfolio.dev',
      },
      {
        id: 'system_design',
        label_en: 'System Design / Architecture Experience',
        label_fa: 'تجربه طراحی سیستم / معماری',
        description_en: 'Experience with designing scalable systems, microservices, APIs',
        description_fa: 'تجربه طراحی سیستم‌های مقیاس‌پذیر، میکروسرویس، APIها',
        is_required: false,
        example_en: 'Designed microservices architecture handling 1M+ requests/day',
        example_fa: 'طراحی معماری میکروسرویس با پردازش بیش از ۱ میلیون درخواست در روز',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'skills',
      'work_experience',
      'projects',
      'personal_info.website_url',
    ],
    detection_keywords: [
      'software', 'developer', 'engineer', 'programming', 'code',
      'frontend', 'backend', 'fullstack', 'full-stack', 'devops',
      'api', 'database', 'react', 'python', 'javascript', 'java',
      'typescript', 'node', 'aws', 'docker', 'kubernetes', 'git',
      'agile', 'scrum', 'ci/cd', 'microservice', 'web development',
      'mobile development', 'cloud', 'saas',
    ],
  },

  data_science: {
    id: 'data_science',
    label_en: 'Data Science & AI/ML',
    label_fa: 'علم داده و هوش مصنوعی',
    icon: '📊',
    description_en: 'Data analysis, machine learning, deep learning, NLP, computer vision',
    description_fa: 'تحلیل داده، یادگیری ماشین، یادگیری عمیق، پردازش زبان طبیعی',
    specific_sections: [
      {
        id: 'ml_frameworks',
        label_en: 'ML/AI Frameworks & Tools',
        label_fa: 'فریمورک‌ها و ابزارهای ML/AI',
        description_en: 'TensorFlow, PyTorch, scikit-learn, pandas, etc.',
        description_fa: 'TensorFlow, PyTorch, scikit-learn, pandas و غیره',
        is_required: true,
        example_en: 'TensorFlow 2.x, PyTorch, scikit-learn, Hugging Face Transformers',
        example_fa: 'TensorFlow 2.x, PyTorch, scikit-learn, Hugging Face Transformers',
      },
      {
        id: 'publications',
        label_en: 'Research Publications',
        label_fa: 'مقالات و انتشارات پژوهشی',
        description_en: 'Published papers, conference presentations, research work',
        description_fa: 'مقالات منتشرشده، ارائه‌های کنفرانس، کارهای پژوهشی',
        is_required: false,
        example_en: 'Published 3 papers in NeurIPS, ICML on transformer architectures',
        example_fa: 'انتشار ۳ مقاله در NeurIPS و ICML درباره معماری ترنسفورمر',
      },
      {
        id: 'datasets_models',
        label_en: 'Datasets & Models',
        label_fa: 'دیتاست‌ها و مدل‌ها',
        description_en: 'Notable datasets created, models trained, or Kaggle competitions',
        description_fa: 'دیتاست‌های ایجادشده، مدل‌های آموزش‌دیده، یا رقابت‌های Kaggle',
        is_required: false,
        example_en: 'Kaggle Expert with 2 gold medals; trained GPT-based model for Farsi NLP',
        example_fa: 'متخصص Kaggle با ۲ مدال طلا؛ آموزش مدل مبتنی بر GPT برای NLP فارسی',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'skills',
      'work_experience',
      'projects',
      'education',
    ],
    detection_keywords: [
      'data science', 'machine learning', 'deep learning', 'ai',
      'artificial intelligence', 'nlp', 'computer vision', 'tensorflow',
      'pytorch', 'pandas', 'statistics', 'model', 'neural network',
      'kaggle', 'data analysis', 'big data', 'spark', 'data engineer',
      'feature engineering', 'mlops', 'jupyter', 'numpy', 'scipy',
    ],
  },

  product_management: {
    id: 'product_management',
    label_en: 'Product Management',
    label_fa: 'مدیریت محصول',
    icon: '🎯',
    description_en: 'Product strategy, roadmapping, agile, user research',
    description_fa: 'استراتژی محصول، نقشه‌راه، چابک، تحقیقات کاربر',
    specific_sections: [
      {
        id: 'product_metrics',
        label_en: 'Product Metrics & Impact',
        label_fa: 'معیارهای محصول و تأثیرگذاری',
        description_en: 'Key metrics you improved: DAU, retention, conversion, revenue',
        description_fa: 'معیارهای کلیدی که بهبود دادید: DAU، نرخ بازگشت، تبدیل، درآمد',
        is_required: true,
        example_en: 'Increased user retention by 25% through redesigned onboarding flow',
        example_fa: 'افزایش ۲۵٪ نرخ بازگشت کاربر از طریق بازطراحی فرآیند آن‌بوردینگ',
      },
      {
        id: 'stakeholder_management',
        label_en: 'Stakeholder Management',
        label_fa: 'مدیریت ذینفعان',
        description_en: 'Experience working with cross-functional teams, executives',
        description_fa: 'تجربه کار با تیم‌های بین‌رشته‌ای و مدیران ارشد',
        is_required: false,
        example_en: 'Led cross-functional team of 12 across engineering, design, and marketing',
        example_fa: 'رهبری تیم ۱۲ نفره بین‌رشته‌ای شامل مهندسی، طراحی و بازاریابی',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'skills',
      'education',
    ],
    detection_keywords: [
      'product manager', 'product owner', 'roadmap', 'agile', 'scrum',
      'user story', 'backlog', 'sprint', 'stakeholder', 'mvp',
      'a/b test', 'user research', 'product strategy', 'product lead',
      'prd', 'okr', 'kpi', 'jira', 'confluence',
    ],
  },

  design_ux: {
    id: 'design_ux',
    label_en: 'Design & UX',
    label_fa: 'طراحی و تجربه کاربری',
    icon: '🎨',
    description_en: 'UI/UX design, graphic design, visual design, interaction design',
    description_fa: 'طراحی رابط کاربری، طراحی تجربه کاربری، طراحی گرافیک',
    specific_sections: [
      {
        id: 'design_portfolio',
        label_en: 'Design Portfolio',
        label_fa: 'نمونه‌کارهای طراحی',
        description_en: 'Links to your design portfolio (Behance, Dribbble, personal site)',
        description_fa: 'لینک نمونه‌کارها (Behance, Dribbble, سایت شخصی)',
        is_required: true,
        example_en: 'behance.net/username, dribbble.com/username',
        example_fa: 'behance.net/username, dribbble.com/username',
      },
      {
        id: 'design_tools',
        label_en: 'Design Tools & Methods',
        label_fa: 'ابزارها و متدهای طراحی',
        description_en: 'Figma, Sketch, Adobe XD, user testing methods',
        description_fa: 'فیگما، اسکچ، ادوبی XD، روش‌های تست کاربر',
        is_required: true,
        example_en: 'Figma, Adobe Creative Suite, Principle, usability testing, design systems',
        example_fa: 'فیگما، مجموعه ادوبی، Principle، تست کاربردپذیری، سیستم‌های طراحی',
      },
      {
        id: 'design_process',
        label_en: 'Design Process & Methodology',
        label_fa: 'فرآیند و متدولوژی طراحی',
        description_en: 'Your design thinking process, research methods, iteration approach',
        description_fa: 'فرآیند تفکر طراحی، روش‌های تحقیق، رویکرد تکرار',
        is_required: false,
        example_en: 'Double Diamond process: Discovery → Define → Develop → Deliver with user testing at each phase',
        example_fa: 'فرآیند الماس دوگانه: کشف ← تعریف ← توسعه ← تحویل با تست کاربر در هر مرحله',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'personal_info.website_url',
      'work_experience',
      'projects',
      'skills',
    ],
    detection_keywords: [
      'designer', 'ux', 'ui', 'user experience', 'user interface',
      'figma', 'sketch', 'adobe', 'wireframe', 'prototype',
      'usability', 'interaction design', 'visual design',
      'design system', 'typography', 'accessibility', 'wcag',
    ],
  },

  // ─────────────────────────────────────────
  // BUSINESS
  // ─────────────────────────────────────────

  marketing: {
    id: 'marketing',
    label_en: 'Marketing & Growth',
    label_fa: 'بازاریابی و رشد',
    icon: '📈',
    description_en: 'Digital marketing, content, SEO, social media, brand management',
    description_fa: 'بازاریابی دیجیتال، محتوا، سئو، شبکه‌های اجتماعی، مدیریت برند',
    specific_sections: [
      {
        id: 'campaign_results',
        label_en: 'Campaign Results & Metrics',
        label_fa: 'نتایج کمپین‌ها و معیارها',
        description_en: 'ROI, conversion rates, growth metrics from campaigns you led',
        description_fa: 'ROI، نرخ تبدیل، معیارهای رشد از کمپین‌هایی که مدیریت کردید',
        is_required: true,
        example_en: 'Led campaign that increased organic traffic by 150% in 6 months; achieved 3.5x ROAS on paid campaigns',
        example_fa: 'مدیریت کمپینی که ترافیک ارگانیک را ۱۵۰٪ در ۶ ماه افزایش داد؛ دستیابی به ROAS 3.5x',
      },
      {
        id: 'marketing_tools',
        label_en: 'Marketing Tools & Platforms',
        label_fa: 'ابزارها و پلتفرم‌های بازاریابی',
        description_en: 'Google Analytics, HubSpot, Mailchimp, social media platforms',
        description_fa: 'Google Analytics, HubSpot, Mailchimp, پلتفرم‌های شبکه اجتماعی',
        is_required: true,
        example_en: 'Google Analytics 4, HubSpot, Hootsuite, Meta Ads Manager, SEMrush, Ahrefs',
        example_fa: 'Google Analytics 4, HubSpot, Hootsuite, Meta Ads Manager, SEMrush',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'skills',
    ],
    detection_keywords: [
      'marketing', 'seo', 'sem', 'social media', 'content',
      'brand', 'campaign', 'analytics', 'growth', 'conversion',
      'email marketing', 'digital marketing', 'ads', 'ppc',
      'google analytics', 'hubspot', 'copywriting', 'lead generation',
    ],
  },

  sales: {
    id: 'sales',
    label_en: 'Sales & Business Development',
    label_fa: 'فروش و توسعه کسب‌وکار',
    icon: '🤝',
    description_en: 'Sales, account management, business development, partnerships',
    description_fa: 'فروش، مدیریت حساب، توسعه کسب‌وکار، مشارکت‌ها',
    specific_sections: [
      {
        id: 'sales_metrics',
        label_en: 'Sales Performance & Quota',
        label_fa: 'عملکرد فروش و سهمیه',
        description_en: 'Revenue generated, quota attainment, deal sizes',
        description_fa: 'درآمد ایجادشده، تحقق سهمیه، حجم معاملات',
        is_required: true,
        example_en: 'Consistently exceeded quota by 120%; closed $2M+ in annual revenue; managed pipeline of $5M+',
        example_fa: 'تحقق مداوم ۱۲۰٪ سهمیه؛ بستن بیش از $2M درآمد سالانه؛ مدیریت خط فروش بیش از $5M',
      },
      {
        id: 'sales_tools',
        label_en: 'CRM & Sales Tools',
        label_fa: 'ابزارهای CRM و فروش',
        description_en: 'Salesforce, HubSpot CRM, outreach tools',
        description_fa: 'Salesforce, HubSpot CRM, ابزارهای ارتباطی',
        is_required: false,
        example_en: 'Salesforce (Advanced), HubSpot CRM, Outreach.io, LinkedIn Sales Navigator',
        example_fa: 'Salesforce (پیشرفته), HubSpot CRM, Outreach.io, LinkedIn Sales Navigator',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'skills',
    ],
    detection_keywords: [
      'sales', 'business development', 'account', 'quota',
      'revenue', 'pipeline', 'crm', 'salesforce', 'b2b', 'b2c',
      'closing', 'negotiation', 'client relationship', 'territory',
      'cold calling', 'lead', 'prospect', 'deal',
    ],
  },

  finance_accounting: {
    id: 'finance_accounting',
    label_en: 'Finance & Accounting',
    label_fa: 'مالی و حسابداری',
    icon: '💰',
    description_en: 'Financial analysis, accounting, banking, investment, audit',
    description_fa: 'تحلیل مالی، حسابداری، بانکداری، سرمایه‌گذاری، حسابرسی',
    specific_sections: [
      {
        id: 'financial_certifications',
        label_en: 'Financial Certifications',
        label_fa: 'گواهینامه‌های مالی',
        description_en: 'CPA, CFA, ACCA, or other relevant certifications',
        description_fa: 'CPA, CFA, ACCA یا سایر گواهینامه‌های مرتبط',
        is_required: true,
        example_en: 'CPA (Active), CFA Level III Candidate, ACCA Affiliate',
        example_fa: 'CPA (فعال)، داوطلب سطح ۳ CFA، عضو وابسته ACCA',
      },
      {
        id: 'financial_software',
        label_en: 'Financial Software & Tools',
        label_fa: 'نرم‌افزارها و ابزارهای مالی',
        description_en: 'SAP, QuickBooks, Bloomberg Terminal, Excel advanced skills',
        description_fa: 'SAP, QuickBooks, Bloomberg Terminal, مهارت‌های پیشرفته اکسل',
        is_required: false,
        example_en: 'SAP FICO, Bloomberg Terminal, Advanced Excel (VBA, Power Query), Tableau',
        example_fa: 'SAP FICO, Bloomberg Terminal, اکسل پیشرفته (VBA, Power Query), Tableau',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'certifications',
      'work_experience',
      'education',
    ],
    detection_keywords: [
      'finance', 'accounting', 'cpa', 'cfa', 'audit',
      'financial', 'banking', 'investment', 'tax', 'revenue',
      'budget', 'forecast', 'compliance', 'gaap', 'ifrs',
      'treasury', 'equity', 'portfolio', 'risk management',
    ],
  },

  consulting: {
    id: 'consulting',
    label_en: 'Consulting',
    label_fa: 'مشاوره',
    icon: '💼',
    description_en: 'Management consulting, strategy, technology consulting',
    description_fa: 'مشاوره مدیریت، استراتژی، مشاوره فناوری',
    specific_sections: [
      {
        id: 'case_studies',
        label_en: 'Key Engagements & Case Studies',
        label_fa: 'پروژه‌های کلیدی و مطالعات موردی',
        description_en: 'Notable client engagements, impact delivered, industries served',
        description_fa: 'پروژه‌های شاخص مشتری، تأثیرگذاری، صنایع خدمت‌رسانی‌شده',
        is_required: true,
        example_en: 'Led digital transformation for Fortune 500 retailer, resulting in $50M annual savings',
        example_fa: 'رهبری تحول دیجیتال برای شرکت Fortune 500 با صرفه‌جویی $50M سالانه',
      },
      {
        id: 'consulting_skills',
        label_en: 'Consulting Methodologies',
        label_fa: 'متدولوژی‌های مشاوره',
        description_en: 'Frameworks used: MECE, Porter\'s 5 Forces, BCG Matrix, etc.',
        description_fa: 'چارچوب‌های استفاده‌شده: MECE, Porter\'s 5 Forces, BCG Matrix و غیره',
        is_required: false,
        example_en: 'MECE problem structuring, financial modeling, stakeholder workshops',
        example_fa: 'ساختاردهی مسئله MECE، مدل‌سازی مالی، کارگاه‌های ذینفعان',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'education',
      'skills',
    ],
    detection_keywords: [
      'consultant', 'consulting', 'strategy', 'advisory',
      'mckinsey', 'bcg', 'bain', 'deloitte', 'pwc', 'accenture',
      'engagement', 'client', 'transformation', 'due diligence',
      'business case', 'recommendation', 'workshop',
    ],
  },

  operations_logistics: {
    id: 'operations_logistics',
    label_en: 'Operations & Supply Chain',
    label_fa: 'عملیات و زنجیره تأمین',
    icon: '📦',
    description_en: 'Operations management, supply chain, procurement, logistics',
    description_fa: 'مدیریت عملیات، زنجیره تأمین، تدارکات، لجستیک',
    specific_sections: [
      {
        id: 'ops_certifications',
        label_en: 'Operations Certifications',
        label_fa: 'گواهینامه‌های عملیاتی',
        description_en: 'Six Sigma, PMP, APICS, Lean certifications',
        description_fa: 'Six Sigma, PMP, APICS, گواهینامه‌های Lean',
        is_required: false,
        example_en: 'Six Sigma Black Belt, PMP, CSCP (APICS)',
        example_fa: 'Six Sigma Black Belt, PMP, CSCP (APICS)',
      },
      {
        id: 'ops_metrics',
        label_en: 'Operational Metrics & Achievements',
        label_fa: 'معیارهای عملیاتی و دستاوردها',
        description_en: 'Cost savings, efficiency improvements, inventory optimization results',
        description_fa: 'صرفه‌جویی هزینه، بهبود بهره‌وری، نتایج بهینه‌سازی موجودی',
        is_required: true,
        example_en: 'Reduced operational costs by 30%; improved delivery time by 25%; managed $10M inventory',
        example_fa: 'کاهش ۳۰٪ هزینه‌های عملیاتی؛ بهبود ۲۵٪ زمان تحویل؛ مدیریت موجودی $10M',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'certifications',
      'skills',
    ],
    detection_keywords: [
      'operations', 'supply chain', 'logistics', 'procurement',
      'inventory', 'warehouse', 'shipping', 'lean', 'six sigma',
      'quality', 'manufacturing', 'vendor management', 'erp',
      'continuous improvement', 'kaizen', 'kanban',
    ],
  },

  // ─────────────────────────────────────────
  // ENGINEERING
  // ─────────────────────────────────────────

  engineering_mechanical: {
    id: 'engineering_mechanical',
    label_en: 'Mechanical Engineering',
    label_fa: 'مهندسی مکانیک',
    icon: '⚙️',
    description_en: 'Mechanical design, manufacturing, CAD, thermodynamics',
    description_fa: 'طراحی مکانیکی، تولید، CAD، ترمودینامیک',
    specific_sections: [
      {
        id: 'cad_software',
        label_en: 'CAD & Engineering Software',
        label_fa: 'نرم‌افزارهای CAD و مهندسی',
        description_en: 'SolidWorks, AutoCAD, ANSYS, CATIA, MATLAB',
        description_fa: 'SolidWorks, AutoCAD, ANSYS, CATIA, MATLAB',
        is_required: true,
        example_en: 'SolidWorks (Expert), ANSYS Fluent, AutoCAD, MATLAB, Siemens NX',
        example_fa: 'SolidWorks (حرفه‌ای)، ANSYS Fluent، AutoCAD، MATLAB، Siemens NX',
      },
      {
        id: 'patents',
        label_en: 'Patents & Innovations',
        label_fa: 'اختراعات و نوآوری‌ها',
        description_en: 'Patents filed or granted, inventions, innovations',
        description_fa: 'اختراعات ثبت‌شده یا در انتظار، نوآوری‌ها',
        is_required: false,
        example_en: '2 patents granted in heat exchanger design (US Patent #XXXXX)',
        example_fa: '۲ اختراع ثبت‌شده در طراحی مبدل حرارتی',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'work_experience',
      'skills',
      'certifications',
    ],
    detection_keywords: [
      'mechanical', 'engineer', 'cad', 'solidworks', 'manufacturing',
      'thermodynamics', 'fluid', 'material', 'stress analysis',
      'ansys', 'catia', 'cnc', 'gd&t', 'fea', 'cfd',
      'hvac', 'piping', 'tolerance', 'machining',
    ],
  },

  engineering_electrical: {
    id: 'engineering_electrical',
    label_en: 'Electrical Engineering',
    label_fa: 'مهندسی برق',
    icon: '⚡',
    description_en: 'Circuit design, power systems, embedded systems, control',
    description_fa: 'طراحی مدار، سیستم‌های قدرت، سیستم‌های نهفته، کنترل',
    specific_sections: [
      {
        id: 'ee_tools',
        label_en: 'EE Tools & Software',
        label_fa: 'ابزارها و نرم‌افزارهای مهندسی برق',
        description_en: 'MATLAB/Simulink, SPICE, Altium, LabVIEW, PLC programming',
        description_fa: 'MATLAB/Simulink, SPICE, Altium, LabVIEW, برنامه‌نویسی PLC',
        is_required: true,
        example_en: 'MATLAB/Simulink, Altium Designer, PSCAD, LabVIEW, Verilog/VHDL',
        example_fa: 'MATLAB/Simulink, Altium Designer, PSCAD, LabVIEW, Verilog/VHDL',
      },
      {
        id: 'ee_specialization',
        label_en: 'Specialization Area',
        label_fa: 'حوزه تخصصی',
        description_en: 'Power systems, embedded, RF, control systems, telecommunications',
        description_fa: 'سیستم‌های قدرت، نهفته، RF، سیستم‌های کنترل، مخابرات',
        is_required: false,
        example_en: 'Specialized in power electronics and renewable energy integration',
        example_fa: 'تخصص در الکترونیک قدرت و یکپارچه‌سازی انرژی‌های تجدیدپذیر',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'work_experience',
      'skills',
      'projects',
    ],
    detection_keywords: [
      'electrical', 'circuit', 'power', 'embedded', 'plc',
      'control system', 'signal', 'fpga', 'pcb', 'voltage',
      'matlab', 'simulink', 'microcontroller', 'vhdl', 'verilog',
      'rf', 'antenna', 'telecommunication', 'semiconductor',
    ],
  },

  engineering_civil: {
    id: 'engineering_civil',
    label_en: 'Civil Engineering',
    label_fa: 'مهندسی عمران',
    icon: '🏗️',
    description_en: 'Structural, construction, geotechnical, transportation',
    description_fa: 'سازه، عمران، ژئوتکنیک، حمل‌ونقل',
    specific_sections: [
      {
        id: 'pe_license',
        label_en: 'PE License & Certifications',
        label_fa: 'پروانه مهندسی و گواهینامه‌ها',
        description_en: 'Professional Engineer license, LEED, PMP',
        description_fa: 'پروانه مهندسی حرفه‌ای، LEED، PMP',
        is_required: true,
        example_en: 'PE Licensed (State of California), LEED AP BD+C, PMP',
        example_fa: 'پروانه مهندسی حرفه‌ای (ایالت کالیفرنیا)، LEED AP BD+C، PMP',
      },
      {
        id: 'project_portfolio',
        label_en: 'Notable Projects',
        label_fa: 'پروژه‌های شاخص',
        description_en: 'Major projects with budgets, scopes, and your role',
        description_fa: 'پروژه‌های بزرگ با بودجه، حجم و نقش شما',
        is_required: true,
        example_en: 'Led structural design of 20-story residential tower ($15M budget); bridge rehabilitation project ($8M)',
        example_fa: 'طراحی سازه برج مسکونی ۲۰ طبقه (بودجه $15M)؛ پروژه بازسازی پل ($8M)',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'certifications',
      'work_experience',
      'education',
      'projects',
    ],
    detection_keywords: [
      'civil', 'structural', 'construction', 'geotechnical',
      'transportation', 'autocad', 'revit', 'sap2000', 'etabs',
      'concrete', 'steel', 'foundation', 'bridge', 'highway',
      'bim', 'surveying', 'environmental', 'water resources',
    ],
  },

  // ─────────────────────────────────────────
  // PROFESSIONAL SERVICES
  // ─────────────────────────────────────────

  healthcare_medical: {
    id: 'healthcare_medical',
    label_en: 'Healthcare & Medical',
    label_fa: 'بهداشت و درمان',
    icon: '🏥',
    description_en: 'Medicine, nursing, pharmacy, clinical research, public health',
    description_fa: 'پزشکی، پرستاری، داروسازی، تحقیقات بالینی، بهداشت عمومی',
    specific_sections: [
      {
        id: 'licenses',
        label_en: 'Medical Licenses & Board Certifications',
        label_fa: 'پروانه‌های پزشکی و بورد تخصصی',
        description_en: 'Active medical licenses, board certifications, specialization',
        description_fa: 'پروانه‌های فعال پزشکی، بورد تخصصی، حوزه تخصص',
        is_required: true,
        example_en: 'Board Certified in Internal Medicine (ABIM); Medical License #12345 (Active)',
        example_fa: 'بورد تخصصی داخلی (ABIM)؛ پروانه پزشکی شماره ۱۲۳۴۵ (فعال)',
      },
      {
        id: 'clinical_experience',
        label_en: 'Clinical Experience & Rotations',
        label_fa: 'تجربه بالینی و دوره‌های آموزشی',
        description_en: 'Hospital rotations, clinical hours, patient volume',
        description_fa: 'دوره‌های بیمارستانی، ساعات بالینی، حجم بیماران',
        is_required: true,
        example_en: '500+ hours ICU rotation; managed 30+ patients daily; 2-year residency at Johns Hopkins',
        example_fa: 'بیش از ۵۰۰ ساعت دوره ICU؛ مدیریت بیش از ۳۰ بیمار روزانه؛ ۲ سال رزیدنتی',
      },
      {
        id: 'research_publications',
        label_en: 'Research & Publications',
        label_fa: 'تحقیقات و انتشارات',
        description_en: 'Published papers, clinical trials, research grants',
        description_fa: 'مقالات منتشرشده، کارآزمایی‌های بالینی، گرنت‌های تحقیقاتی',
        is_required: false,
        example_en: '15 peer-reviewed publications in hematology; PI on 2 NIH grants ($500K total)',
        example_fa: '۱۵ مقاله داوری‌شده در خون‌شناسی؛ مجری ۲ گرنت NIH (مجموعاً $500K)',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'certifications',
      'work_experience',
    ],
    detection_keywords: [
      'medical', 'doctor', 'physician', 'nurse', 'clinical',
      'hospital', 'patient', 'diagnosis', 'treatment', 'surgery',
      'pharmacy', 'laboratory', 'pathology', 'radiology',
      'residency', 'fellowship', 'board certified', 'emt',
      'public health', 'epidemiology', 'biomedical',
    ],
  },

  legal: {
    id: 'legal',
    label_en: 'Legal',
    label_fa: 'حقوقی',
    icon: '⚖️',
    description_en: 'Law, corporate counsel, litigation, compliance',
    description_fa: 'حقوق، مشاوره شرکتی، دعاوی، انطباق',
    specific_sections: [
      {
        id: 'bar_admission',
        label_en: 'Bar Admissions',
        label_fa: 'پروانه وکالت',
        description_en: 'Bar admissions, jurisdictions, admission dates',
        description_fa: 'پروانه‌های وکالت، حوزه‌های قضایی، تاریخ اخذ',
        is_required: true,
        example_en: 'Admitted to New York State Bar (2018); US District Court SDNY',
        example_fa: 'پروانه وکالت ایالت نیویورک (۲۰۱۸)؛ دادگاه ناحیه‌ای آمریکا SDNY',
      },
      {
        id: 'practice_areas',
        label_en: 'Practice Areas',
        label_fa: 'حوزه‌های تخصصی حقوقی',
        description_en: 'Specializations: corporate law, IP, litigation, immigration',
        description_fa: 'تخصص‌ها: حقوق شرکتی، مالکیت فکری، دعاوی، مهاجرت',
        is_required: true,
        example_en: 'Corporate M&A, Intellectual Property, Securities Regulation',
        example_fa: 'ادغام و تملک شرکتی، مالکیت فکری، مقررات اوراق بهادار',
      },
      {
        id: 'notable_cases',
        label_en: 'Notable Cases & Transactions',
        label_fa: 'پرونده‌ها و معاملات شاخص',
        description_en: 'Significant cases, transactions, or deals you worked on',
        description_fa: 'پرونده‌ها، معاملات یا قراردادهای مهمی که روی آنها کار کردید',
        is_required: false,
        example_en: 'Led legal team in $500M cross-border M&A transaction; won landmark IP case',
        example_fa: 'رهبری تیم حقوقی در معامله $500M ادغام بین‌المللی؛ برنده پرونده شاخص IP',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'certifications',
      'work_experience',
    ],
    detection_keywords: [
      'lawyer', 'attorney', 'legal', 'law', 'bar',
      'litigation', 'counsel', 'court', 'compliance',
      'contract', 'regulation', 'jd', 'llm', 'paralegal',
      'arbitration', 'mediation', 'intellectual property',
    ],
  },

  hr_recruiting: {
    id: 'hr_recruiting',
    label_en: 'Human Resources & Recruiting',
    label_fa: 'منابع انسانی و استخدام',
    icon: '👥',
    description_en: 'HR management, talent acquisition, organizational development',
    description_fa: 'مدیریت منابع انسانی، جذب استعداد، توسعه سازمانی',
    specific_sections: [
      {
        id: 'hr_certifications',
        label_en: 'HR Certifications',
        label_fa: 'گواهینامه‌های HR',
        description_en: 'SHRM-CP, PHR, CIPD, or equivalent',
        description_fa: 'SHRM-CP, PHR, CIPD یا معادل',
        is_required: false,
        example_en: 'SHRM-SCP, PHR Certified, CIPD Level 7',
        example_fa: 'گواهینامه SHRM-SCP, PHR, CIPD سطح ۷',
      },
      {
        id: 'hr_metrics',
        label_en: 'HR Metrics & Achievements',
        label_fa: 'معیارهای HR و دستاوردها',
        description_en: 'Time-to-hire, retention rates, headcount growth managed',
        description_fa: 'زمان استخدام، نرخ نگهداشت، رشد تعداد کارمندان',
        is_required: true,
        example_en: 'Reduced time-to-hire by 40%; managed hiring for 200+ positions annually; improved retention by 15%',
        example_fa: 'کاهش ۴۰٪ زمان استخدام؛ مدیریت جذب بیش از ۲۰۰ موقعیت سالانه؛ بهبود ۱۵٪ نگهداشت',
      },
      {
        id: 'hr_systems',
        label_en: 'HR Systems & Tools',
        label_fa: 'سیستم‌ها و ابزارهای HR',
        description_en: 'ATS, HRIS, payroll systems',
        description_fa: 'سیستم‌های ردیابی متقاضی، HRIS، سیستم‌های حقوق و دستمزد',
        is_required: false,
        example_en: 'Workday, SAP SuccessFactors, Greenhouse ATS, BambooHR',
        example_fa: 'Workday, SAP SuccessFactors, Greenhouse ATS, BambooHR',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'skills',
      'certifications',
    ],
    detection_keywords: [
      'human resources', 'hr', 'recruiting', 'talent',
      'onboarding', 'compensation', 'benefits', 'payroll',
      'employee relations', 'organizational development',
      'talent acquisition', 'hris', 'performance management',
    ],
  },

  // ─────────────────────────────────────────
  // EDUCATION & RESEARCH
  // ─────────────────────────────────────────

  academia_research: {
    id: 'academia_research',
    label_en: 'Academia & Research',
    label_fa: 'دانشگاه و پژوهش',
    icon: '🎓',
    description_en: 'Academic positions, research, teaching, publications',
    description_fa: 'موقعیت‌های دانشگاهی، پژوهش، تدریس، انتشارات',
    specific_sections: [
      {
        id: 'publications_list',
        label_en: 'Publications',
        label_fa: 'فهرست انتشارات',
        description_en: 'Journal articles, conference papers, book chapters, h-index',
        description_fa: 'مقالات ژورنالی، مقالات کنفرانس، فصل‌های کتاب، h-index',
        is_required: true,
        example_en: '25 journal articles (h-index: 12), 10 conference papers, 2 book chapters',
        example_fa: '۲۵ مقاله ژورنالی (h-index: 12)، ۱۰ مقاله کنفرانس، ۲ فصل کتاب',
      },
      {
        id: 'grants_funding',
        label_en: 'Grants & Funding',
        label_fa: 'گرنت‌ها و بودجه‌های تحقیقاتی',
        description_en: 'Research grants received, funding amounts, role (PI/Co-PI)',
        description_fa: 'گرنت‌های تحقیقاتی دریافتی، مبالغ بودجه، نقش (مجری/همکار مجری)',
        is_required: false,
        example_en: 'PI on NSF Grant ($250K, 2020-2023); Co-PI on EU Horizon 2020 ($500K)',
        example_fa: 'مجری گرنت NSF ($250K, 2020-2023)؛ همکار مجری گرنت EU Horizon 2020 ($500K)',
      },
      {
        id: 'teaching_experience',
        label_en: 'Teaching Experience',
        label_fa: 'سوابق تدریس',
        description_en: 'Courses taught, supervision of students, curriculum development',
        description_fa: 'دروس تدریس‌شده، راهنمایی دانشجویان، توسعه برنامه درسی',
        is_required: true,
        example_en: 'Taught Biochemistry to 200+ students/year; supervised 8 PhD and 15 MSc students',
        example_fa: 'تدریس بیوشیمی به بیش از ۲۰۰ دانشجو/سال؛ راهنمایی ۸ دکتری و ۱۵ کارشناسی ارشد',
      },
      {
        id: 'academic_service',
        label_en: 'Academic Service & Committees',
        label_fa: 'خدمات دانشگاهی و کمیته‌ها',
        description_en: 'Journal reviewer, committee member, conference organizer',
        description_fa: 'داوری ژورنال، عضویت در کمیته‌ها، برگزاری کنفرانس',
        is_required: false,
        example_en: 'Reviewer for Nature Biotechnology; Chair of department curriculum committee; Organized 2 international conferences',
        example_fa: 'داور ژورنال Nature Biotechnology؛ رئیس کمیته برنامه درسی؛ برگزاری ۲ کنفرانس بین‌المللی',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'work_experience',
      'certifications',
    ],
    detection_keywords: [
      'professor', 'researcher', 'academic', 'university', 'faculty',
      'publication', 'journal', 'conference', 'thesis', 'dissertation',
      'phd', 'postdoc', 'grant', 'h-index', 'peer-review',
      'curriculum', 'lecture', 'seminar', 'lab', 'research group',
      'associate professor', 'assistant professor', 'tenure',
    ],
  },

  education_teaching: {
    id: 'education_teaching',
    label_en: 'Education & Teaching',
    label_fa: 'آموزش و تدریس',
    icon: '📚',
    description_en: 'K-12, higher education, curriculum development, EdTech',
    description_fa: 'آموزش مدرسه‌ای، آموزش عالی، توسعه برنامه درسی، ادتک',
    specific_sections: [
      {
        id: 'teaching_credentials',
        label_en: 'Teaching Credentials & Licenses',
        label_fa: 'مدارک و مجوزهای تدریس',
        description_en: 'Teaching license, subject endorsements, state credentials',
        description_fa: 'مجوز تدریس، تأییدیه‌های رشته‌ای',
        is_required: true,
        example_en: 'State Teaching License (Mathematics, Grades 7-12); TESOL Certificate',
        example_fa: 'مجوز تدریس (ریاضیات، پایه ۷ تا ۱۲)؛ گواهینامه TESOL',
      },
      {
        id: 'teaching_philosophy',
        label_en: 'Teaching Philosophy & Methods',
        label_fa: 'فلسفه و روش‌های تدریس',
        description_en: 'Your approach to teaching, student engagement strategies',
        description_fa: 'رویکرد شما به تدریس، استراتژی‌های مشارکت دانش‌آموز',
        is_required: false,
        example_en: 'Student-centered learning with emphasis on critical thinking, project-based learning, and differentiated instruction',
        example_fa: 'یادگیری دانش‌آموز‌محور با تأکید بر تفکر انتقادی، یادگیری پروژه‌محور و آموزش متمایز',
      },
      {
        id: 'student_outcomes',
        label_en: 'Student Outcomes & Achievements',
        label_fa: 'نتایج و دستاوردهای دانش‌آموزان',
        description_en: 'Test score improvements, student achievements, graduation rates',
        description_fa: 'بهبود نمرات آزمون، دستاوردهای دانش‌آموزان، نرخ فارغ‌التحصیلی',
        is_required: false,
        example_en: 'Average student test scores improved by 20%; 95% graduation rate in my classes',
        example_fa: 'بهبود ۲۰٪ میانگین نمرات آزمون دانش‌آموزان؛ نرخ فارغ‌التحصیلی ۹۵٪ در کلاس‌هایم',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'education',
      'work_experience',
      'certifications',
    ],
    detection_keywords: [
      'teacher', 'education', 'curriculum', 'classroom',
      'student', 'instruction', 'pedagogy', 'school',
      'principal', 'edtech', 'tutoring', 'lesson plan',
      'k-12', 'elementary', 'secondary', 'higher education',
    ],
  },

  // ─────────────────────────────────────────
  // OTHER
  // ─────────────────────────────────────────

  media_journalism: {
    id: 'media_journalism',
    label_en: 'Media & Journalism',
    label_fa: 'رسانه و روزنامه‌نگاری',
    icon: '📰',
    description_en: 'Journalism, broadcasting, content creation, media production',
    description_fa: 'روزنامه‌نگاری، پخش، تولید محتوا، تولید رسانه‌ای',
    specific_sections: [
      {
        id: 'published_work',
        label_en: 'Published Work & Portfolio',
        label_fa: 'آثار منتشرشده و نمونه‌کار',
        description_en: 'Links to published articles, broadcasts, media appearances',
        description_fa: 'لینک مقالات منتشرشده، پخش‌ها، حضور در رسانه‌ها',
        is_required: true,
        example_en: '200+ articles published in NYT, Washington Post; 50K+ Medium followers',
        example_fa: 'بیش از ۲۰۰ مقاله در NYT و Washington Post؛ بیش از ۵۰ هزار دنبال‌کننده Medium',
      },
      {
        id: 'media_tools',
        label_en: 'Media Tools & Platforms',
        label_fa: 'ابزارها و پلتفرم‌های رسانه‌ای',
        description_en: 'CMS platforms, video editing, podcast tools',
        description_fa: 'پلتفرم‌های CMS، ویرایش ویدیو، ابزارهای پادکست',
        is_required: false,
        example_en: 'WordPress, Premiere Pro, Final Cut, Audacity, Canva, Substack',
        example_fa: 'وردپرس، Premiere Pro، Final Cut، Audacity، Canva، Substack',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'personal_info.website_url',
      'work_experience',
      'projects',
    ],
    detection_keywords: [
      'journalist', 'reporter', 'editor', 'media', 'news',
      'broadcast', 'podcast', 'content creator', 'writer',
      'publication', 'press', 'communications', 'copywriter',
      'social media', 'blogger', 'vlogger',
    ],
  },

  creative_arts: {
    id: 'creative_arts',
    label_en: 'Creative Arts',
    label_fa: 'هنرهای خلاقه',
    icon: '🎭',
    description_en: 'Music, film, photography, fine arts, creative writing',
    description_fa: 'موسیقی، فیلم، عکاسی، هنرهای زیبا، نویسندگی خلاقانه',
    specific_sections: [
      {
        id: 'creative_portfolio',
        label_en: 'Creative Portfolio',
        label_fa: 'نمونه‌کارهای هنری',
        description_en: 'Links to your portfolio, exhibitions, performances',
        description_fa: 'لینک نمونه‌کارها، نمایشگاه‌ها، اجراها',
        is_required: true,
        example_en: 'Solo exhibition at MoMA (2023); portfolio at mysite.com/art; 10K+ Instagram followers',
        example_fa: 'نمایشگاه انفرادی در MoMA (2023)؛ نمونه‌کار در mysite.com/art',
      },
      {
        id: 'awards_exhibitions',
        label_en: 'Awards & Exhibitions',
        label_fa: 'جوایز و نمایشگاه‌ها',
        description_en: 'Awards received, exhibitions, festivals, screenings',
        description_fa: 'جوایز دریافتی، نمایشگاه‌ها، جشنواره‌ها',
        is_required: false,
        example_en: 'Winner, Sundance Short Film Award (2022); 3 solo gallery exhibitions; selected for Venice Biennale',
        example_fa: 'برنده جایزه فیلم کوتاه ساندنس (۲۰۲۲)؛ ۳ نمایشگاه انفرادی؛ انتخاب برای بینال ونیز',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'personal_info.website_url',
      'projects',
      'work_experience',
    ],
    detection_keywords: [
      'artist', 'musician', 'filmmaker', 'photographer',
      'creative', 'gallery', 'exhibition', 'portfolio',
      'performance', 'studio', 'fine art', 'sculpture',
      'painting', 'illustration', 'animation', 'composing',
    ],
  },

  nonprofit: {
    id: 'nonprofit',
    label_en: 'Nonprofit & NGO',
    label_fa: 'سازمان‌های غیرانتفاعی',
    icon: '🌍',
    description_en: 'Nonprofit management, fundraising, social impact, volunteer coordination',
    description_fa: 'مدیریت سازمان‌های غیرانتفاعی، جذب بودجه، تأثیر اجتماعی',
    specific_sections: [
      {
        id: 'impact_metrics',
        label_en: 'Social Impact Metrics',
        label_fa: 'معیارهای تأثیر اجتماعی',
        description_en: 'Lives impacted, funds raised, programs launched',
        description_fa: 'تعداد افراد تأثیرپذیر، بودجه جذب‌شده، برنامه‌های راه‌اندازی‌شده',
        is_required: true,
        example_en: 'Raised $2M in donations; programs reached 10,000+ beneficiaries; launched 3 community programs',
        example_fa: 'جذب $2M کمک مالی؛ برنامه‌ها به بیش از ۱۰ هزار ذینفع رسید؛ راه‌اندازی ۳ برنامه اجتماعی',
      },
      {
        id: 'volunteer_experience',
        label_en: 'Volunteer & Board Experience',
        label_fa: 'تجربه داوطلبانه و هیئت مدیره',
        description_en: 'Volunteer work, board memberships, community leadership',
        description_fa: 'کار داوطلبانه، عضویت در هیئت مدیره، رهبری اجتماعی',
        is_required: false,
        example_en: 'Board Member at Local Food Bank (3 years); 500+ volunteer hours; mentored 20+ youth',
        example_fa: 'عضو هیئت مدیره بانک غذای محلی (۳ سال)؛ بیش از ۵۰۰ ساعت داوطلبانه',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'skills',
    ],
    detection_keywords: [
      'nonprofit', 'ngo', 'charity', 'volunteer', 'social impact',
      'fundraising', 'donor', 'grant', 'community', 'advocacy',
      'humanitarian', 'social enterprise', 'philanthropy',
    ],
  },

  government: {
    id: 'government',
    label_en: 'Government & Public Sector',
    label_fa: 'دولت و بخش عمومی',
    icon: '🏛️',
    description_en: 'Government, public administration, policy, military',
    description_fa: 'دولت، اداره عمومی، سیاست‌گذاری، نظامی',
    specific_sections: [
      {
        id: 'security_clearance',
        label_en: 'Security Clearance',
        label_fa: 'سطح محرمانگی امنیتی',
        description_en: 'Level of security clearance, if applicable',
        description_fa: 'سطح محرمانگی امنیتی، در صورت داشتن',
        is_required: false,
        example_en: 'Secret Clearance (Active); TS/SCI eligible',
        example_fa: 'سطح محرمانگی Secret (فعال)؛ واجد شرایط TS/SCI',
      },
      {
        id: 'policy_experience',
        label_en: 'Policy & Legislative Experience',
        label_fa: 'تجربه سیاست‌گذاری و قانون‌گذاری',
        description_en: 'Policy development, legislative analysis, regulatory work',
        description_fa: 'توسعه سیاست، تحلیل قانونی، کار نظارتی',
        is_required: false,
        example_en: 'Drafted 3 policy briefs adopted by city council; managed $10M public budget; liaised with 5 federal agencies',
        example_fa: 'تدوین ۳ خلاصه سیاستی مصوب شورای شهر؛ مدیریت بودجه عمومی $10M',
      },
      {
        id: 'gov_grade',
        label_en: 'Government Grade / Rank',
        label_fa: 'رتبه / درجه دولتی',
        description_en: 'GS level, military rank, or equivalent government grade',
        description_fa: 'سطح GS، درجه نظامی، یا رتبه دولتی معادل',
        is_required: false,
        example_en: 'GS-13, Captain (O-3), SES Candidate',
        example_fa: 'GS-13، کاپیتان (O-3)، کاندیدای SES',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'education',
      'certifications',
    ],
    detection_keywords: [
      'government', 'public sector', 'federal', 'state', 'municipal',
      'policy', 'regulation', 'military', 'veteran', 'civil service',
      'public administration', 'legislation', 'congressional',
      'agency', 'department', 'bureau', 'gs-',
    ],
  },

  hospitality_tourism: {
    id: 'hospitality_tourism',
    label_en: 'Hospitality & Tourism',
    label_fa: 'مهمان‌نوازی و گردشگری',
    icon: '🏨',
    description_en: 'Hotels, restaurants, travel, event management',
    description_fa: 'هتلداری، رستوران‌داری، سفر، مدیریت رویداد',
    specific_sections: [
      {
        id: 'hospitality_skills',
        label_en: 'Hospitality-Specific Skills',
        label_fa: 'مهارت‌های تخصصی مهمان‌نوازی',
        description_en: 'Guest relations, revenue management, F&B operations, property management systems',
        description_fa: 'ارتباط با مهمان، مدیریت درآمد، عملیات غذا و نوشیدنی، سیستم‌های مدیریت ملک',
        is_required: true,
        example_en: 'Revenue Management, Opera PMS, MICROS, Guest Satisfaction (95%+ scores), ServSafe certified',
        example_fa: 'مدیریت درآمد، Opera PMS، MICROS، رضایت مهمان (بالای ۹۵٪)، گواهینامه ServSafe',
      },
      {
        id: 'hospitality_metrics',
        label_en: 'Performance Metrics',
        label_fa: 'معیارهای عملکرد',
        description_en: 'RevPAR, occupancy rates, guest satisfaction scores, F&B revenue',
        description_fa: 'RevPAR، نرخ اشغال، امتیاز رضایت مهمان، درآمد F&B',
        is_required: false,
        example_en: 'Increased RevPAR by 18%; maintained 4.8/5.0 guest satisfaction; managed 200-room property',
        example_fa: 'افزایش ۱۸٪ RevPAR؛ حفظ رضایت مهمان ۴.۸/۵.۰؛ مدیریت هتل ۲۰۰ اتاقه',
      },
    ],
    critical_fields: [
      'personal_info.summary',
      'work_experience',
      'languages',
      'skills',
    ],
    detection_keywords: [
      'hotel', 'hospitality', 'tourism', 'restaurant', 'chef',
      'guest', 'concierge', 'event', 'travel', 'booking',
      'catering', 'front desk', 'food service', 'banquet',
      'resort', 'housekeeping', 'f&b', 'sommelier',
    ],
  },

  // ─────────────────────────────────────────
  // GENERAL (فالبک عمومی - اصلاح‌شده)
  // ─────────────────────────────────────────

  general: {
    id: 'general',
    label_en: 'General / Other',
    label_fa: 'عمومی / سایر',
    icon: '📋',
    description_en: 'General CV for any field not listed above',
    description_fa: 'رزومه عمومی برای حوزه‌هایی که در لیست بالا نیست',
    specific_sections: [
      {
        id: 'professional_summary',
        label_en: 'Professional Summary',
        label_fa: 'خلاصه حرفه‌ای',
        description_en: 'A concise 2-4 sentence summary of your professional background, key skills, and career goals',
        description_fa: 'خلاصه ۲-۴ جمله‌ای از سوابق حرفه‌ای، مهارت‌های کلیدی و اهداف شغلی',
        is_required: true,
        example_en: 'Results-driven professional with 5+ years of experience in project management and team leadership. Proven track record of delivering projects on time and under budget.',
        example_fa: 'حرفه‌ای نتیجه‌گرا با بیش از ۵ سال تجربه در مدیریت پروژه و رهبری تیم. سابقه اثبات‌شده تحویل پروژه‌ها به‌موقع و زیر بودجه.',
      },
      {
        id: 'key_achievements',
        label_en: 'Key Achievements',
        label_fa: 'دستاوردهای کلیدی',
        description_en: 'Your top 3-5 career achievements with quantifiable results',
        description_fa: 'برترین ۳-۵ دستاورد حرفه‌ای شما با نتایج قابل‌اندازه‌گیری',
        is_required: true,
        example_en: 'Increased team productivity by 30%; Led successful launch of 2 products; Received Employee of the Year award',
        example_fa: 'افزایش ۳۰٪ بهره‌وری تیم؛ رهبری موفق عرضه ۲ محصول؛ دریافت جایزه کارمند سال',
      },
      {
        id: 'references',
        label_en: 'References',
        label_fa: 'معرف‌ها',
        description_en: 'Professional references or "Available upon request"',
        description_fa: 'معرف‌های حرفه‌ای یا "در صورت درخواست قابل ارائه"',
        is_required: false,
        example_en: 'Available upon request',
        example_fa: 'در صورت درخواست قابل ارائه',
      },
    ],
    critical_fields: [
      'personal_info.full_name',
      'personal_info.email',
      'personal_info.phone',
      'personal_info.summary',
      'work_experience',
      'education',
      'skills',
    ],
    detection_keywords: [],
  },
};

// ═══════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════

/**
 * تشخیص خودکار حوزه‌(های) شغلی از متن CV
 * برمی‌گرداند: آرایه‌ای از حوزه‌ها با امتیاز، مرتب‌شده نزولی
 */
export function detectDomains(cvText: string): { domain: CVDomainId; score: number }[] {
  if (!cvText || cvText.trim().length === 0) {
    return [{ domain: 'general', score: 50 }];
  }

  const lowerText = cvText.toLowerCase();
  const scores: { domain: CVDomainId; score: number }[] = [];

  for (const [domainId, domain] of Object.entries(CV_DOMAINS)) {
    if (domainId === 'general') continue;
    if (domain.detection_keywords.length === 0) continue;

    let matchCount = 0;
    let totalWeight = 0;

    for (const keyword of domain.detection_keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // برای عبارات چند کلمه‌ای، جستجوی ساده‌تر
      const regex = keyword.includes(' ')
        ? new RegExp(escaped, 'gi')
        : new RegExp(`\\b${escaped}\\b`, 'gi');

      const matches = lowerText.match(regex);
      if (matches) {
        matchCount += matches.length;
        totalWeight += 1; // هر کلمه کلیدی یکبار وزن می‌گیرد
      }
    }

    if (matchCount > 0) {
      // نرمال‌سازی:
      // - coverage: چه درصدی از کلمات کلیدی حوزه پیدا شدند
      // - frequency: تکرار کلمات (حداکثر ۲ برابر تعداد یونیک)
      const coverage = totalWeight / domain.detection_keywords.length;
      const frequencyBonus = Math.min(matchCount / domain.detection_keywords.length, 2);
      const rawScore = (coverage * 60) + (frequencyBonus * 20);
      const normalizedScore = Math.min(100, Math.round(rawScore));

      scores.push({ domain: domainId as CVDomainId, score: normalizedScore });
    }
  }

  // مرتب‌سازی نزولی
  scores.sort((a, b) => b.score - a.score);

  // اگر هیچ حوزه‌ای شناسایی نشد
  if (scores.length === 0) {
    return [{ domain: 'general', score: 50 }];
  }

  return scores;
}

/**
 * دریافت همه بخش‌های اختصاصی برای حوزه‌های انتخاب‌شده
 * بدون تکرار (اگر دو حوزه بخش مشابه داشته باشند)
 */
export function getDomainSpecificSections(domainIds: CVDomainId[]): DomainSpecificSection[] {
  const sections: DomainSpecificSection[] = [];
  const seenIds = new Set<string>();

  for (const domainId of domainIds) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    for (const section of domain.specific_sections) {
      if (!seenIds.has(section.id)) {
        seenIds.add(section.id);
        sections.push(section);
      }
    }
  }

  return sections;
}

/**
 * دریافت همه فیلدهای حیاتی برای حوزه‌های انتخاب‌شده (بدون تکرار)
 */
export function getCriticalFields(domainIds: CVDomainId[]): string[] {
  const fields = new Set<string>();

  for (const domainId of domainIds) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    for (const field of domain.critical_fields) {
      fields.add(field);
    }
  }

  return Array.from(fields);
}

/**
 * گروه‌بندی حوزه‌ها برای نمایش در UI
 */
export function getDomainGroups(): { group_en: string; group_fa: string; domains: CVDomain[] }[] {
  return [
    {
      group_en: 'Technology',
      group_fa: 'فناوری',
      domains: [
        CV_DOMAINS.software_engineering,
        CV_DOMAINS.data_science,
        CV_DOMAINS.product_management,
        CV_DOMAINS.design_ux,
      ],
    },
    {
      group_en: 'Engineering',
      group_fa: 'مهندسی',
      domains: [
        CV_DOMAINS.engineering_mechanical,
        CV_DOMAINS.engineering_electrical,
        CV_DOMAINS.engineering_civil,
      ],
    },
    {
      group_en: 'Business',
      group_fa: 'کسب‌وکار',
      domains: [
        CV_DOMAINS.marketing,
        CV_DOMAINS.sales,
        CV_DOMAINS.finance_accounting,
        CV_DOMAINS.consulting,
        CV_DOMAINS.operations_logistics,
      ],
    },
    {
      group_en: 'Professional Services',
      group_fa: 'خدمات تخصصی',
      domains: [
        CV_DOMAINS.legal,
        CV_DOMAINS.hr_recruiting,
        CV_DOMAINS.healthcare_medical,
      ],
    },
    {
      group_en: 'Education & Research',
      group_fa: 'آموزش و پژوهش',
      domains: [
        CV_DOMAINS.academia_research,
        CV_DOMAINS.education_teaching,
      ],
    },
    {
      group_en: 'Other',
      group_fa: 'سایر',
      domains: [
        CV_DOMAINS.media_journalism,
        CV_DOMAINS.creative_arts,
        CV_DOMAINS.nonprofit,
        CV_DOMAINS.government,
        CV_DOMAINS.hospitality_tourism,
        CV_DOMAINS.general,
      ],
    },
  ];
}

/**
 * بررسی اینکه آیا یک حوزه معتبر است
 */
export function isValidDomain(domainId: string): domainId is CVDomainId {
  return domainId in CV_DOMAINS;
}

/**
 * دریافت اطلاعات یک حوزه با fallback به general
 */
export function getDomain(domainId: CVDomainId): CVDomain {
  return CV_DOMAINS[domainId] || CV_DOMAINS.general;
}

/**
 * دریافت لیست ساده حوزه‌ها برای dropdown یا select
 */
export function getDomainList(): { id: CVDomainId; label_en: string; label_fa: string; icon: string }[] {
  return Object.values(CV_DOMAINS).map(d => ({
    id: d.id,
    label_en: d.label_en,
    label_fa: d.label_fa,
    icon: d.icon,
  }));
}
