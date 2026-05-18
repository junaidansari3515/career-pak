// ============================================================
// Career Pakistan — google-sheet-loader.js  (v2)
// Loads CMS data from Google Sheets via Vercel API proxy.
//
// BUG FIX #7 (master prompt):
//   - Removed '&_t=' + Date.now() cache-buster from fetch URL.
//     This was defeating Vercel's edge cache on every request.
//   - Changed cache: 'no-store' → cache: 'default' so the browser
//     and Vercel CDN can cache responses properly.
//
// NEW COLUMNS MAPPED (master prompt Session 2):
//   Jobs: Deadline, Category, Province, Experience, Education,
//         Tags, Is Featured, Posted Date, Short Description
//   Scholarships: Type, Level, Field, University, Tags,
//                 Is Featured, Posted Date, Short Description, Province
//   Internships: Deadline, Type, Category, Tags, Is Featured,
//                Posted Date, Short Description, Education Level
//   Exams: Conducting Body, Fee, Eligibility, Syllabus Link,
//          Past Papers Link, Tags, Province, Short Description,
//          Is Featured, Posted Date
//   Books: Category, Language, Pages, Edition, Is Free, Tags,
//          Short Description, Is Featured, Posted Date, Download Link
//   Blogs: Related Jobs Tags, Related Exams Tags, Read Time, Is Published
// ============================================================

const SHEETS_BASE_URL = '/api/sheets';

const SHEETS_CONFIG = [
  { name: 'Scholarships', csvUrl: `${SHEETS_BASE_URL}?sheet=Scholarships`, mapper: mapScholarship },
  { name: 'Jobs',         csvUrl: `${SHEETS_BASE_URL}?sheet=Jobs`,         mapper: mapJob         },
  { name: 'Internships',  csvUrl: `${SHEETS_BASE_URL}?sheet=Internships`,  mapper: mapInternship  },
  { name: 'Exams',        csvUrl: `${SHEETS_BASE_URL}?sheet=Exams`,        mapper: mapExam        },
  { name: 'Books',        csvUrl: `${SHEETS_BASE_URL}?sheet=Books`,        mapper: mapBook        },
  { name: 'Blogs',        csvUrl: `${SHEETS_BASE_URL}?sheet=Blogs`,        mapper: mapBlog        },
  { name: 'Notifications',csvUrl: `${SHEETS_BASE_URL}?sheet=Notifications`,mapper: mapNotification},
];

window.CMS_DATA    = window.CMS_DATA    || {};
window.CMS_LOADING = window.CMS_LOADING || {};

// ── Utilities ─────────────────────────────────────────────────
function _getField(r, keys) {
  for (const key of keys) {
    const val = r[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return '';
}

function _bool(val) {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}

function _mapRichContentFields(r) {
  const pdfRaw = _getField(r, ['PDF Links', 'PDF Link', 'PDF']);
  const imgRaw = _getField(r, ['Image Links', 'Image Link', 'Image URL', 'Image']);
  return {
    details:     _getField(r, ['Details', 'Description']),
    pdf_links:   pdfRaw  ? [pdfRaw]  : [],
    image_links: imgRaw  ? [imgRaw]  : [],
    media_links: _getField(r, ['Media Links', 'Media Link']) ? [_getField(r, ['Media Links', 'Media Link'])] : [],
    source_link: _getField(r, ['Source Link', 'External Link']),
  };
}

// ── Mapper functions ──────────────────────────────────────────

function mapScholarship(r) {
  return {
    id:                _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:             _getField(r, ['Title']),
    country:           _getField(r, ['Country']),
    funding:           _getField(r, ['Funding', 'Amount']),
    deadline:          _getField(r, ['Deadline', 'Application Deadline']),
    eligibility:       _getField(r, ['Eligibility']),
    apply_link:        _getField(r, ['Apply Link', 'Link', 'URL']),
    // New columns
    type:              _getField(r, ['Type']),
    level:             _getField(r, ['Level']),
    field:             _getField(r, ['Field']),
    university:        _getField(r, ['University']),
    province:          _getField(r, ['Province']),
    tags:              _getField(r, ['Tags']),
    is_featured:       _bool(_getField(r, ['Is Featured', 'Featured'])),
    posted_date:       _getField(r, ['Posted Date', 'Date Added']),
    short_description: _getField(r, ['Short Description', 'Summary', 'Excerpt']),
    image_url:         _getField(r, ['Image Link', 'Image URL', 'Image']),
    ..._mapRichContentFields(r),
  };
}

function mapJob(r) {
  return {
    id:                _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:             _getField(r, ['Title', 'Position']),
    type:              _getField(r, ['Type', 'Job Type']),
    location:          _getField(r, ['Location', 'City']),
    salary:            _getField(r, ['Salary', 'Compensation']),
    organization:      _getField(r, ['Organization', 'Company']),
    apply_link:        _getField(r, ['Apply Link', 'Link', 'URL']),
    // New columns
    deadline:          _getField(r, ['Deadline']),
    category:          _getField(r, ['Category']),
    province:          _getField(r, ['Province']),
    experience:        _getField(r, ['Experience']),
    education:         _getField(r, ['Education']),
    tags:              _getField(r, ['Tags']),
    is_featured:       _bool(_getField(r, ['Is Featured', 'Featured'])),
    posted_date:       _getField(r, ['Posted Date', 'Date Added']),
    short_description: _getField(r, ['Short Description', 'Summary']),
    image_url:         _getField(r, ['Image Link', 'Image URL', 'Image']),
    ..._mapRichContentFields(r),
  };
}

function mapInternship(r) {
  return {
    id:                _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:             _getField(r, ['Title', 'Position']),
    organization:      _getField(r, ['Organization', 'Company']),
    location:          _getField(r, ['Location', 'City']),
    stipend:           _getField(r, ['Stipend', 'Compensation']),
    duration:          _getField(r, ['Duration']),
    apply_link:        _getField(r, ['Apply Link', 'Link', 'URL']),
    // New columns
    deadline:          _getField(r, ['Deadline']),
    type:              _getField(r, ['Type']),
    category:          _getField(r, ['Category']),
    tags:              _getField(r, ['Tags']),
    is_featured:       _bool(_getField(r, ['Is Featured', 'Featured'])),
    posted_date:       _getField(r, ['Posted Date', 'Date Added']),
    short_description: _getField(r, ['Short Description', 'Summary']),
    education_level:   _getField(r, ['Education Level', 'Education']),
    image_url:         _getField(r, ['Image Link', 'Image URL', 'Image']),
    ..._mapRichContentFields(r),
  };
}

function mapExam(r) {
  return {
    id:                    _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:                 _getField(r, ['Title', 'Exam Name']),
    exam_type:             _getField(r, ['Exam Type', 'Type']),
    test_date:             _getField(r, ['Test Date', 'Date']),
    registration_deadline: _getField(r, ['Registration Deadline']),
    apply_link:            _getField(r, ['Apply Link', 'Link', 'URL']),
    // New columns
    conducting_body:  _getField(r, ['Conducting Body', 'Authority']),
    fee:              _getField(r, ['Fee', 'Registration Fee']),
    eligibility:      _getField(r, ['Eligibility']),
    syllabus_link:    _getField(r, ['Syllabus Link']),
    past_papers_link: _getField(r, ['Past Papers Link', 'Past Papers']),
    tags:             _getField(r, ['Tags']),
    province:         _getField(r, ['Province']),
    short_description:_getField(r, ['Short Description', 'Summary']),
    is_featured:      _bool(_getField(r, ['Is Featured', 'Featured'])),
    posted_date:      _getField(r, ['Posted Date', 'Date Added']),
    category:         _getField(r, ['Category']),
    image_url:        _getField(r, ['Image Link', 'Image URL', 'Image']),
    ..._mapRichContentFields(r),
  };
}

function mapBook(r) {
  return {
    id:                _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:             _getField(r, ['Title', 'Book Title']),
    author:            _getField(r, ['Author']),
    exam_type:         _getField(r, ['Exam Type', 'For Exam']),
    price:             _getField(r, ['Price']),
    apply_link:        _getField(r, ['Apply Link', 'Link', 'URL']),
    // New columns
    category:          _getField(r, ['Category']),
    language:          _getField(r, ['Language']),
    pages:             _getField(r, ['Pages']),
    edition:           _getField(r, ['Edition']),
    is_free:           _bool(_getField(r, ['Is Free', 'Free'])),
    tags:              _getField(r, ['Tags']),
    short_description: _getField(r, ['Short Description', 'Summary']),
    is_featured:       _bool(_getField(r, ['Is Featured', 'Featured'])),
    posted_date:       _getField(r, ['Posted Date', 'Date Added']),
    download_link:     _getField(r, ['Download Link', 'PDF Download']),
    image_url:         _getField(r, ['Image Link', 'Image URL', 'Image']),
    ..._mapRichContentFields(r),
  };
}

function mapBlog(r) {
  return {
    id:                  _getField(r, ['ID']) || String(r.__rowIndex || ''),
    title:               _getField(r, ['Title']),
    category:            _getField(r, ['Category']),
    description:         _getField(r, ['Description', 'Content', 'Details']),
    short_description:   _getField(r, ['Short Description', 'Summary', 'Excerpt']),
    image_url:           _getField(r, ['Image URL', 'Image Link', 'Image']),
    author:              _getField(r, ['Author']),
    date:                _getField(r, ['Date', 'Published Date', 'Posted Date']),
    tags:                _getField(r, ['Tags']),
    is_featured:         _bool(_getField(r, ['Featured?', 'Featured', 'Is Featured'])),
    apply_link:          _getField(r, ['Apply Link', 'Link', 'URL']),
    pdf_link:            _getField(r, ['PDF Link', 'Document Link']),
    // New columns
    related_jobs_tags:   _getField(r, ['Related Jobs Tags']),
    related_exams_tags:  _getField(r, ['Related Exams Tags']),
    read_time:           _getField(r, ['Read Time']),
    is_published:        _bool(_getField(r, ['Is Published', 'Published'])),
    ..._mapRichContentFields(r),
  };
}

function mapNotification(r) {
  return {
    id:        _getField(r, ['ID']) || String(r.__rowIndex || ''),
    message:   _getField(r, ['Message', 'Text', 'Title']),
    link:      _getField(r, ['Link', 'URL']),
    is_active: _bool(_getField(r, ['Is Active', 'Active', 'Show'])),
  };
}

// ── CSV parser ────────────────────────────────────────────────
function _parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { field += ch; }
    } else {
      if      (ch === '"')  { inQ = true; }
      else if (ch === ',')  { row.push(field.trim()); field = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') {
        row.push(field.trim()); field = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else { field += ch; }
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

// ── Load a single sheet ───────────────────────────────────────
async function loadSheetData(sheetConfig) {
  try {
    // ✅ BUG FIX #7 — removed '&_t=' + Date.now() and cache: 'no-store'
    // cache: 'default' lets the browser + Vercel CDN cache the response
    const response = await fetch(sheetConfig.csvUrl, { cache: 'default' });

    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();

    if (!text || text.trim().startsWith('<!') || text.trim().startsWith('{')) {
      console.warn('[CMS] Bad response for', sheetConfig.name, text.slice(0, 80));
      window.CMS_DATA[sheetConfig.name] = [];
      return [];
    }

    const rows = _parseCSV(text);
    if (rows.length < 2) { window.CMS_DATA[sheetConfig.name] = []; return []; }

    const headers = rows[0].map(h => h.trim());
    const objects = rows.slice(1).map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      obj.__rowIndex = idx + 1;
      return obj;
    }).filter(obj => headers.some(h => obj[h] !== ''));

    const mappedData = objects.map(sheetConfig.mapper).filter(item => item && item.title);
    window.CMS_DATA[sheetConfig.name] = mappedData;
    console.info(`[CMS] ✅ ${sheetConfig.name}: ${mappedData.length} items`);
    return mappedData;
  } catch (error) {
    console.error('[CMS] Failed to load', sheetConfig.name, error.message);
    window.CMS_DATA[sheetConfig.name] = [];
    return [];
  }
}

// ── Load all sheets in parallel ───────────────────────────────
async function loadAllSheets() {
  const promises = SHEETS_CONFIG.map(async (config) => {
    window.CMS_LOADING[config.name] = true;
    try {
      await loadSheetData(config);
    } finally {
      window.CMS_LOADING[config.name] = false;
    }
  });

  await Promise.allSettled(promises);

  if (typeof window._fireCMSReady === 'function') {
    window._fireCMSReady();
  } else {
    window._CMS_READY = true;
    document.dispatchEvent(new CustomEvent('cmsReady', { detail: window.CMS_DATA }));
  }

  window.dispatchEvent(new CustomEvent('cmsDataLoaded', { detail: { data: window.CMS_DATA } }));
}

// ── Boot ──────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllSheets);
} else {
  loadAllSheets();
}

window.loadCMSData = loadAllSheets;
