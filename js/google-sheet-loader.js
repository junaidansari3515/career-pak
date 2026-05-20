// ============================================================
// Career Pakistan — google-sheet-loader.js (v3 — final)
// FIXES: correct column names, both camelCase+snake_case aliases,
// isActive on notifications, _fireCMSReady()
// ============================================================
const SHEETS_BASE_URL='/api/sheets';
const SHEETS_CONFIG=[
  {name:'Books',        csvUrl:`${SHEETS_BASE_URL}?sheet=Books`,        mapper:mapBook},
  {name:'Notifications',csvUrl:`${SHEETS_BASE_URL}?sheet=Notifications`,mapper:mapNotification},
  {name:'Exams',        csvUrl:`${SHEETS_BASE_URL}?sheet=Exams`,        mapper:mapExam},
  {name:'Scholarships', csvUrl:`${SHEETS_BASE_URL}?sheet=Scholarships`, mapper:mapScholarship},
  {name:'Blogs',        csvUrl:`${SHEETS_BASE_URL}?sheet=Blogs`,        mapper:mapBlog},
  {name:'Internships',  csvUrl:`${SHEETS_BASE_URL}?sheet=Internships`,  mapper:mapInternship},
  {name:'Jobs',         csvUrl:`${SHEETS_BASE_URL}?sheet=Jobs`,         mapper:mapJob},
];
window.CMS_DATA=window.CMS_DATA||{};
window.CMS_LOADING=window.CMS_LOADING||{};

function _f(r,keys){for(const k of keys){const v=r[k];if(v!==undefined&&v!==null&&v!=='')return v;}return '';}
function _bool(v){if(!v)return false;const s=String(v).toLowerCase().trim();return s==='true'||s==='yes'||s==='1'||s==='y';}
function _num(v,fb=null){const n=Number(String(v??'').replace(/,/g,'').trim());return Number.isFinite(n)?n:fb;}
function _date(v){const r=String(v??'').trim();if(!r)return'';const d=new Date(r);return Number.isNaN(d.getTime())?r:d.toISOString();}

// BOOKS: ID,Title,Author,Exam Type,Price,Apply Link,Details,PDF Link,Image Link,Category,Language,Pages,Edition,Is Free,Tags,Short Description,Is Featured,Posted Date,Download Link
function mapBook(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),author:_f(r,['Author']),
    examType:_f(r,['Exam Type']),exam_type:_f(r,['Exam Type']),
    price:_f(r,['Price']),applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    category:_f(r,['Category']),language:_f(r,['Language']),
    pages:_num(_f(r,['Pages']),null),edition:_f(r,['Edition']),
    isFree:_bool(_f(r,['Is Free'])),is_free:_bool(_f(r,['Is Free'])),
    tags:_f(r,['Tags']),shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    downloadLink:_f(r,['Download Link']),download_link:_f(r,['Download Link']),
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image Link'])?[_f(r,['Image Link'])]:[]};
}

// NOTIFICATIONS: ID,Message,Link,Start Date,End Date,Is Active,Priority
function mapNotification(r){
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),
    message:_f(r,['Message']),title:_f(r,['Message']),
    link:_f(r,['Link']),startDate:_date(_f(r,['Start Date'])),
    endDate:_date(_f(r,['End Date'])),
    isActive:_bool(_f(r,['Is Active'])),
    priority:_num(_f(r,['Priority']),0)};
}

// EXAMS: ID,Title,Exam Type,Test Date,Registration Deadline,Apply Link,Details,PDF Link,Image Link,Conducting Body,Fee,Eligibility,Syllabus Link,Past Papers Link,Tags,Province,Short Description,Is Featured,Posted Date
function mapExam(r){
  const pd=_date(_f(r,['Posted Date']));
  const td=_f(r,['Test Date']);
  const rd=_f(r,['Registration Deadline']);
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    examType:_f(r,['Exam Type']),exam_type:_f(r,['Exam Type']),
    testDate:td,test_date:td,
    registrationDeadline:rd,registration_deadline:rd,deadline:rd,
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    conductingBody:_f(r,['Conducting Body']),conducting_body:_f(r,['Conducting Body']),
    fee:_f(r,['Fee']),eligibility:_f(r,['Eligibility']),
    syllabusLink:_f(r,['Syllabus Link']),syllabus_link:_f(r,['Syllabus Link']),
    pastPapersLink:_f(r,['Past Papers Link']),past_papers_link:_f(r,['Past Papers Link']),
    tags:_f(r,['Tags']),province:_f(r,['Province']),
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image Link'])?[_f(r,['Image Link'])]:[]};
}

// SCHOLARSHIPS: ID,Title,Country,Funding,Deadline,Eligibility,Apply Link,Details,PDF Link,Image Link,Type,Level,Field,University,Tags,Is Featured,Posted Date,Short Description,Province
function mapScholarship(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    country:_f(r,['Country']),funding:_f(r,['Funding']),
    deadline:_date(_f(r,['Deadline'])),
    eligibility:_f(r,['Eligibility']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    type:_f(r,['Type']),level:_f(r,['Level']),field:_f(r,['Field']),
    university:_f(r,['University']),tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    province:_f(r,['Province']),
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image Link'])?[_f(r,['Image Link'])]:[]};
}

// BLOGS: ID,Title,Category,Description,Short Description,Image URL,Author,Date,Tags,Featured,Apply Link,PDF Link,Related Jobs Tags,Related Exams Tags,Read Time,Is Published
function mapBlog(r){
  const pd=_date(_f(r,['Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    category:_f(r,['Category']),
    description:_f(r,['Description']),details:_f(r,['Description']),
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    imageUrl:_f(r,['Image URL']),image_url:_f(r,['Image URL']),
    author:_f(r,['Author']),date:pd,postedDate:pd,posted_date:pd,
    tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Featured'])),is_featured:_bool(_f(r,['Featured'])),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    relatedJobsTags:_f(r,['Related Jobs Tags']),related_jobs_tags:_f(r,['Related Jobs Tags']),
    relatedExamsTags:_f(r,['Related Exams Tags']),related_exams_tags:_f(r,['Related Exams Tags']),
    readTime:_f(r,['Read Time']),read_time:_f(r,['Read Time']),
    isPublished:_bool(_f(r,['Is Published'])),is_published:_bool(_f(r,['Is Published'])),
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image URL'])?[_f(r,['Image URL'])]:[]};
}

// INTERNSHIPS: ID,Title,Organization,Location,Stipend,Duration,Apply Link,Details,PDF Link,Image Link,Deadline,Type,Category,Tags,Is Featured,Posted Date,Short Description,Education Level
function mapInternship(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    organization:_f(r,['Organization']),location:_f(r,['Location']),
    stipend:_f(r,['Stipend']),duration:_f(r,['Duration']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    deadline:_date(_f(r,['Deadline'])),
    type:_f(r,['Type']),category:_f(r,['Category']),tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    educationLevel:_f(r,['Education Level']),education_level:_f(r,['Education Level']),
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image Link'])?[_f(r,['Image Link'])]:[]};
}

// JOBS: ID,Title,Type,Location,Salary,Organization,Apply Link,Details,PDF Link,Image Link,Deadline,Category,Province,Experience,Education,Tags,Is Featured,Posted Date,Short Description
function mapJob(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    type:_f(r,['Type']),location:_f(r,['Location']),
    salary:_f(r,['Salary']),organization:_f(r,['Organization']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    deadline:_date(_f(r,['Deadline'])),
    category:_f(r,['Category']),province:_f(r,['Province']),
    experience:_f(r,['Experience']),education:_f(r,['Education']),
    tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    pdfLinks:_f(r,['PDF Link'])?[_f(r,['PDF Link'])]:[],
    imageLinks:_f(r,['Image Link'])?[_f(r,['Image Link'])]:[]};
}

function _parseCSV(text){
  const rows=[];let row=[],field='',inQ=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(inQ){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"'){inQ=false;}else{field+=ch;}}
    else{if(ch==='"'){inQ=true;}else if(ch===','){row.push(field.trim());field='';}
    else if(ch==='\r'){/*skip*/}else if(ch==='\n'){row.push(field.trim());field='';
    if(row.some(c=>c!==''))rows.push(row);row=[];}else{field+=ch;}}}
  if(field||row.length){row.push(field.trim());if(row.some(c=>c!==''))rows.push(row);}
  if(!rows.length)return[];
  const headers=rows[0].map(h=>String(h||'').trim());
  return rows.slice(1).map((r,idx)=>{const obj={__rowIndex:idx+2};headers.forEach((h,i)=>{obj[h]=r[i]??'';});return obj;});
}

function _normalize(item){
  const o={...item};
  if(!o.id)o.id=String(Math.random()).slice(2);
  o.title=o.title||o.message||'';
  o.details=o.details||o.description||'';
  o.tags=o.tags||'';
  if(!Array.isArray(o.pdfLinks))o.pdfLinks=o.pdfLinks?[o.pdfLinks]:[];
  if(!Array.isArray(o.imageLinks))o.imageLinks=o.imageLinks?[o.imageLinks]:[];
  if(!Array.isArray(o.mediaLinks))o.mediaLinks=[];
  return o;
}

function _dedupe(arr){
  const s=new Set();
  return arr.filter(it=>{const k=`${it.id}::${(it.title||'').toLowerCase()}`;if(s.has(k))return false;s.add(k);return true;});
}

async function loadOneSheet(cfg){
  const res=await fetch(cfg.csvUrl,{cache:'default'});
  if(!res.ok)throw new Error(`${cfg.name}: HTTP ${res.status}`);
  const text=await res.text();
  if(!text.trim())return[];
  return _dedupe(_parseCSV(text).map(cfg.mapper).map(_normalize));
}

async function loadAllSheets(){
  if(window.CMS_LOADING.global)return window.CMS_DATA;
  window.CMS_LOADING.global=true;
  const results=await Promise.allSettled(SHEETS_CONFIG.map(loadOneSheet));
  results.forEach((r,i)=>{
    const cfg=SHEETS_CONFIG[i];
    const data=r.status==='fulfilled'?r.value:[];
    if(r.status==='rejected')console.warn(`[CMS] Failed ${cfg.name}:`,r.reason?.message||r.reason);
    window.CMS_DATA[cfg.name]=data;
    window.CMS_DATA[cfg.name.toLowerCase()]=data;
  });
  window.CMS_LOADING.global=false;
  if(typeof window._fireCMSReady==='function')window._fireCMSReady();
  return window.CMS_DATA;
}

window.loadAllSheets=loadAllSheets;
window.onCMSReady=window.onCMSReady||function(fn){
  if(typeof fn!=='function')return;
  loadAllSheets().then(()=>fn(window.CMS_DATA)).catch(()=>fn(window.CMS_DATA));
};
loadAllSheets();
