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
// Escape any value that came from the database or the URL before putting it into innerHTML.
export function esc(value){
 return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
const FALLBACK_IMAGE='https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=80';
// Returns an http(s) image URL that is safe inside style="background-image:url('...')", already HTML-escaped.
export function safeImage(value){
 let url=String(value||'').trim();
 if(!/^https?:\/\//i.test(url))url=FALLBACK_IMAGE;
 url=url.replace(/['"()\\\s<>]/g,char=>encodeURIComponent(char));
 return esc(url);
}
export function propertyImage(p){return p.cover_image_url||p.image_url||p.image||FALLBACK_IMAGE;}
export function propertyCard(p){
 const id=String(p.id??'');
 const isDemo=id.startsWith('demo-');
 const location=p.location||p.city||'Zambia';
 const type=p.property_type||'Stay';
 const name=p.name||p.title||'Accommodation';
 const desc=p.description||'Discover this accommodation on LuangwaStay.';
 const price=p.price_from?`From ZMW ${p.price_from}`:(p.price||'View rates');
 const href=esc(isDemo?'property.html?demo='+encodeURIComponent(id):'property.html?id='+encodeURIComponent(id));
 const sample=isDemo?'<span class="stay-demo">SAMPLE LISTING</span>':'';
 return `<article class="stay-card"><a href="${href}"><div class="stay-image" style="background-image:url('${safeImage(propertyImage(p))}')"><span class="stay-tag">${esc(type)}</span>${sample}</div></a><div class="stay-body"><span class="stay-location">${esc(location)}</span><h3><a href="${href}">${esc(name)}</a></h3><p>${esc(desc)}</p><div class="stay-bottom"><span class="price">${esc(price)}</span><a class="text-link" href="${href}">View stay ↗</a></div></div></article>`;
}
