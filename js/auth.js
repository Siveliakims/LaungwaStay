import { client } from './supabase.js';
export async function signIn(email,password){
  if(!client) throw new Error('Supabase is not configured yet. Add your project URL and anon key.');
  const {data,error}=await client.auth.signInWithPassword({email,password}); if(error) throw error; return data;
}
export async function signUp({email,password,fullName,accountType}){
  if(!client) throw new Error('Supabase is not configured yet. Add your project URL and anon key.');
  const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:fullName,account_type:accountType}}});
  if(error) throw error; return data;
}
export async function signOut(){if(client) await client.auth.signOut();}
export async function getSession(){if(!client)return null;const {data}=await client.auth.getSession();return data.session;}
export async function getProfile(userId){
  if(!client)return null;
  // Adjust the selected columns if your existing profiles table uses different names.
  const {data,error}=await client.from('profiles').select('*').eq('id',userId).maybeSingle();
  if(error) console.warn('Profile lookup:',error.message); return data;
}
