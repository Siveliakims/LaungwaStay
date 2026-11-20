import { client } from './supabase.js';

// Demo cards are intentionally labelled as sample content until live listings are connected.
export const demoProperties = [
 {id:'demo-1',name:'Riverbank Safari Lodge',location:'South Luangwa, Zambia',property_type:'Lodge',description:'A peaceful safari base with welcoming hospitality and a sense of place.',price:'From ZMW 1,250',image:'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80',featured:true},
 {id:'demo-2',name:'The Mfuwe Garden Stay',location:'Mfuwe, Zambia',property_type:'Guesthouse',description:'A relaxed stay with comfortable rooms and easy access to local experiences.',price:'From ZMW 850',image:'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',featured:true},
 {id:'demo-3',name:'Woodland Bush Retreat',location:'Eastern Province, Zambia',property_type:'Lodge',description:'A quiet retreat surrounded by natural beauty.',price:'From ZMW 1,600',image:'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=80',featured:true}
];
export async function getApprovedProperties(){
  if(!client) return {data:demoProperties,demo:true};
  // Confirm the status column and public listing fields against your existing properties table.
  const {data,error}=await client.from('properties').select('*').eq('status','approved').limit(60);
  if(error){console.warn('Live property query needs schema mapping:',error.message);return {data:demoProperties,demo:true,error};}
  return {data:data||[],demo:false};
}
export function propertyCard(p){
 const image=p.cover_image_url||p.image_url||p.image||'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=80';
 const location=p.location||p.city||'Zambia';
 const type=p.property_type||'Stay';
 const name=p.name||p.title||'Accommodation';
 const desc=p.description||'Discover this accommodation on LuangwaStay.';
 const price=p.price_from?`From ZMW ${p.price_from}`:(p.price||'View rates');
 const href=p.id?.startsWith('demo-')?'property.html?demo='+p.id:'property.html?id='+encodeURIComponent(p.id||'');
 return `<article class="stay-card"><a href="${href}"><div class="stay-image" style="background-image:url('${image.replace(/'/g,'%27')}')"><span class="stay-tag">${type}</span></div></a><div class="stay-body"><span class="stay-location">${location}</span><h3><a href="${href}">${name}</a></h3><p>${desc}</p><div class="stay-bottom"><span class="price">${price}</span><a class="text-link" href="${href}">View stay ↗</a></div></div></article>`;
}
