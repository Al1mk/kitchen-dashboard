import {describe,expect,test} from 'vitest';
import {groupMapMarkers, type MapPin, type MarkerGroup} from '../../src/lib/map/marker-clusters.ts';
import {TEAM_DEMO_ROOMS} from '../../src/lib/map/team-catalog.ts';
const measuredGroups: <T>(pins: readonly MapPin<T>[], width: number, height: number, metrics: {markerWidth:number;clusterWidth:number;height:number}) => MarkerGroup<T>[] = groupMapMarkers;
const ratios={'1OG':872/1804,'2OG':870/1808,'3OG':1015/1550};
describe('AP01-R001: use measured CSS-pixel target sizes',()=>{
 for(const scale of [1,19/16,22/16])test(`no overlapping targets at ${scale*16}px root size`,()=>{
  const metrics={markerWidth:72*scale,clusterWidth:44*scale,height:44*scale};
  for(const floor of ['1OG','2OG','3OG'] as const)for(const width of [500,728,850.5,999,1498.5,1998,2184]){
   const pins=TEAM_DEMO_ROOMS.filter(r=>r.floorId===floor&&r.position).map(r=>({id:r.id,room:r,x:r.position!.x,y:r.position!.y}));
   const height=width*ratios[floor];const groups=measuredGroups(pins,width,height,metrics);
   expect(groups.flatMap(g=>g.pins.map(p=>p.id)).sort()).toEqual(pins.map(p=>p.id).sort());
   for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
    const a=groups[i],b=groups[j],aw=a.pins.length>1?metrics.clusterWidth:metrics.markerWidth,bw=b.pins.length>1?metrics.clusterWidth:metrics.markerWidth;
    expect(Math.abs(a.x-b.x)*width<(aw+bw)/2&&Math.abs(a.y-b.y)*height<metrics.height,`${floor},${width},${scale}: real target overlap`).toBe(false);
   }
  }
 });
 test('zero/unavailable sizing does not render guessed hit targets',()=>{
  expect(measuredGroups([{id:'x',x:.5,y:.5,room:{}}],500,250,{markerWidth:0,clusterWidth:44,height:44})).toEqual([]);
 });
});
