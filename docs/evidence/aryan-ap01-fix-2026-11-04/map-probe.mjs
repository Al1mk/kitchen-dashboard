// Read-only technical UI probe; synthetic demo DB, not human or Elo evidence.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const [app,baseURL,out]=process.argv.slice(2);
const {chromium,expect}=createRequire(join(app,'package.json'))('@playwright/test');
await mkdir(join(out,'screens'),{recursive:true});
const browser=await chromium.launch();const observations=[];const flows=[];
const settle=async page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
const measure=async page=>page.getByTestId('map-layer').evaluate(layer=>{
 const box=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
 const dock=document.querySelector('[data-public-dock]');const boundary=dock?dock.getBoundingClientRect().top:innerHeight;
 const nodes=[...layer.querySelectorAll('button')];const targets=nodes.map(el=>({label:el.getAttribute('data-room-id')||el.getAttribute('data-room-ids')||el.textContent.trim(),cluster:el.dataset.testid==='map-cluster',pressed:el.getAttribute('aria-pressed'),box:box(el.getBoundingClientRect())}));
 const overlaps=[];
 for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
  const a=targets[i],b=targets[j],left=Math.max(a.box.left,b.box.left),right=Math.min(a.box.right,b.box.right),top=Math.max(a.box.top,b.box.top),bottom=Math.min(a.box.bottom,b.box.bottom);
  if(right-left>0.25&&bottom-top>0.25){const x=(left+right)/2,y=(top+bottom)/2;const inView=x>=0&&x<innerWidth&&y>=0&&y<boundary;const hit=inView?document.elementFromPoint(x,y)?.closest('button'):null;
   overlaps.push({a:a.label,b:b.label,width:right-left,height:bottom-top,inView,hit:hit?.getAttribute('data-room-id')||hit?.getAttribute('data-room-ids')||null});
  }
 }
 return {rootPx:parseFloat(getComputedStyle(document.documentElement).fontSize),layer:box(layer.getBoundingClientRect()),targets,overlaps};
});
try{
 for(const size of [{width:1080,height:1920},{width:900,height:1600},{width:540,height:960},{width:1440,height:900}]){
  const context=await browser.newContext({viewport:size,hasTouch:size.width!==1440,baseURL,timezoneId:'Europe/Berlin'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.name+': '+e.message));
  for(const lang of ['de','en'])for(const floor of ['1OG','2OG','3OG']){
   await page.goto(`/map?etage=${floor}&lang=${lang}`);await expect.poll(()=>page.getByTestId('map-layer').locator('button').count()).toBeGreaterThan(0);await settle(page);
   for(const clicks of [0,2,2]){
    for(let i=0;i<clicks;i++)await page.getByRole('button',{name:lang==='de'?'Vergrößern':'Zoom in',exact:true}).click();
    await settle(page);const result=await measure(page);observations.push({viewport:size,lang,floor,...result,pageErrors:[...errors]});
    if(clicks===0&&lang==='de')await page.screenshot({path:join(out,'screens',`${size.width}x${size.height}-${floor}-fit.png`)});
   }
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:540,height:960},hasTouch:true,baseURL});const page=await context.newPage();
 for(const lang of ['de','en']){
  await page.goto(`/map?etage=1OG&datum=2026-11-08&lang=${lang}`);await settle(page);
  const cluster=page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first();
  await expect(cluster).toBeVisible();await cluster.focus();await page.keyboard.press('Enter');
  const chooser=page.getByTestId('map-cluster-chooser');await expect(chooser).toBeVisible();await settle(page);
  const chooserText=await chooser.innerText();const headingFocused=await chooser.locator('h3').evaluate(el=>document.activeElement===el);
  const rooms=await(await context.request.get('/api/public/rooms')).json();const sourceRoom=rooms.rooms.find(r=>r.id==='lcc-demo-room-k1-115');
  await page.screenshot({path:join(out,'screens',`540x960-${lang}-chooser.png`)});
  const close=chooser.getByRole('button',{name:lang==='de'?'Auswahl schließen':'Close room choices',exact:true});await close.focus();await page.keyboard.press('Enter');
  await expect(cluster).toBeFocused();
  const focusAfterClose=await page.evaluate(()=>({tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label')}));
  await page.keyboard.press('Tab');const nextTab=await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.trim().slice(0,100)}));
  for(const room of ['115','118']){
   await cluster.click();await expect(chooser).toBeVisible();await chooser.getByRole('button',{name:new RegExp('K1-'+room)}).click();
   await expect(page.getByTestId('map-details')).toContainText('K1-'+room);await expect(page).toHaveURL(new RegExp('raum=lcc-demo-room-k1-'+room));
  }
  flows.push({lang,headingFocused,focusAfterClose,nextTab,chooserText,sourceRoom:{name:sourceRoom.name,nameEn:sourceRoom.nameEn},url:page.url().replace(baseURL,''),scheduleHref:await page.getByTestId('map-details').getByRole('link',{name:lang==='de'?'Termine in diesem Raum':'Classes in this room'}).getAttribute('href')});
 }
 await context.close();
 await writeFile(join(out,'observations.json'),JSON.stringify({observations,flows},null,2)+'\n');
 console.log(JSON.stringify({contexts:observations.length,withOverlaps:observations.filter(r=>r.overlaps.length).length,visibleOverlapCases:observations.filter(r=>r.overlaps.some(p=>p.inView)).length,pageErrors:observations.flatMap(r=>r.pageErrors).length,flows},null,2));
}finally{await browser.close();}
