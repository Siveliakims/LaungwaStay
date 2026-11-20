import { client } from './supabase.js';
import { signIn, signUp, signOut, getSession, getProfile } from './auth.js';
import { getApprovedProperties, demoProperties, propertyCard } from './data.js';

const path = location.pathname;
const prefix = path.includes('/owner/')||path.includes('/admin/')||path.includes('/account/') ? '../' : '';
const header = `<header class="site-header"><div class="container nav-row"><a class="brand" href="${prefix}index.html">Luangwa<span>Stay</span></a><button class="mobile-toggle" id="mobile-toggle" aria-label="Open menu">☰</button><nav class="nav-links" id="nav-links"><a href="${prefix}index.html">Home</a><a href="${prefix}stays.html">Explore stays</a><a href="${prefix}destinations.html">Destinations</a><a href="${prefix}premium.html">Premium</a><a href="${prefix}sponsors.html">Sponsors</a><a href="${prefix}list-property.html">List your property</a></nav><div class="nav-actions"><a class="btn btn-outline" href="${prefix}login.html">Sign in</a></div></div></header>`;
const footer = `<footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="${prefix}index.html">Luangwa<span>Stay</span></a><p>Discover your perfect stay. Connecting travellers with welcoming accommodation and local hospitality.</p></div><div><h4>EXPLORE</h4><p><a href="${prefix}stays.html">Explore stays</a></p><p><a href="${prefix}destinations.html">Destinations</a></p><p><a href="${prefix}premium.html">Premium stays</a></p></div><div><h4>WORK WITH US</h4><p><a href="${prefix}list-property.html">List your property</a></p><p><a href="${prefix}about.html">About LuangwaStay</a></p><p><a href="${prefix}contact.html">Contact</a></p></div></div><div class="footer-bottom">© ${new Date().getFullYear()} LuangwaStay. All rights reserved.</div></div></footer>`;
document.getElementById('site-header')?.insertAdjacentHTML('afterbegin',header);
document.getElementById('site-footer')?.insertAdjacentHTML('afterbegin',footer);
document.getElementById('mobile-toggle')?.addEventListener('click',()=>document.getElementById('nav-links')?.classList.toggle('open'));

const {data:properties,demo}=await getApprovedProperties();
const featured=document.getElementById('featured-properties');
if(featured) featured.innerHTML=(demo?properties.filter(p=>p.featured):properties.slice(0,3)).map(propertyCard).join('')||'<div class="empty-state">No approved stays are listed yet.</div>';
const all=document.getElementById('all-properties');
if(all){
 const params=new URLSearchParams(location.search); const q=(params.get('destination')||'').toLowerCase();
 let list=properties.filter(p=>!q||JSON.stringify(p).toLowerCase().includes(q));
 all.innerHTML=list.map(propertyCard).join('')||'<div class="empty-state">No stays match your search yet.</div>';
 document.getElementById('results-count').textContent=`${list.length} ${demo?'sample':'listed'} stays`;
 document.getElementById('stay-search')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const term=String(fd.get('q')||'').toLowerCase();const typ=String(fd.get('type')||'').toLowerCase();const filtered=properties.filter(p=>(!term||JSON.stringify(p).toLowerCase().includes(term))&&(!typ||String(p.property_type||'').toLowerCase()===typ));all.innerHTML=filtered.map(propertyCard).join('')||'<div class="empty-state">No matching stays found.</div>';document.getElementById('results-count').textContent=`${filtered.length} stays found`;});
 document.getElementById('sort-stays')?.addEventListener('change',e=>{const sorted=[...properties].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));all.innerHTML=(e.target.value==='name'?sorted:properties).map(propertyCard).join('');});
}
const premium=document.getElementById('premium-properties');if(premium)premium.innerHTML=(demo?properties:properties.filter(p=>p.is_premium||p.featured)).map(propertyCard).join('')||'<div class="empty-state">Premium stays will appear here.</div>';
const detail=document.getElementById('property-detail');
if(detail){
 const id=new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('demo');
 const p=properties.find(x=>x.id===id);
 if(!p){detail.innerHTML='<div class="empty-state">This property could not be found. <a href="stays.html">Browse all stays</a>.</div>';}
 else{detail.innerHTML=`<p class="eyebrow">${p.location||'Zambia'}</p><h1 style="font:500 45px Playfair Display;color:var(--green)">${p.name||'Accommodation'}</h1><div class="property-layout"><div><div class="property-cover" style="background-image:url('${p.image||p.cover_image_url||'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'}')"></div><h2>About this stay</h2><p>${p.description||'Discover this accommodation.'}</p><p class="muted">${demo?'Sample listing — not bookable.':'Property details are being connected to the live room and availability tables.'}</p></div><aside class="booking-box"><span class="eyebrow">PLAN YOUR STAY</span><h2>${p.price||'Check rates'}</h2><p>Choose your dates and room options when live booking is enabled.</p><a class="btn btn-primary full" href="login.html">Sign in to continue</a><p class="form-note">Bookings and payments will be confirmed through secure server-side services.</p></aside></div>`;}
}
document.getElementById('home-search')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const dest=String(fd.get('destination')||'');location.href='stays.html'+(dest?'?destination='+encodeURIComponent(dest):'');});
document.getElementById('login-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const msg=document.getElementById('auth-message');msg.textContent='Signing in…';try{await signIn(f.email.value,f.password.value);msg.textContent='Signed in. Redirecting…';location.href='account/dashboard.html';}catch(err){msg.textContent=err.message;}});
document.getElementById('register-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const msg=document.getElementById('auth-message');msg.textContent='Creating account…';try{const result=await signUp({email:f.email.value,password:f.password.value,fullName:f.full_name.value,accountType:f.account_type.value});msg.textContent=result.session?'Account created.':'Check your email to confirm your account.';}catch(err){msg.textContent=err.message;}});
document.querySelectorAll('[data-signout]').forEach(b=>b.addEventListener('click',async()=>{await signOut();location.href='../index.html';}));
const protectedPage=document.body.dataset.page==='protected';
if(protectedPage){
 const session=await getSession();
 if(!session){const dest=encodeURIComponent(location.pathname+location.search);location.href=prefix+'login.html?next='+dest;}
 else{
  const profile=await getProfile(session.user.id);
  const required=document.body.dataset.role;
  // Do not infer admin/owner authority from user-editable metadata. The existing RLS policies remain authoritative.
  const box=document.getElementById('dashboard-data')||document.getElementById('owner-data')||document.getElementById('admin-data');
  if(box)box.innerHTML=`<p>Signed in as <strong>${session.user.email}</strong>.</p><p class="muted">Account role and page permissions are enforced by your Supabase database policies. Configure role-aware routing using the protected profile fields in your existing schema.</p>`;
 }
}
document.getElementById('property-form')?.addEventListener('submit',e=>{e.preventDefault();document.getElementById('owner-message').textContent='Form captured in the interface. Map the property fields to your existing properties table before enabling inserts.';});
document.getElementById('contact-form')?.addEventListener('submit',e=>{e.preventDefault();document.getElementById('contact-status').textContent='Thank you. The contact form needs an email provider or secure Edge Function before messages can be delivered.';});
const accountType=new URLSearchParams(location.search).get('type');if(accountType==='owner'&&document.getElementById('account-type'))document.getElementById('account-type').value='owner';
