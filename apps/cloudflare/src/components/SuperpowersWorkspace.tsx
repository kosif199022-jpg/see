import {useEffect,useState,type FormEvent} from 'react';
import {api} from '../api';
type Power={id:string;name:string;group:string;source:string;evidence:'documented_only';execution:'not_run'};
type Result={name:string;version:string;mode:'advisory_only';records:number;message:string;suggested?:Power[]};
export function SuperpowersWorkspace(){
  const [task,setTask]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{api<Result>('/api/v1/superpowers').then(setResult)
    .catch(e=>setError(e instanceof Error?e.message:'تعذر تحميل الفهرس'));},[]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!task.trim()||busy)return;
    setBusy(true);setError('');
    try{setResult(await api<Result>('/api/v1/superpowers/suggest?task='+encodeURIComponent(task.trim())));}
    catch(e){setError(e instanceof Error?e.message:'تعذر ترشيح القدرات');}finally{setBusy(false);}
  }
  return <div className="workspace-view superpowers-workspace">
    <div className="workspace-title"><div><span className="overline">KOSIF SUPERPOWERS</span>
      <h1>دليل القدرات الخارقة</h1>
      <p>ترشيح قدرات موثّقة من KOSIF Tool، دون تنفيذ أدوات أو إرسال بيانات العميل.</p></div></div>
    <section className="panel-glass"><h2>اكتشاف القدرة المناسبة</h2>
      <form className="form-stack" onSubmit={submit}>
        <label htmlFor="superpowers-task">وصف المهمة<input id="superpowers-task" value={task}
          onChange={e=>setTask(e.target.value)} maxLength={240} required
          placeholder="مثال: افحص أدوات الجهاز واختبر الكود والنشر"/></label>
        <button type="submit" disabled={busy||!task.trim()}>{busy?'جارٍ الترشيح…':'اقترح القدرات'}</button>
      </form>
      {error&&<p className="alert error" role="alert">{error}</p>}
      {result&&<p className="indicator-note" role="status">{result.message} ({result.records} سجلًا مختارًا · {result.version}).
        التشغيل المحلي للكتالوج الكامل يتطلب وجود مهارة Python على جهاز مصرح به.</p>}
    </section>
    {result?.suggested&&<section className="panel-glass"><h2>نتائج الترشيح</h2>
      {result.suggested.length?<div className="card-list">{result.suggested.map(power=><article
        className="list-card" key={power.id}><div><small>{power.id} · {power.group}</small>
          <strong>{power.name}</strong><small>موثّق فقط · لم يُنفّذ على جهازك</small></div>
        <a className="ghost-action" href={power.source} target="_blank" rel="noopener noreferrer">المصدر</a>
      </article>)}</div>:<p className="muted">لا توجد مطابقة في الفهرس المختصر، وقد توجد في الكتالوج الكامل.</p>}
    </section>}
    <section className="panel-glass"><h2>حدود التنفيذ</h2><p>Cloudflare Worker يقدّم توصيات فقط.
      تشغيل <code>probe_env.py</code> و<code>powers.py suggest</code> متاح عبر جسر محلي منفصل بعد تثبيت المهارة،
      مع موافقة المستخدم وبوابات الأمان. لا توجد أدوات تحكم بالجهاز في هذه الصفحة.</p></section>
  </div>;
}
