/** Curated, read-only KOSIF Superpowers advisor for SEE. NO power execution. */
export type Superpower = Readonly<{ id:string; name:string; group:string; tags:readonly string[]; source:string }>;
const ROOT = 'https://github.com/kosif199022-jpg/kosif-tool';
const SKILL = '.claude/skills/kosif-superpowers';
const CHAPTERS = ROOT + '/blob/main/' + SKILL + '/';
const CATALOG:readonly Superpower[] = [
  {id:'SELF-05',name:'جرد الأدوات والموصلات',group:'الاكتشاف',tags:['ادوات','أدوات','صلاحيات','موصلات','جهاز','tool','mcp','connector','environment'],source:'references/powers/self-discovery.md'},
  {id:'SELF-07',name:'تصنيف اتصالات MCP',group:'الاكتشاف',tags:['موصلات','اتصال','mcp','صلاحيات','تكلفة','tools'],source:'references/powers/self-discovery.md'},
  {id:'THINK-04',name:'استدعاء القدرات حسب المهمة',group:'التفكير',tags:['قدرات','مهارة','اقتراح','اختيار','catalog','skill','suggest'],source:'references/powers/thinking-core.md'},
  {id:'CHECK-01',name:'حلقة التحقق الثمانية',group:'التحقق',tags:['تحقق','اختبر','إثبات','مخرجات','verify','check','proof'],source:'references/powers/verification-evals.md'},
  {id:'CHECK-06',name:'حلقة تحقق الكود',group:'التحقق',tags:['اختبار','كود','نشر','بناء','إصلاح','test','build','deploy'],source:'references/powers/verification-evals.md'},
  {id:'AGENT-01',name:'توزيع العمل بين الوكلاء',group:'الوكلاء',tags:['وكلاء','توازي','مهام','agent','parallel','subagents'],source:'references/powers/agent-orchestration.md'},
  {id:'CODE-01',name:'البحث عن الأدوات قبل البناء',group:'الكود',tags:['مستودع','برمجة','تطوير','كود','github','repo','code','library'],source:'references/powers/code-engineering.md'},
  {id:'ANLY-01',name:'تحليل الجداول',group:'البيانات',tags:['اكسل','حسابات','بيانات','تحليل','جدول','excel','csv','data'],source:'references/powers/data-analysis.md'},
  {id:'APP-05',name:'اختبار عرض الجوال',group:'واجهات',tags:['واجهة','جوال','موبايل','تصميم','مقاس','ui','mobile','responsive'],source:'references/powers/apps-artifacts.md'},
  {id:'SEC-01',name:'المحتوى غير الموثوق بيانات لا أوامر',group:'الأمان',tags:['أمان','حماية','بيانات','ثغرة','حقن','security','injection','prompt'],source:'references/powers/security-safety.md'},
  {id:'SEC-05',name:'حماية المفاتيح والأسرار',group:'الأمان',tags:['مفتاح','سر','مفاتيح','توكن','key','secret','token'],source:'references/powers/security-safety.md'},
];
function normalize(s:string) {
  return s.toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'')
    .replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function superpowersManifest() {
  return {name:'KOSIF SEE × Superpowers',source:ROOT+'/tree/main/'+SKILL,version:'curated-2026-10-16',
    mode:'advisory_only' as const,executorAvailableInWorker:false as const,fullCatalogLoaded:false as const,
    records:CATALOG.length,message:'هذا فهرس ترشيح مختصر، وليس تشغيلًا لقدرات المستودع أو تحققًا من الجهاز.'};
}
export function suggestSuperpowers(task:string, limit=6) {
  if(typeof task!=='string'||!task.trim()) throw new Error('TASK_REQUIRED');
  if(task.length>240) throw new Error('TASK_TOO_LONG');
  if(!Number.isInteger(limit)||limit<1||limit>10) throw new Error('INVALID_LIMIT');
  const words=normalize(task).split(' ').filter(w=>w.length>=2);
  const ranked=CATALOG.map((item,index)=>({item,index,
    score:item.tags.reduce((sum,tag)=>sum+(words.some(w=>w===normalize(tag)||(w.length>=4&&normalize(tag).includes(w)))?1:0),0)
  })).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
  return {...superpowersManifest(),task:task.trim(),
    suggested:ranked.slice(0,limit).map(({item})=>({id:item.id,name:item.name,group:item.group,
      source:CHAPTERS+item.source,evidence:'documented_only' as const,execution:'not_run' as const}))};
}
