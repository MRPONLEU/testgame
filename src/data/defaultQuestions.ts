import { Question, ExamModule } from '../types';

export const DEFAULT_MODULES: ExamModule[] = [
  {
    id: 'mod_it_1',
    code: 'MOD-01',
    name: 'វគ្គទី ១: បញ្ញាសិប្បនិម្មិត AI & មូលដ្ឋានគ្រឹះ IT',
    description: 'ការយល់ដឹងអំពី AI, ប្រព័ន្ធ Hardware និងមុខងារទូទៅ',
    color: 'blue',
  },
  {
    id: 'mod_it_2',
    code: 'MOD-02',
    name: 'វគ្គទី ២: សុវត្ថិភាពទិន្នន័យ Cyber Security',
    description: 'ពាក្យសម្ងាត់, Phishing, 2FA និងសុវត្ថិភាព Wi-Fi',
    color: 'emerald',
  },
  {
    id: 'mod_it_3',
    code: 'MOD-03',
    name: 'វគ្គទី ៣: កម្មវិធីការិយាល័យ & Cloud Storage',
    description: 'Google Drive, Excel Formula, រូបភាព PNG និង Shortcuts',
    color: 'purple',
  },
];

export interface ExamPreset {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  description: string;
  modules?: ExamModule[];
  questions: Question[];
}

export const DEFAULT_EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'preset-digital-skills',
    title: 'តេស្តសមត្ថភាពជំនាញឌីជីថល & IT (Digital Skills)',
    category: 'បច្ចេកវិទ្យាព័ត៌មាន',
    durationMinutes: 5,
    description: 'វាស់ស្ទង់ការយល់ដឹងលើអ៊ីនធឺណិត សុវត្ថិភាពទិន្នន័យ កម្មវិធីការិយាល័យ និងបញ្ញាសិប្បនិម្មិត AI',
    modules: DEFAULT_MODULES,
    questions: [
      {
        id: 'q1',
        prompt: 'តើពាក្យកាត់ AI នៅក្នុងវិស័យបច្ចេកវិទ្យាតំណាងឱ្យអ្វី?',
        options: [
          { id: 'opt1', text: 'Artificial Intelligence (បញ្ញាសិប្បនិម្មិត)' },
          { id: 'opt2', text: 'Automated Internet' },
          { id: 'opt3', text: 'Advanced Integration' },
          { id: 'opt4', text: 'Application Interface' },
        ],
        correctOptionId: 'opt1',
        explanation: 'AI តំណាងឱ្យ Artificial Intelligence ដែលមានន័យថាបញ្ញាសិប្បនិម្មិត ឬប្រព័ន្ធកុំព្យូទ័រឆ្លាតវៃ។',
        points: 10,
        moduleId: 'mod_it_1',
      },
      {
        id: 'q2',
        prompt: 'តើការអនុវត្តមួយណាដែលមានសុវត្ថិភាពបំផុតសម្រាប់ការបង្កើតពាក្យសម្ងាត់ (Password)?',
        options: [
          { id: 'opt1', text: 'ប្រើថ្ងៃខែឆ្នាំកំណើតរបស់ខ្លួន' },
          { id: 'opt2', text: 'ប្រើលេខទូរស័ព្ទដើម្បីងាយស្រួលចាំ' },
          { id: 'opt3', text: 'រួមបញ្ចូលអក្សរធំ តូច លេខ និងនិមិត្តសញ្ញាពិសេស ហើយមានយ៉ាងតិច ៨ ទៅ ១២ តួ' },
          { id: 'opt4', text: 'ប្រើពាក្យសម្ងាត់ "12345678" ឬ "password"' },
        ],
        correctOptionId: 'opt3',
        explanation: 'ពាក្យសម្ងាត់រឹងមាំត្រូវមានអក្សរធំ តូច លេខ និងនិមិត្តសញ្ញាពិសេស (ឧ. @#$%) ដើម្បីការពារពី Hacker។',
        points: 10,
        moduleId: 'mod_it_2',
      },
      {
        id: 'q3',
        prompt: 'តើប៊ូតុងកាត់ Shortcut លើក្តារចុច (Keyboard) មួយណាប្រើសម្រាប់ចម្លង (Copy) អត្ថបទ ឬឯកសារ?',
        options: [
          { id: 'opt1', text: 'Ctrl + V (ឬ Command + V)' },
          { id: 'opt2', text: 'Ctrl + C (ឬ Command + C)' },
          { id: 'opt3', text: 'Ctrl + X (ឬ Command + X)' },
          { id: 'opt4', text: 'Ctrl + Z (ឬ Command + Z)' },
        ],
        correctOptionId: 'opt2',
        explanation: 'Ctrl + C សម្រាប់ Copy, Ctrl + V សម្រាប់ Paste, Ctrl + X សម្រាប់ Cut, Ctrl + Z សម្រាប់ Undo។',
        points: 10,
        moduleId: 'mod_it_3',
      },
      {
        id: 'q4',
        prompt: 'តើ Phishing ក្នុងពិភពអ៊ីនធឺណិតមានន័យដូចម្តេច?',
        options: [
          { id: 'opt1', text: 'ការទាញយកកម្មវិធីលឿនជាងមុន' },
          { id: 'opt2', text: 'ការបោកបញ្ឆោតតាមរយៈអ៊ីមែល ឬតំណភ្ជាប់ក្លែងក្លាយដើម្បីលួចព័ត៌មានផ្ទាល់ខ្លួន' },
          { id: 'opt3', text: 'ការស្វែងរកឯកសារក្នុងកុំព្យូទ័រ' },
          { id: 'opt4', text: 'ការតភ្ជាប់បណ្តាញ Wi-Fi សាធារណៈ' },
        ],
        correctOptionId: 'opt2',
        explanation: 'Phishing គឺជាល្បិចបោកប្រាស់តាមអ៊ីនធឺណិតដោយផ្ញើសារ ឬអ៊ីមែលក្លែងបន្លំពីធនាគារ/ក្រុមហ៊ុនដើម្បីលួចលេខសម្ងាត់។',
        points: 10,
        moduleId: 'mod_it_2',
      },
      {
        id: 'q5',
        prompt: 'តើសេវាកម្ម Cloud Storage ណាខ្លះដែលពេញនិយមសម្រាប់ការផ្ទុកឯកសារលើអ៊ីនធឺណិត?',
        options: [
          { id: 'opt1', text: 'Google Drive, Microsoft OneDrive, Dropbox' },
          { id: 'opt2', text: 'VLC Media Player' },
          { id: 'opt3', text: 'Notepad និង Calculator' },
          { id: 'opt4', text: 'Paint និង WordPad' },
        ],
        correctOptionId: 'opt1',
        explanation: 'Google Drive, OneDrive និង Dropbox គឺជាប្រព័ន្ធ Cloud Storage សម្រាប់រក្សាទុកឯកសារដែលមានសុវត្ថិភាព។',
        points: 10,
        moduleId: 'mod_it_3',
      },
      {
        id: 'q6',
        prompt: 'នៅក្នុងកម្មវិធី Microsoft Excel ឬ Google Sheets តើរូបមន្តណាប្រើសម្រាប់បូកសរុបលេខ?',
        options: [
          { id: 'opt1', text: '=AVERAGE()' },
          { id: 'opt2', text: '=SUM()' },
          { id: 'opt3', text: '=COUNT()' },
          { id: 'opt4', text: '=MAX()' },
        ],
        correctOptionId: 'opt2',
        explanation: 'រូបមន្ត =SUM() ប្រើសម្រាប់បូកសរុបតម្លៃលេខក្នុងជួរ (Range)។',
        points: 10,
        moduleId: 'mod_it_3',
      },
      {
        id: 'q7',
        prompt: 'តើការបើកដំណើរការ Two-Factor Authentication (2FA) ផ្តល់អត្ថប្រយោជន៍អ្វីខ្លះ?',
        options: [
          { id: 'opt1', text: 'ធ្វើឱ្យទូរស័ព្ទដើរលឿនជាងមុន' },
          { id: 'opt2', text: 'បន្ថែមស្រទាប់សុវត្ថិភាពទីពីរ (លេខកូដផ្ទៀងផ្ទាត់) បន្ទាប់ពីវាយពាក្យសម្ងាត់' },
          { id: 'opt3', text: 'សន្សំសំចៃថ្មទូរស័ព្ទ' },
          { id: 'opt4', text: 'បង្កើនទំហំផ្ទុកទិន្នន័យទូរស័ព្ទ' },
        ],
        correctOptionId: 'opt2',
        explanation: '2FA ទាមទារលេខកូដផ្ទៀងផ្ទាត់លើទូរស័ព្ទបន្ថែមលើលេខសម្ងាត់ ការពារមិនឱ្យជនខិលខូចចូលគណនីបានងាយ។',
        points: 10,
        moduleId: 'mod_it_2',
      },
      {
        id: 'q8',
        prompt: 'តើ QR Code តំណាងឱ្យពាក្យពេញជាភាសាអង់គ្លេសអ្វី?',
        options: [
          { id: 'opt1', text: 'Quick Response Code' },
          { id: 'opt2', text: 'Quality Reader Code' },
          { id: 'opt3', text: 'Quantum Radio Code' },
          { id: 'opt4', text: 'Query Result Code' },
        ],
        correctOptionId: 'opt1',
        explanation: 'QR Code មកពីពាក្យ Quick Response Code ដែលជាបាកូដពីរវិមាត្រអាចស្កេនយ៉ាងរហ័ស។',
        points: 10,
        moduleId: 'mod_it_1',
      },
      {
        id: 'q9',
        prompt: 'តើទម្រង់ឯកសាររូបភាពណាដែលមានសមត្ថភាពបង្ហាញផ្ទៃខាងក្រោយថ្លា (Transparent Background)?',
        options: [
          { id: 'opt1', text: 'JPEG (.jpg)' },
          { id: 'opt2', text: 'PNG (.png)' },
          { id: 'opt3', text: 'MP3 (.mp3)' },
          { id: 'opt4', text: 'TXT (.txt)' },
        ],
        correctOptionId: 'opt2',
        explanation: 'PNG គាំទ្រ Alpha Transparency ដែលអនុញ្ញាតឱ្យរូបភាពមានផ្ទៃខាងក្រោយថ្លា ងាយស្រួលរចនាក្រាហ្វិក។',
        points: 10,
        moduleId: 'mod_it_3',
      },
      {
        id: 'q10',
        prompt: 'ពេលប្រើប្រាស់ Wi-Fi សាធារណៈ (ឧទាហរណ៍៖ នៅហាងកាហ្វេ) តើសកម្មភាពណាដែលមិនគួរធ្វើបំផុត?',
        options: [
          { id: 'opt1', text: 'អានព័ត៌មានទូទៅ' },
          { id: 'opt2', text: 'មើលវីដេអូកម្សាន្ត' },
          { id: 'opt3', text: 'ធ្វើប្រតិបត្តិការធនាគារ (Mobile Banking) ដោយគ្មាន VPN' },
          { id: 'opt4', text: 'ស្តាប់ចម្រៀង' },
        ],
        correctOptionId: 'opt3',
        explanation: 'Wi-Fi សាធារណៈងាយរងការស្ទាក់ចាប់ទិន្នន័យ (Packet Sniffing) មិនគួរធ្វើប្រតិបត្តិការហិរញ្ញវត្ថុដែលប្រឈមហានិភ័យឡើយ។',
        points: 10,
        moduleId: 'mod_it_2',
      },
    ],
  },
  {
    id: 'preset-general-knowledge',
    title: 'តេស្តចំណេះដឹងទូទៅ & ប្រវត្តិសាស្ត្រខ្មែរ (General Knowledge)',
    category: 'ចំណេះដឹងទូទៅ',
    durationMinutes: 5,
    description: 'សំណួរសាកល្បងចំណេះដឹងទូទៅ ប្រវត្តិសាស្ត្រ រមណីយដ្ឋាន និងភូមិសាស្ត្រនៃព្រះរាជាណាចក្រកម្ពុជា',
    questions: [
      {
        id: 'gk1',
        prompt: 'តើប្រាសាទអង្គរវត្តត្រូវបានកសាងឡើងក្នុងរាជ្យព្រះមហាក្សត្រអង្គណា?',
        options: [
          { id: 'opt1', text: 'ព្រះបាទជ័យវរ្ម័នទី ៧' },
          { id: 'opt2', text: 'ព្រះបាទសូរ្យវរ្ម័នទី ២' },
          { id: 'opt3', text: 'ព្រះបាទជ័យវរ្ម័នទី ២' },
          { id: 'opt4', text: 'ព្រះបាទឥន្ទ្រវរ្ម័នទី ១' },
        ],
        correctOptionId: 'opt2',
        explanation: 'ប្រាសាទអង្គរវត្តត្រូវបានកសាងឡើងនៅដើមសតវត្សរ៍ទី ១២ ក្នុងរាជ្យព្រះបាទសូរ្យវរ្ម័នទី ២។',
        points: 10,
      },
      {
        id: 'gk2',
        prompt: 'តើភ្នំដែលខ្ពស់ជាងគេបំផុតនៅព្រះរាជាណាចក្រកម្ពុជាមានឈ្មោះអ្វី?',
        options: [
          { id: 'opt1', text: 'ភ្នំបូកគោ' },
          { id: 'opt2', text: 'ភ្នំឱរ៉ាល់' },
          { id: 'opt3', text: 'ភ្នំគូលែន' },
          { id: 'opt4', text: 'ភ្នំដងរែក' },
        ],
        correctOptionId: 'opt2',
        explanation: 'ភ្នំឱរ៉ាល់មានកម្ពស់ ១,៨១៣ ម៉ែត្រ ស្ថិតក្នុងខេត្តកំពង់ស្ពឺ ជាភ្នំខ្ពស់ជាងគេនៅកម្ពុជា។',
        points: 10,
      },
      {
        id: 'gk3',
        prompt: 'តើបឹងទន្លេសាបជាប្រភពទឹកសាបធំបំផុតនៅក្នុងតំបន់ណា?',
        options: [
          { id: 'opt1', text: 'អាស៊ីអាគ្នេយ៍' },
          { id: 'opt2', text: 'អាស៊ីបូព៌ា' },
          { id: 'opt3', text: 'អាស៊ីខាងត្បូង' },
          { id: 'opt4', text: 'អឺរ៉ុប' },
        ],
        correctOptionId: 'opt1',
        explanation: 'បឹងទន្លេសាបជាបឹងទឹកសាបធម្មជាតិធំជាងគេបង្អស់នៅអាស៊ីអាគ្នេយ៍ (Southeast Asia)។',
        points: 10,
      },
      {
        id: 'gk4',
        prompt: 'តើអង្គការយូណេស្កូ (UNESCO) បានចុះបញ្ជី «ល្ខោនខោលវត្តស្វាយអណ្តែត» ជាបេតិកភណ្ឌអរូបីនៃមនុស្សជាតិនៅឆ្នាំណា?',
        options: [
          { id: 'opt1', text: 'ឆ្នាំ ២០០៨' },
          { id: 'opt2', text: 'ឆ្នាំ ២០១៨' },
          { id: 'opt3', text: 'ឆ្នាំ ២០២២' },
          { id: 'opt4', text: 'ឆ្នាំ ២០១៥' },
        ],
        correctOptionId: 'opt2',
        explanation: 'ល្ខោនខោលវត្តស្វាយអណ្តែតត្រូវបានចុះក្នុងបញ្ជីបេតិកភណ្ឌវប្បធម៌អរូបីនៅថ្ងៃទី ២៨ ខែវិច្ឆិកា ឆ្នាំ ២០១៨។',
        points: 10,
      },
      {
        id: 'gk5',
        prompt: 'តើទិវាបុណ្យឯករាជ្យជាតិកម្ពុជាប្រារព្ធឡើងនៅថ្ងៃខែណាជារៀងរាល់ឆ្នាំ?',
        options: [
          { id: 'opt1', text: 'ថ្ងៃទី ៧ ខែមករា' },
          { id: 'opt2', text: 'ថ្ងៃទី ៩ ខែវិច្ឆិកា' },
          { id: 'opt3', text: 'ថ្ងៃទី ២៣ ខែតុលា' },
          { id: 'opt4', text: 'ថ្ងៃទី ១ ខែមិថុនា' },
        ],
        correctOptionId: 'opt2',
        explanation: 'កម្ពុជាទទួលបានឯករាជ្យបរិបូរណ៍ពីអាណានិគមបារាំងនៅថ្ងៃទី ៩ ខែវិច្ឆិកា ឆ្នាំ ១៩៥៣។',
        points: 10,
      },
    ],
  },
  {
    id: 'preset-soft-skills',
    title: 'តេស្តជំនាញទន់ & ក្រមសីលធម៌ការងារ (Soft Skills & Work Ethic)',
    category: 'ការអភិវឌ្ឍវិជ្ជាជីវៈ',
    durationMinutes: 5,
    description: 'វាស់ស្ទង់សមត្ថភាពដោះស្រាយបញ្ហា ភាពជាអ្នកដឹកនាំ ការធ្វើការងារជាក្រុម និងទំនាក់ទំនងវិជ្ជាជីវៈ',
    questions: [
      {
        id: 'ss1',
        prompt: 'នៅពេលមានការយល់ច្រឡំ ឬជម្លោះគំនិតរវាងសមាជិកក្នុងក្រុម តើសកម្មភាពណាដែលវិជ្ជមានបំផុត?',
        options: [
          { id: 'opt1', text: 'ឈប់និយាយរកគ្នា និងធ្វើការដាច់ដោយឡែក' },
          { id: 'opt2', text: 'បើកការសន្ទនាដោយការស្តាប់ដោយយកចិត្តទុកដាក់ និងស្វែងរកដំណោះស្រាយរួមឈ្នះ-ឈ្នះ' },
          { id: 'opt3', text: 'បន្ទោសអ្នកដទៃភ្លាមៗនៅចំពោះមុខអ្នកគ្រប់គ្រង' },
          { id: 'opt4', text: 'បង្ហោះបញ្ហានៅលើបណ្តាញសង្គមផ្ទាល់ខ្លួន' },
        ],
        correctOptionId: 'opt2',
        explanation: 'ការស្តាប់ដោយបើកចិត្តទូលាយ (Active Listening) និងការចរចាស្វែងរកផលប្រយោជន៍រួមជាគន្លឹះដោះស្រាយជម្លោះវិជ្ជាជីវៈ។',
        points: 10,
      },
      {
        id: 'ss2',
        prompt: 'តើពាក្យថា "Time Management" (ការគ្រប់គ្រងពេលវេលា) ផ្តោតលើចំណុចសំខាន់អ្វី?',
        options: [
          { id: 'opt1', text: 'ធ្វើការងារគ្រប់យ៉ាងក្នុងពេលតែមួយដោយគ្មានការរៀបចំ' },
          { id: 'opt2', text: 'កំណត់អាទិភាពការងារ (Prioritization) និងរៀបចំកាលវិភាគឱ្យមានប្រសិទ្ធភាព' },
          { id: 'opt3', text: 'ទុកការងាររហូតដល់ជិតផុតកំណត់ (Deadline) ទើបធ្វើ' },
          { id: 'opt4', text: 'ធ្វើតែការងារងាយៗមុនជានិច្ច' },
        ],
        correctOptionId: 'opt2',
        explanation: 'ការគ្រប់គ្រងពេលវេលាល្អ គឺការចេះកំណត់អាទិភាព (សំខាន់ និងបន្ទាន់) ដើម្បីសម្រេចគោលដៅឱ្យទាន់ពេល។',
        points: 10,
      },
      {
        id: 'ss3',
        prompt: 'នៅពេលទទួលបានការរិះគន់ស្ថាបនា (Constructive Feedback) ពីគ្រូ ឬប្រធានក្រុម តើគួរមានឥរិយាបថបែបណា?',
        options: [
          { id: 'opt1', text: 'ខឹងសម្បារ និងមិនព្រមទទួលយកជាដាច់ខាត' },
          { id: 'opt2', text: 'ទទួលយកដោយក្តីដឹងគុណ វិភាគចំណុចខ្វះខាត និងកែលម្អការងារឱ្យកាន់តែប្រសើរ' },
          { id: 'opt3', text: 'រកលេសដោះសារដើម្បីគេចវេះពីទំនួលខុសត្រូវ' },
          { id: 'opt4', text: 'សុំឈប់ពីការងារភ្លាមៗ' },
        ],
        correctOptionId: 'opt2',
        explanation: 'អ្នកមាន Growth Mindset តែងចាត់ទុកមតិកែលម្អជាឱកាសដើម្បីអភិវឌ្ឍសមត្ថភាពខ្លួនឯង។',
        points: 10,
      },
      {
        id: 'ss4',
        prompt: 'ក្នុងការសរសេរអ៊ីមែលវិជ្ជាជីវៈ (Professional Email) តើចំណុចណាដែលមិនគួរធ្វើ?',
        options: [
          { id: 'opt1', text: 'ដាក់ចំណងជើង (Subject) ច្បាស់លាស់ និងសមស្របនឹងខ្លឹមសារ' },
          { id: 'opt2', text: 'ប្រើពាក្យគួរសម និងពិនិត្យអក្ខរាវិរុទ្ធមុនផ្ញើ' },
          { id: 'opt3', text: 'សរសេរអក្សរធំទាំងអស់ (ALL CAPS) និងប្រើពាក្យស្លោកមិនសមរម្យ' },
          { id: 'opt4', text: 'ភ្ជាប់ឯកសារដែលមានឈ្មោះត្រឹមត្រូវ' },
        ],
        correctOptionId: 'opt3',
        explanation: 'ការសរសេរអក្សរធំទាំងអស់ក្នុងអ៊ីមែល ត្រូវបានគេចាត់ទុកថាជាការស្រែកគំហោក និងខ្វះវិជ្ជាជីវៈ។',
        points: 10,
      },
    ],
  },
];
