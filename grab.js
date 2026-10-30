/* monkeypref grabber — loaded by the bookmark on tabroom.com. Reads the judge list + each paradigm/record
   with the user's own Tabroom session and hands the data to the monkeypref window. */
(function(){
function mpGrab(APP){
  if(window.__mpBusy){return}
  var tbl=document.getElementById('judgelist');
  if(!/(^|\.)tabroom\.com$/.test(location.hostname)||!tbl){alert("monkeypref: open a Tabroom judge list first (a tournament's Judges page, while logged in).");return}
  window.__mpBusy=1;
  var win=window.open(APP,'monkeypref');
  var target;try{target=new URL(APP).origin}catch(e){target='*'}if(!target||target==='null')target='*';
  var box=document.createElement('div');
  box.style.cssText='position:fixed;z-index:2147483647;right:16px;bottom:16px;background:#1f2023;color:#d1d0c5;font:14px/1.4 system-ui,sans-serif;padding:12px 16px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.35);max-width:340px';
  document.body.appendChild(box);
  function say(t){box.innerHTML='';var b=document.createElement('b');b.textContent='monkeypref ';b.style.color='#e2b714';box.appendChild(b);box.appendChild(document.createTextNode(t))}
  function txt(el){if(!el)return '';var v=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(!v){v=(el.getAttribute('data-text')||'').trim();if(/^(.)\1{3,}$/.test(v))v=''}return v}
  var heads=[].map.call(tbl.querySelectorAll('thead th'),function(th){return (th.innerText||'').trim()||th.title||''});
  var rows=[].slice.call(tbl.querySelectorAll('tbody tr'));
  var cols=[],skip={paradigm:1,record:1,'':1};
  heads.forEach(function(h,i){if(!skip[h.toLowerCase()])cols.push({label:h,i:i})});
  var judges=rows.map(function(tr,n){
    var a=tr.querySelector('a[href*="judge_person_id="]'),m=a&&/judge_person_id=(\d+)/.exec(a.getAttribute('href'));
    var rec=tr.querySelector('a[href*="postings/judge.mhtml"]');
    var cells={};cols.forEach(function(c){cells[c.label]=txt(tr.cells[c.i])});
    return {pid:m?m[1]:null,n:n,cells:cells,record:rec?rec.href:null,paradigm:null,reviewed:''};
  });
  var hs=[].map.call(document.querySelectorAll('h2,h4,h5'),function(e){return e.innerText.trim()});
  var catLine=hs.filter(function(h){return /judges?$/i.test(h)&&/:/.test(h)})[0]||'';
  var qs=new URLSearchParams(location.search);
  var data={app:'monkeypref',v:1,tourn:(document.querySelector('h2')||{}).innerText||document.title,where:hs[1]||'',
    category:catLine.replace(/:\s*\d+\s*judges?$/i,'').trim()||('category '+qs.get('category_id')),
    tournId:qs.get('tourn_id'),categoryId:qs.get('category_id'),url:location.href,fetchedAt:new Date().toISOString(),cols:cols.map(function(c){return c.label}),judges:judges};
  var todo=judges.filter(function(j){return j.pid}),done=0,failed=0,needLogin=false;
  async function getPar(pid){
    var r=await fetch('/index/paradigm.mhtml?judge_person_id='+pid,{credentials:'include'});
    var s='';
    if(r.body&&r.body.getReader){var rd=r.body.getReader(),dec=new TextDecoder();
      for(;;){var c=await rd.read();if(c.done)break;s+=dec.decode(c.value,{stream:true})}s+=dec.decode()}
    else s=await r.text();
    var d=new DOMParser().parseFromString(s,'text/html');
    if(/must be logged in/i.test(d.body?d.body.textContent:'')){needLogin=true;throw new Error('login')}
    var p=d.querySelector('div.paradigm:not(.screens)'),rv=d.querySelector('.screens.paradigm .rightalign');
    return {html:p?p.innerHTML.trim():'',reviewed:rv?rv.textContent.replace(/\s+/g,' ').trim():'',rec:recStats(d)};
  }
  // judge record tab: one row per round judged; Vote = side this judge voted for, Result = panel decision (e.g. "Aff 2-1", panels only)
  function recStats(d){
    var t=d.getElementById('judgerecord');if(!t)return null;
    var hs=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim().toLowerCase()});
    var vi=hs.indexOf('vote'),ri=hs.indexOf('result');if(vi<0)return null;
    var AFF=/^(aff|affirmative|pro|gov|government|prop|proposition)$/i,NEG=/^(neg|negative|con|opp|opposition)$/i;
    var o={rounds:0,aff:0,neg:0,panels:0,maj:0};
    [].forEach.call(t.querySelectorAll('tbody tr'),function(tr){
      if(!tr.cells.length)return;o.rounds++;
      var v=(tr.cells[vi]?tr.cells[vi].textContent:'').replace(/\s+/g,' ').trim(),r=ri>-1&&tr.cells[ri]?tr.cells[ri].textContent.replace(/\s+/g,' ').trim():'';
      if(AFF.test(v))o.aff++;else if(NEG.test(v))o.neg++;
      if(r){o.panels++;var lv=v.toLowerCase(),lr=r.toLowerCase();if(lv&&(lr===lv||lr.indexOf(lv+' ')===0))o.maj++}
    });
    return o;
  }
  async function worker(){
    while(todo.length&&!needLogin){var j=todo.shift();
      for(var t=0;t<3;t++){try{var r=await getPar(j.pid);j.paradigm=r.html;j.reviewed=r.reviewed;j.rec=r.rec;break}catch(e){if(needLogin)break;if(t===2){failed++;j.paradigm=null;j.err=1}else await new Promise(function(z){setTimeout(z,600*(t+1))})}}
      done++;say('reading paradigms + records… '+done+' / '+judges.filter(function(j){return j.pid}).length);
    }
  }
  var ready=false,sent=false;
  window.addEventListener('message',function(e){if(win&&e.source===win&&e.data&&e.data.type==='monkeypref-ready'){ready=true;send()}});
  function send(){
    if(sent||!ready||!data.done)return;sent=true;
    win.postMessage({type:'monkeypref-data',data:data},target);
    say('sent '+judges.length+' judges'+(failed?' ('+failed+' paradigms failed — re-run to retry)':'')+'.');
    window.__mpBusy=0;setTimeout(function(){box.remove()},5000);
  }
  say('reading paradigms… 0 / '+todo.length);
  Promise.all([0,1,2,3,4,5].map(worker)).then(function(){
    window.__mpLast=data;
    if(needLogin){say('Tabroom says you are logged out. Log in and click the bookmark again.');window.__mpBusy=0;return}
    data.done=true;
    if(!win||win.closed){
      say('done. ');var btn=document.createElement('button');btn.textContent='open monkeypref';
      btn.style.cssText='background:#e2b714;color:#1f2023;border:0;border-radius:6px;padding:3px 10px;font:inherit;cursor:pointer;margin-left:6px';
      btn.onclick=function(){win=window.open(APP,'monkeypref');btn.remove();say('opening…')};box.appendChild(btn);
    }else send();
  });
}
var me=document.currentScript,app=me&&me.getAttribute('data-app');
if(!app){alert('monkeypref: re-drag the bookmark from the monkeypref site.');return}
mpGrab(app);
})();
