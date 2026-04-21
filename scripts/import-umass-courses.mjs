import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '../frontend/node_modules/@supabase/supabase-js/dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, 'frontend/.env.local');

const SPIRE_LOGIN_URL =
  'https://www.spire.umass.edu/psp//heproda/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL?FolderPath=PORTAL_ROOT_OBJECT.CO_EMPLOYEE_SELF_SERVICE.HC_CLASS_SEARCH_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder';
const SPIRE_ENTRY_URL =
  'https://www.spire.umass.edu/psc/heproda/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL?PAGE=SSR_CLSRCH_ENTRY';
const SPIRE_POST_URL =
  'https://www.spire.umass.edu/psc/heproda/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL';

const CAREERS = ['UGRD', 'GRAD'];
const WRITE = process.argv.includes('--write');
const CREATE_MISSING_DEPARTMENTS = process.argv.includes('--create-missing-departments');

const DEPARTMENT_ALIAS_PAIRS = [
  ['aerospace studies', 'military leadership'],
  ['art - student teaching', 'art education'],
  ['art', 'art & design'],
  ['bachelor\'s deg. w/indiv conc.', 'bachelor’s degree with individual concentration (bdic)'],
  ['biochemistry & molecular bio.', 'biochemistry and molecular biology'],
  ['building & construction tech', 'building and construction technology'],
  ['civil & environmental engrg', 'civil engineering'],
  ['college of inform & comp sci', 'computer science'],
  ['data analytics and computation', 'data analytics and computational social science'],
  ['electrical & computer engin', 'electrical and computer engineering'],
  ['english writing program', 'english'],
  ['environmental & natural resource economics', 'resource economics'],
  ['french studies', 'french & francophone studies'],
  ['french-student teaching', 'french & francophone studies'],
  ['german', 'german and scandinavian studies'],
  ['health promotion & policy', 'health policy and management'],
  ['hispanic lit. & linguistics', 'hispanic literatures and linguistics'],
  ['hospitality & tourism managmnt', 'hospitality and tourism management'],
  ['humanities and fine arts', 'humanities & fine arts'],
  ['isenberg school of management', 'management'],
  ['japanese', 'japanese language & literature'],
  ['languages, literature&culture', 'comparative literature'],
  ['latin american studies', 'hispanic literatures and linguistics'],
  ['materials science and engineer', 'materials science and engineering'],
  ['mechanical & industrial engrg', 'mechanical engineering'],
  ['operations & info management', 'operations & information management'],
  ['organismic & evolutionary biol', 'organismic and evolutionary biology'],
  ['public health', 'public health sciences'],
  ['psychological & brain sciences', 'psychology'],
  ['russian', 'russian and east european studies'],
  ['scandinavian', 'german and scandinavian studies'],
  ['school psychology', 'psychology'],
  ['school of pub hlth & hlth sci', 'public health sciences'],
  ['school of public policy', 'public policy'],
  ['social thought & polic. econ', 'social thought and political economy'],
  ['speech, language,& hearing sci', 'speech, language, and hearing sciences'],
  ['statistics', 'statistics and data science'],
  ['sustainable community', 'sustainable community development'],
  ['university without walls', 'university without walls interdisciplinary studies'],
  ['women,gender,sexuality studies', 'women, gender, sexuality studies'],
];

const DEPARTMENT_ALIASES = new Map(
  DEPARTMENT_ALIAS_PAIRS.map(([from, to]) => [normalize(from), to])
);

function readEnv(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator);
        const value = line.slice(separator + 1).replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFormFields(html) {
  const fields = new Map();

  for (const input of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = input[0];
    const name = tag.match(/\bname=['"]([^'"]+)['"]/i)?.[1];
    if (!name) continue;

    const type = tag.match(/\btype=['"]([^'"]+)['"]/i)?.[1]?.toLowerCase() ?? 'text';
    if (['button', 'submit', 'image'].includes(type)) continue;
    if (type === 'checkbox' && !/\bchecked=['"]?checked['"]?/i.test(tag)) continue;

    const value = tag.match(/\bvalue=['"]([^'"]*)['"]/i)?.[1] ?? '';
    fields.set(name, decodeHtml(value));
  }

  for (const select of html.matchAll(/<select\b[^>]*\bname=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/select>/gi)) {
    const [, name, body] = select;
    const options = [...body.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)];
    const selected = options.find(([tag]) => /\bselected=['"]?selected['"]?/i.test(tag)) ?? options[0];
    const value = selected?.[1].match(/\bvalue=['"]([^'"]*)['"]/i)?.[1] ?? '';
    fields.set(name, decodeHtml(value));
  }

  return fields;
}

function parseSubjects(html) {
  const select = html.match(
    /<select\b[^>]*\bname=['"]CLASS_SRCH_WRK2_SUBJECT\$108\$['"][^>]*>([\s\S]*?)<\/select>/i
  )?.[1];

  if (!select) throw new Error('Could not find SPIRE subject dropdown.');

  return [...select.matchAll(/<option\b[^>]*\bvalue=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/option>/gi)]
    .map(([, code, label]) => ({ code: decodeHtml(code), label: decodeHtml(label) }))
    .filter((subject) => subject.code && subject.label);
}

function parseCourses(html, subjectCode) {
  const courses = new Map();
  const pattern = new RegExp(`${subjectCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([A-Z]*\\d+[A-Z]*(?:-[A-Z0-9]+)?)\\s+-\\s+([^<]+)`, 'gi');

  for (const match of html.matchAll(pattern)) {
    const number = decodeHtml(match[1]);
    const title = decodeHtml(match[2]);
    const key = `${subjectCode} ${number}::${title}`.toLowerCase();
    courses.set(key, {
      course_number: `${subjectCode} ${number}`,
      title,
    });
  }

  return [...courses.values()];
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

function storeCookies(cookies, response) {
  const setCookieHeaders =
    response.headers.getSetCookie?.() ??
    response.headers.get('set-cookie')?.split(/,(?=\s*[^;,=\s]+=[^;,]+)/) ??
    [];

  for (const header of setCookieHeaders) {
    const [pair] = header.split(';');
    const separator = pair.indexOf('=');
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

async function spireFetch(cookies, url, options = {}) {
  let currentUrl = url;
  let currentOptions = options;
  let response;

  for (let redirectCount = 0; redirectCount < 10; redirectCount += 1) {
    response = await fetch(currentUrl, {
      ...currentOptions,
      headers: {
        ...currentOptions.headers,
        Cookie: cookieHeader(cookies),
        'User-Agent': 'Mozilla/5.0 UNotes course import',
      },
      redirect: 'manual',
    });

    storeCookies(cookies, response);

    if (![301, 302, 303, 307, 308].includes(response.status)) break;

    const location = response.headers.get('location');
    if (!location) break;

    currentUrl = new URL(location, currentUrl).toString();
    currentOptions =
      response.status === 303 || response.status === 301 || response.status === 302
        ? { method: 'GET' }
        : currentOptions;
  }

  if (!response.ok) {
    throw new Error(`SPIRE request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function createSpireSession() {
  const cookies = new Map();
  await spireFetch(cookies, SPIRE_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ userid: 'GUEST', pwd: 'GUEST' }),
  });

  const entryHtml = await spireFetch(cookies, SPIRE_ENTRY_URL);
  return { cookies, entryHtml, subjects: parseSubjects(entryHtml) };
}

function resolveDepartment(subject, departmentByName) {
  const normalizedLabel = normalize(subject.label);
  const alias = DEPARTMENT_ALIASES.get(normalizedLabel);

  return (
    departmentByName.get(normalizedLabel) ??
    (alias ? departmentByName.get(normalize(alias)) : undefined)
  );
}

async function createDepartment(supabase, departmentByName, subject) {
  const normalizedLabel = normalize(subject.label);
  const existing = departmentByName.get(normalizedLabel);
  if (existing) return existing;

  if (!WRITE || !CREATE_MISSING_DEPARTMENTS) {
    return null;
  }

  const { data, error } = await supabase
    .from('Departments')
    .insert({ department_name: subject.label })
    .select('department_id, department_name')
    .single();

  if (error) throw error;

  departmentByName.set(normalizedLabel, data);
  console.log(`Created department: ${subject.label}`);
  return data;
}

async function searchSubject(cookies, entryHtml, subjectCode, career) {
  const fields = parseFormFields(entryHtml);
  fields.set('ICAction', 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH$29$');
  fields.set('CLASS_SRCH_WRK2_SUBJECT$108$', subjectCode);
  fields.set('CLASS_SRCH_WRK2_ACAD_CAREER', career);
  fields.set('CLASS_SRCH_WRK2_SSR_OPEN_ONLY$chk', 'N');
  fields.delete('CLASS_SRCH_WRK2_SSR_OPEN_ONLY');

  return spireFetch(cookies, SPIRE_POST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: SPIRE_ENTRY_URL,
    },
    body: new URLSearchParams(fields),
  });
}

async function main() {
  const env = readEnv(envPath);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL/key in frontend/.env.local.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: departments, error: departmentError } = await supabase
    .from('Departments')
    .select('department_id, department_name');

  if (departmentError) throw departmentError;

  const departmentByName = new Map(
    departments.map((department) => [normalize(department.department_name), department])
  );

  const { data: existingCourses, error: coursesError } = await supabase
    .from('Courses')
    .select('department_id, course_number, title');

  if (coursesError) throw coursesError;

  const existingCourseKeys = new Set(
    existingCourses.map((course) =>
      `${course.department_id}::${normalize(course.course_number)}::${normalize(course.title)}`
    )
  );

  const { cookies, entryHtml, subjects } = await createSpireSession();
  const pendingCourses = [];
  const unmatchedSubjects = [];
  const createdSubjectLabels = [];

  for (const subject of subjects) {
    let department = resolveDepartment(subject, departmentByName);

    if (!department) {
      department = await createDepartment(supabase, departmentByName, subject);

      if (department) {
        createdSubjectLabels.push(subject.label);
      } else {
        unmatchedSubjects.push(subject);
        continue;
      }
    }

    for (const career of CAREERS) {
      process.stdout.write(`Fetching ${subject.code} ${career}...\n`);
      const resultHtml = await searchSubject(cookies, entryHtml, subject.code, career);
      const courses = parseCourses(resultHtml, subject.code);

      for (const course of courses) {
        const key = `${department.department_id}::${normalize(course.course_number)}::${normalize(course.title)}`;
        if (existingCourseKeys.has(key)) continue;

        existingCourseKeys.add(key);
        pendingCourses.push({
          department_id: department.department_id,
          course_number: course.course_number,
          title: course.title,
        });
      }
    }
  }

  console.log(`Matched subjects: ${subjects.length - unmatchedSubjects.length}/${subjects.length}`);
  console.log(`Created departments: ${createdSubjectLabels.join(', ') || 'none'}`);
  console.log(`Unmatched subjects: ${unmatchedSubjects.map((subject) => `${subject.code} (${subject.label})`).join(', ') || 'none'}`);
  console.log(`Courses ready to insert: ${pendingCourses.length}`);

  if (!WRITE) {
    console.log('Dry run complete. Re-run with --write to insert rows.');
    return;
  }

  for (let index = 0; index < pendingCourses.length; index += 500) {
    const batch = pendingCourses.slice(index, index + 500);
    const { error } = await supabase.from('Courses').insert(batch);
    if (error) throw error;
    console.log(`Inserted ${Math.min(index + 500, pendingCourses.length)}/${pendingCourses.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
