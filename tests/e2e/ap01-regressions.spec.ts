import {expect,test} from '@playwright/test';
import {loginViaApi} from './helpers.ts';
test.use({trace:'off',screenshot:'off',video:'off'});

test('AP01-R001: actual kiosk rectangles do not overlap',async({page})=>{
 await page.setViewportSize({width:1080,height:1920});await page.goto('/map?etage=1OG');
 const layer=page.getByTestId('map-layer');await expect.poll(()=>layer.locator('button').count()).toBeGreaterThan(0);
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const collisions=await layer.locator('button').evaluateAll(nodes=>{
  const rects=nodes.map(n=>({id:n.getAttribute('data-room-id')||n.getAttribute('data-room-ids'),r:n.getBoundingClientRect()}));const pairs=[];
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j],w=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),h=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
   if(w>0.25&&h>0.25)pairs.push({a:a.id,b:b.id,width:w,height:h});
  }return pairs;
 });
 expect(collisions,'real hit rectangles, not the helper’s hardcoded dimensions').toEqual([]);
});

test('AP01-R002: closing cluster chooser restores keyboard focus to opener',async({page})=>{
 await page.setViewportSize({width:540,height:960});await page.goto('/map?etage=1OG&lang=en');
 const cluster=page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first();
 await expect(cluster).toBeVisible();await cluster.focus();await page.keyboard.press('Enter');
 const chooser=page.getByTestId('map-cluster-chooser');await expect(chooser.locator('h3')).toBeFocused();
 await chooser.getByRole('button',{name:'Close room choices',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(chooser).toHaveCount(0);await expect(cluster).toBeFocused();
});

test('AP01-R003: untranslated room in English chooser gets existing fallback marker',async({page,request,baseURL})=>{
 const headers=await loginViaApi(request,baseURL!);const room=(await(await request.get('/api/admin/rooms/lcc-demo-room-k1-115')).json()).room;
 const original={code:room.code,name:room.name,nameEn:room.nameEn??'',floorId:room.floorId,type:room.type,description:room.description,descriptionEn:room.descriptionEn??'',reservable:room.reservable};
 try{
  const saved=await request.put('/api/admin/rooms/'+room.id,{headers,data:{...original,name:'Beispielraum',nameEn:''}});expect(saved.status()).toBe(200);
  await page.setViewportSize({width:540,height:960});await page.goto('/map?etage=1OG&lang=en');
  await page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first().click();
  const item=page.getByTestId('map-cluster-chooser').getByRole('button',{name:/K1-115/});await expect(item).toContainText('Beispielraum');
  await expect(item).toContainText('Only in German');
 }finally{const restored=await request.put('/api/admin/rooms/'+room.id,{headers,data:original});expect(restored.status()).toBe(200);}
});

test('AP01-R002: choosing a cluster room transfers keyboard focus to its details',async({page})=>{
 await page.setViewportSize({width:540,height:960});await page.goto('/map?etage=1OG&lang=en');
 const cluster=page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first();
 await expect(cluster).toBeVisible();await cluster.focus();await page.keyboard.press('Enter');
 const room=page.getByTestId('map-cluster-chooser').getByRole('button',{name:/K1-115/});await room.focus();await page.keyboard.press('Enter');
 await expect(page.getByTestId('map-details')).toContainText('K1-115');
 await expect(page.getByTestId('map-details').getByRole('heading')).toBeFocused();
});

for (const focusInside of [true,false]) test(`AP01-R002: live regrouping preserves focus ownership (inside chooser: ${focusInside})`,async({page,request,baseURL})=>{
 const headers=await loginViaApi(request,baseURL!);const id='lcc-demo-room-k1-115';
 await page.setViewportSize({width:540,height:960});await page.goto('/map?etage=1OG&lang=en');
 await page.locator(`[data-testid="map-cluster"][data-room-ids~="${id}"]`).click();
 const chooser=page.getByTestId('map-cluster-chooser');await expect(chooser.locator('h3')).toBeFocused();
 const search=page.getByLabel('Search rooms');if(!focusInside)await search.focus();
 let archived=false;
 try{
  expect((await request.post(`/api/admin/rooms/${id}/archive`,{headers})).status()).toBe(200);
  archived=true;
  await expect(chooser).toHaveCount(0,{timeout:12_000});
  await expect(focusInside?page.getByTestId('map-layer').locator('..'):search).toBeFocused();
  await search.focus();
  expect((await request.post(`/api/admin/rooms/${id}/restore`,{headers})).status()).toBe(200);
  archived=false;
  await expect(page.locator('[aria-labelledby="map-list-title"]').getByRole('button',{name:/K1-115/})).toBeVisible({timeout:12_000});
  await expect(chooser).toHaveCount(0);
  await expect(search).toBeFocused();
 }finally{if(archived)expect((await request.post(`/api/admin/rooms/${id}/restore`,{headers})).status()).toBe(200);}
});
