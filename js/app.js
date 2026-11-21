import { client } from './supabase.js';
import { signIn, signUp, signOut, getSession, getProfile } from './auth.js';
import { getApprovedProperties, demoProperties, propertyCard, esc, safeImage, propertyImage } from './data.js';

const path = location.pathname;
const prefix = path.includes('/owner/')||path.includes('/admin/')||path.includes('/account/') ? '../' : '';
// Only follow same-site, absolute-path redirects (blocks open redirects such as //evil.com or https://evil.com).
const safeNext=value=>{
 if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '';
 try{const u=new URL(value,location.origin);if(u.origin!==location.origin||/\/(login|register)\.html$/.test(u.pathname))return '';return u.pathname+u.search+u.hash;}catch{return '';}
};
// Client-side role check for navigation only. Real authority stays with Supabase RLS / server-side code.
// Fails closed: if the role cannot be read from the profile, owner and admin pages stay hidden.
const roleOf=profile=>String(profile?.role??profile?.user_role??profile?.account_type??'').toLowerCase().trim();
const canAccess=(required,role)=>required==='admin'?role==='admin':required==='owner'?['owner','property_owner','admin'].includes(role):true;
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
 const params=new URLSearchParams(location.search);
 const searchForm=document.getElementById('stay-search');
 const destinationField=searchForm?.elements.q;
 const checkinField=searchForm?.elements.checkin;
 const checkoutField=searchForm?.elements.checkout;
 const guestsField=searchForm?.elements.guests;
 const status=document.getElementById('search-message');
 const typeInputs=[...document.querySelectorAll('[name="stay-type"]')];
 const priceFilter=document.getElementById('price-filter');
 const sortField=document.getElementById('sort-stays');
 const requestedTypes=params.getAll('type').map(value=>value.toLowerCase());
 const requestedType=(params.get('type')||'').toLowerCase();
 if(destinationField)destinationField.value=params.get('destination')||params.get('q')||'';
 if(checkinField)checkinField.value=params.get('checkin')||'';
 if(checkoutField)checkoutField.value=params.get('checkout')||'';
 if(guestsField)guestsField.value=params.get('guests')||'2';
 if(priceFilter)priceFilter.value=params.get('price')||'';
 if(sortField)sortField.value=params.get('sort')||'recommended';
 typeInputs.forEach(input=>input.checked=(requestedTypes.length?requestedTypes:requestedType?[requestedType]:[]).includes(input.value.toLowerCase()));
 const localDate=day=>{const d=new Date();d.setDate(d.getDate()+day);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 if(checkinField)checkinField.min=localDate(0);
 if(checkoutField)checkoutField.min=checkinField?.value||localDate(0);
 checkinField?.addEventListener('change',()=>{if(checkoutField){checkoutField.min=checkinField.value||localDate(0);if(checkoutField.value&&checkoutField.value<=checkinField.value)checkoutField.value='';}});
 const priceOf=p=>{const raw=p.price_from??p.price??'';const n=Number(raw);if(Number.isFinite(n)&&n>0)return n;const parsed=String(raw).replace(/,/g,'').match(/\d+(?:\.\d+)?/);return parsed?Number(parsed[0]):0;};
 const syncSearchUrl=()=>{
  const next=new URLSearchParams();
  const destination=String(destinationField?.value||'').trim();
  if(destination)next.set('destination',destination);
  if(checkinField?.value)next.set('checkin',checkinField.value);
  if(checkoutField?.value)next.set('checkout',checkoutField.value);
  if(guestsField?.value)next.set('guests',guestsField.value);
  typeInputs.filter(input=>input.checked).forEach(input=>next.append('type',input.value.toLowerCase()));
  if(priceFilter?.value)next.set('price',priceFilter.value);
  if(sortField?.value&&sortField.value!=='recommended')next.set('sort',sortField.value);
  history.replaceState(null,'',location.pathname+(next.toString()?'?'+next.toString():''));
 };
 const render=()=>{
  const term=String(destinationField?.value||'').trim().toLowerCase();
  const selectedTypes=typeInputs.filter(input=>input.checked).map(input=>input.value.toLowerCase());
  const budget=priceFilter?.value||'';
  let list=properties.filter(p=>{
   const matchesTerm=!term||JSON.stringify(p).toLowerCase().includes(term);
   const matchesType=!selectedTypes.length||selectedTypes.includes(String(p.property_type||'').toLowerCase());
   const price=priceOf(p);
   const matchesBudget=!budget||(price>0&&(budget==='under-1000'?price<1000:budget==='1000-2000'?price>=1000&&price<=2000:price>2000));
   return matchesTerm&&matchesType&&matchesBudget;
  });
  const sort=sortField?.value||'recommended';
  list.sort((a,b)=>{
   if(sort==='price-low'||sort==='price-high'){
    const pa=priceOf(a),pb=priceOf(b);
    if(!pa&&!pb)return 0;
    if(!pa)return 1;
    if(!pb)return -1;
    return sort==='price-low'?pa-pb:pb-pa;
   }
   if(sort==='name')return String(a.name||a.title||'').localeCompare(String(b.name||b.title||''));
   return Number(Boolean(b.featured||b.is_premium))-Number(Boolean(a.featured||a.is_premium));
  });
  all.innerHTML=list.map(propertyCard).join('')||(properties.length?'<div class="empty-state">No stays match these filters. Try widening your search.</div>':'<div class="empty-state">No properties are listed yet. Please check back soon, or <a href="list-property.html">list your property</a>.</div>');
  document.getElementById('results-count').textContent=list.length+' '+(demo?'sample stays':'listed stays');
 };
 searchForm?.addEventListener('submit',event=>{
  event.preventDefault();
  if(checkinField?.value&&checkoutField?.value&&checkoutField.value<=checkinField.value){if(status)status.textContent='Check-out must be after check-in.';checkoutField.focus();return;}
  syncSearchUrl();
  if(status)status.textContent=checkinField?.value||checkoutField?.value?'Dates and guest count are saved in your search. Room availability is not connected yet.':'Search updated.';
  render();
 });
 typeInputs.forEach(input=>input.addEventListener('change',()=>{syncSearchUrl();render();}));
 priceFilter?.addEventListener('change',()=>{syncSearchUrl();render();});
 sortField?.addEventListener('change',()=>{syncSearchUrl();render();});
 render();
}
const premium=document.getElementById('premium-properties');if(premium)premium.innerHTML=(demo?properties:properties.filter(p=>p.is_premium||p.featured)).map(propertyCard).join('')||'<div class="empty-state">Premium stays will appear here.</div>';
const detail=document.getElementById('property-detail');
if(detail){
 const id=new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('demo');
 const p=properties.find(x=>x.id===id);
 if(!p){detail.innerHTML='<div class="empty-state">This property could not be found. <a href="stays.html">Browse all stays</a>.</div>';}
 else{const detailPrice=p.price_from?`From ZMW ${p.price_from}`:(p.price||'Check rates');detail.innerHTML=`<p class="eyebrow">${esc(p.location||p.city||'Zambia')}</p><h1 style="font:500 45px Playfair Display;color:var(--green)">${esc(p.name||p.title||'Accommodation')}</h1><div class="property-layout"><div><div class="property-cover" style="background-image:url('${safeImage(propertyImage(p))}')"></div><h2>About this stay</h2><p>${esc(p.description||'Discover this accommodation.')}</p><p class="muted">${demo?'Sample listing — not bookable.':'Property details are being connected to the live room and availability tables.'}</p></div><aside class="booking-box"><span class="eyebrow">PLAN YOUR STAY</span><h2>${esc(detailPrice)}</h2><p>Choose your dates and room options when live booking is enabled.</p><a class="btn btn-primary full" href="login.html">Sign in to continue</a><p class="form-note">Bookings and payments will be confirmed through secure server-side services.</p></aside></div>`;}
}
document.getElementById('home-search')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const params=new URLSearchParams();for(const key of ['destination','checkin','checkout','guests']){const value=String(fd.get(key)||'').trim();if(value)params.set(key,value);}if(fd.get('checkin')&&fd.get('checkout')&&String(fd.get('checkout'))<=String(fd.get('checkin'))){alert('Check-out must be after check-in.');return;}location.href='stays.html'+(params.toString()?'?'+params.toString():'');});
document.getElementById('login-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const msg=document.getElementById('auth-message');msg.textContent='Signing in…';try{await signIn(f.email.value,f.password.value);msg.textContent='Signed in. Redirecting…';location.href=safeNext(new URLSearchParams(location.search).get('next'))||'account/dashboard.html';}catch(err){msg.textContent=err.message;}});
document.getElementById('register-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const msg=document.getElementById('auth-message');msg.textContent='Creating account…';try{const result=await signUp({email:f.email.value,password:f.password.value,fullName:f.full_name.value,accountType:f.account_type.value});msg.textContent=result.session?'Account created.':'Check your email to confirm your account.';}catch(err){msg.textContent=err.message;}});
document.querySelectorAll('[data-signout]').forEach(b=>b.addEventListener('click',async()=>{await signOut();location.href='../index.html';}));
const protectedPage=document.body.dataset.page==='protected';
if(protectedPage){
 const session=await getSession();
 if(!session){const dest=encodeURIComponent(location.pathname+location.search);location.href=prefix+'login.html?next='+dest;}
 else{
  const profile=await getProfile(session.user.id);
  const required=document.body.dataset.role;
  // Do not infer admin/owner authority from user-editable metadata (user_metadata). The role comes from the profiles table only.
  const allowed=canAccess(required,roleOf(profile));
  if(!allowed){document.querySelector('main')?.setAttribute('hidden','');location.replace(prefix+'account/dashboard.html');}
  const box=allowed?(document.getElementById('dashboard-data')||document.getElementById('owner-data')||document.getElementById('admin-data')):null;
  if(box){
   if(path.endsWith('/account/profile.html')){
    const metadata=session.user.user_metadata||{};
    const nameField=profile?['full_name','fullName','display_name','displayName','name'].find(key=>Object.prototype.hasOwnProperty.call(profile,key)):null;
    const phoneField=profile?['phone','phone_number','phoneNumber','mobile','mobile_number'].find(key=>Object.prototype.hasOwnProperty.call(profile,key)):null;
    const fullName=profile?.[nameField]||metadata.full_name||metadata.fullName||metadata.name||'';
    const phone=profile?.[phoneField]||metadata.phone||metadata.phone_number||'';
    const escapeHtml=esc;
    box.innerHTML=`<form class="form-card" id="profile-form"><label>Full name<input name="full_name" autocomplete="name" required value="${escapeHtml(fullName)}"></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" value="${escapeHtml(phone)}"></label><label>Email address<input type="email" value="${escapeHtml(session.user.email)}" disabled><small class="form-note">Email changes are managed through your sign-in settings.</small></label><button class="btn btn-primary" type="submit">Save profile</button><p id="profile-message" class="form-note" aria-live="polite"></p></form>`;
    document.getElementById('profile-form').addEventListener('submit',async event=>{
     event.preventDefault();
     const form=event.currentTarget;
     const message=document.getElementById('profile-message');
     const button=form.querySelector('button[type="submit"]');
     const nextName=form.elements.full_name.value.trim();
     const nextPhone=form.elements.phone.value.trim();
     button.disabled=true;
     message.textContent='Saving…';
     try{
      const {error:authError}=await client.auth.updateUser({data:{full_name:nextName,phone:nextPhone}});
      if(authError)throw authError;
      if(profile&&(nameField||phoneField)){
       const changes={};
       if(nameField)changes[nameField]=nextName;
       if(phoneField)changes[phoneField]=nextPhone;
       const {error:profileError}=await client.from('profiles').update(changes).eq('id',session.user.id);
       if(profileError){
        console.warn('Profile table update:',profileError.message);
        message.textContent='Your account details were saved, but the profile table could not be synced: '+profileError.message;
       }else{
        if(nameField)profile[nameField]=nextName;
        if(phoneField)profile[phoneField]=nextPhone;
        message.textContent='Profile saved.';
       }
      }else message.textContent='Profile saved to your account.';
     }catch(error){
      message.textContent=error.message||'Your profile could not be saved.';
     }finally{button.disabled=false;}
    });
   }else box.innerHTML=`<p>Signed in as <strong>${esc(session.user.email)}</strong>.</p><p class="muted">Account role and page permissions are enforced by your Supabase database policies. Configure role-aware routing using the protected profile fields in your existing schema.</p>`;
  }
 }
}
document.getElementById('property-form')?.addEventListener('submit',e=>{e.preventDefault();document.getElementById('owner-message').textContent='Form captured in the interface. Map the property fields to your existing properties table before enabling inserts.';});
document.getElementById('contact-form')?.addEventListener('submit',e=>{e.preventDefault();document.getElementById('contact-status').textContent='Thank you. The contact form needs an email provider or secure Edge Function before messages can be delivered.';});
const accountType=new URLSearchParams(location.search).get('type');if(accountType==='owner'&&document.getElementById('account-type'))document.getElementById('account-type').value='owner';
