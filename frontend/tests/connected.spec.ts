import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const env=Object.fromEntries(readFileSync('../.env','utf8').split(/\r?\n/).filter(Boolean).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));
test('live admin data, catering prices, settings, and both inquiry forms',async({page,context})=>{
 const request=context.request;
 const api=async(path:string,method='GET',data?:unknown)=>{
  const r=await request.fetch('/api/v1'+path,{method,data});expect(r.ok(),`${method} ${path}: ${await r.text()}`).toBe(true);return r.json();
 };
 await api('/auth/login','POST',{email:env.OWNER_EMAIL,password:env.OWNER_PASSWORD});
 const items=await api('/admin/items');const item=items.find((i:any)=>i.name==='Butter Chicken');
 const settings=(await api('/admin/settings'))[0];const catering=await api('/admin/catering');const tray=catering[0];
 const marker='Browser verification '+Date.now();
 try{
  await page.goto('/menu');await page.getByRole('searchbox').fill(item.name);
  await expect(page.locator('.menu-item')).toHaveCount(1);
  await api('/admin/items/'+item.id,'PUT',{...item,price_cents:item.price_cents+123});
  await expect(page.locator('.menu-item')).toContainText('$'+((item.price_cents+123)/100).toFixed(2),{timeout:20000});
  await api('/admin/items/'+item.id,'PUT',{...item,available:false});
  await expect(page.locator('.menu-item')).toHaveCount(0,{timeout:20000});
  await api('/admin/items/'+item.id,'PUT',item);
  await api('/admin/settings/'+settings.id,'PUT',{...settings,hero_text:marker,phones:['9725550123',...settings.phones.slice(1)]});
  await page.goto('/');await expect(page.locator('h1')).toHaveText(marker);
  await expect(page.locator('.nav-phone')).toContainText('9725550123');
  await expect(page.locator('.nav-order a')).toHaveAttribute('href',settings.order_url);
  await api('/admin/catering/'+tray.id,'PUT',{...tray,price_cents:tray.price_cents+100});
  await page.goto('/catering');await page.locator('.category-tabs').getByRole('button',{name:tray.section,exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:tray.name}).first()).toContainText('$'+((tray.price_cents+100)/100).toFixed(2));
  for(const kind of ['contact','catering']){
   await page.goto('/'+kind);const form=page.locator('form');
   await form.getByLabel('Name',{exact:true}).fill('Browser verification');
   await form.getByLabel('Email',{exact:true}).fill('verification@example.com');
   await form.getByLabel('Phone',{exact:true}).fill('9725550123');
   await form.getByLabel('Your message').fill(marker+' '+kind);
   if(kind==='catering'){await form.getByLabel('Date',{exact:true}).fill('2026-12-20');await form.getByLabel('Number of guests').fill('25')}
   await form.getByRole('button',{name:kind==='contact'?'Send message':'Send catering inquiry'}).click();
   await expect(page.getByRole('heading',{name:'Thank you for reaching out.'})).toBeVisible();
   const inbox=await api('/admin/inquiries');expect(inbox.some((i:any)=>i.message===marker+' '+kind&&i.kind===kind)).toBe(true);
  }
 }finally{
  await api('/admin/items/'+item.id,'PUT',item);
  await api('/admin/settings/'+settings.id,'PUT',settings);
  await api('/admin/catering/'+tray.id,'PUT',tray);
  for(const i of await api('/admin/inquiries'))if(i.message?.startsWith(marker))await api('/admin/inquiries/'+i.id,'DELETE');
  await api('/auth/logout','POST');
 }
});
