(function () {
  'use strict';

  const SITE_NAME = 'Career Pakistan';
  const SITE_URL = 'https://careerpk.online';
  const DEFAULT_IMAGE = `${SITE_URL}/banner.webp`;
  const DEFAULT_LOCALE = 'en_PK';

  const META_BY_PATH = {
    '/': {
      title: 'Career Pakistan — Jobs, Scholarships, Exams & Career Growth Hub',
      description:
        'Discover verified jobs, scholarships, exam updates, internships, and career resources tailored for students and professionals in Pakistan.',
      keywords:
        'career pakistan, pakistan jobs, scholarships pakistan, exam updates pakistan, internships pakistan, career guidance',
      type: 'website'
    },
    '/index.html': {
      title: 'Career Pakistan — Jobs, Scholarships, Exams & Career Growth Hub',
      description:
        'Discover verified jobs, scholarships, exam updates, internships, and career resources tailored for students and professionals in Pakistan.',
      keywords:
        'career pakistan, pakistan jobs, scholarships pakistan, exam updates pakistan, internships pakistan, career guidance',
      type: 'website'
    },

    '/jobs.html': {
      title: 'Latest Jobs in Pakistan 2026 — Government & Private | Career Pakistan',
      description:
        'Find latest government and private jobs in Pakistan with deadlines, eligibility criteria, and direct apply links updated regularly.',
      keywords:
        'latest jobs pakistan, government jobs pakistan, private jobs pakistan, fpsc jobs, ppsc jobs, career pakistan jobs',
      type: 'website'
    },
    '/jobs-government.html': {
      title: 'Government Jobs in Pakistan — FPSC, PPSC, Ministries | Career Pakistan',
      description:
        'Browse government jobs from FPSC, PPSC, NTS, ministries, and public departments with clear requirements and deadline tracking.',
      keywords:
        'government jobs pakistan, fpsc jobs, ppsc jobs, ministry jobs pakistan, public sector jobs',
      type: 'website'
    },
    '/jobs-private.html': {
      title: 'Private Jobs in Pakistan — IT, Banking, FMCG & More | Career Pakistan',
      description:
        'Explore private sector jobs across IT, telecom, banking, education, healthcare, and engineering with role-based filtering.',
      keywords:
        'private jobs pakistan, it jobs pakistan, banking jobs pakistan, corporate jobs pakistan, latest private vacancies',
      type: 'website'
    },

    '/scholarships.html': {
      title: 'Scholarships for Pakistani Students 2026 — Local & International',
      description:
        'Access merit-based and need-based scholarships, fully funded programs, and admission funding opportunities for Pakistani students.',
      keywords:
        'scholarships pakistan, fully funded scholarships, merit scholarships, need based scholarships, student funding pakistan',
      type: 'website'
    },
    '/scholarships-national.html': {
      title: 'National Scholarships in Pakistan 2026 — HEC, PEEF & Provincial',
      description:
        'Track Pakistani national scholarships from HEC, PEEF, BEEF, and provincial programs with eligibility and application guidance.',
      keywords:
        'national scholarships pakistan, hec scholarships, peef scholarship, provincial scholarships pakistan',
      type: 'website'
    },
    '/scholarships-international.html': {
      title: 'International Scholarships 2026 for Pakistani Students | Career Pakistan',
      description:
        'Find global scholarships for Pakistani students including undergraduate, masters, and PhD funding with country-specific opportunities.',
      keywords:
        'international scholarships pakistan, masters scholarships abroad, phd scholarships for pakistanis, global funding students',
      type: 'website'
    },

    '/blog.html': {
      title: 'Career Blog Pakistan — Jobs, Scholarships, Exams & Skills',
      description:
        'Read expert articles on job preparation, scholarship strategy, exam success, resume writing, and long-term career planning.',
      keywords:
        'career blog pakistan, job tips pakistan, scholarship tips, exam preparation guide, resume advice pakistan',
      type: 'website'
    },
    '/blog-post.html': {
      title: 'Career Insights Article | Career Pakistan Blog',
      description:
        'In-depth article from Career Pakistan covering practical strategies for academic and professional growth.',
      keywords:
        'career pakistan blog post, career insights pakistan, education and career advice',
      type: 'article'
    },

    '/exams.html': {
      title: 'Exam Updates in Pakistan 2026 — Admissions, Tests & Merit',
      description:
        'Get exam dates, roll number updates, syllabus highlights, and test preparation resources for major Pakistani examinations.',
      keywords:
        'exam updates pakistan, entry tests pakistan, merit list updates, admission test schedule pakistan',
      type: 'website'
    },
    '/exams-css.html': {
      title: 'CSS Exam Updates & Preparation 2026 | Career Pakistan',
      description:
        'Stay updated on CSS exam schedule, syllabus changes, application process, and high-impact preparation resources.',
      keywords:
        'css exam pakistan, css preparation, fpsc css updates, css syllabus, css exam date',
      type: 'website'
    },
    '/exams-mdcat.html': {
      title: 'MDCAT Updates 2026 — Syllabus, Dates & Preparation',
      description:
        'Follow MDCAT exam announcements, subject breakdown, test strategy, and admission-related updates for medical aspirants.',
      keywords:
        'mdcat pakistan, mdcat syllabus, mdcat date, medical entry test pakistan, mdcat preparation',
      type: 'website'
    },
    '/exams-ppsc.html': {
      title: 'PPSC Exam & Test Updates 2026 | Career Pakistan',
      description:
        'Track PPSC written tests, interview notices, and preparation updates for Punjab Public Service Commission candidates.',
      keywords:
        'ppsc exam, ppsc test schedule, ppsc preparation, ppsc jobs test updates, ppsc interview notice',
      type: 'website'
    }
  };

  function ensureMeta(selector, attr, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.includes('property=')) {
        el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
      } else if (selector.includes('name=')) {
        el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function applyMeta(config) {
    if (!config) return;
    const canonicalUrl = `${SITE_URL}${window.location.pathname}`;

    document.title = config.title;
    ensureMeta('meta[name="description"]', 'content', config.description);
    ensureMeta('meta[name="keywords"]', 'content', config.keywords);
    ensureMeta('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large');

    ensureMeta('meta[property="og:type"]', 'content', config.type || 'website');
    ensureMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
    ensureMeta('meta[property="og:locale"]', 'content', DEFAULT_LOCALE);
    ensureMeta('meta[property="og:title"]', 'content', config.title);
    ensureMeta('meta[property="og:description"]', 'content', config.description);
    ensureMeta('meta[property="og:url"]', 'content', canonicalUrl);
    ensureMeta('meta[property="og:image"]', 'content', config.image || DEFAULT_IMAGE);

    ensureMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', 'content', config.title);
    ensureMeta('meta[name="twitter:description"]', 'content', config.description);
    ensureMeta('meta[name="twitter:image"]', 'content', config.image || DEFAULT_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }

  const pagePath = window.location.pathname || '/';
  const pageMeta = META_BY_PATH[pagePath];
  if (pageMeta) applyMeta(pageMeta);
})();
