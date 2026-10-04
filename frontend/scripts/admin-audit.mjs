import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync} from 'node:fs';
const env=Object.fromEntries(readFileSync('../.env','utf8').split(/\r?\n/).filter(Boolean).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));
const browser=await chromium.launch({channel:'chrome'});const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();const failures=[];
page.on('pageerror',e=>failures.push({error:e.message}));
await page.goto('http://127.0.0.1:5175/admin');await page.getByLabel('Email',{exact:true}).fill(env.OWNER_EMAIL);await page.getByLabel('Password',{exact:true}).fill(env.OWNER_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:900});
 for(const section of ['Overview','Menu items','Categories','Catering','Price history','Inbox','Media library','Testimonials','Site settings']){
  await page.getByRole('button',{name:section,exact:true}).click();await page.getByRole('heading',{name:section,exact:true}).waitFor();await page.getByText('Loading…',{exact:true}).waitFor({state:'detached'});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))failures.push({width,section,overflow:await page.evaluate(()=>Array.from(document.querySelectorAll("body *")).filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})))});
  if(width===1440){const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();if(scan.violations.length)failures.push({section,violations:scan.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>({target:n.target,summary:n.failureSummary}))}))})}
 }
 await page.getByRole('button',{name:'Edit site settings',exact:true}).click();await page.getByRole('dialog').waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))failures.push({width,settingsEditorOverflow:true});
 await page.screenshot({path:`../.local/admin-settings-${width}.png`});await page.getByRole('button',{name:'Close',exact:true}).click();
}
await page.evaluate(()=>localStorage.setItem('theme','dark'));await page.reload();
for(const section of ['Overview','Menu items','Categories','Catering','Price history','Inbox','Media library','Testimonials','Site settings']){
 await page.getByRole('button',{name:section,exact:true}).click();await page.getByRole('heading',{name:section,exact:true}).waitFor();await page.getByText('Loading?',{exact:true}).waitFor({state:'detached'});
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();if(scan.violations.length)failures.push({theme:'dark',section,violations:scan.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>({target:n.target,summary:n.failureSummary}))}))});
}
await page.getByRole('button',{name:'Sign out'}).click();await browser.close();writeFileSync('../.local/admin-audit.json',JSON.stringify({failures,checks:58},null,2));console.log(JSON.stringify({failures,checks:58},null,2));if(failures.length)process.exitCode=1;
