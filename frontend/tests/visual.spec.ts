import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('reference hero, reduced motion, and dish dialog',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const hero=page.locator('.hero-food').first();await expect(hero).toBeVisible();
 await expect.poll(()=>hero.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 expect(await hero.evaluate(i=>getComputedStyle(i).animationName)).toBe('none');
 await page.goto('/menu');await page.getByRole('searchbox').fill('Butter Chicken');
 await page.locator('.menu-item').click();await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('button',{name:'Close item'})).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('dark theme accessibility and mobile navigation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
 for(const route of ['/','/menu','/catering','/about','/contact']){
  await page.goto(route);await expect(page.locator('h1')).toBeVisible();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Menu',exact:true}).click();
 await expect(page).toHaveURL(/\/menu$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('premium highlights carousel moves, pauses, and stays responsive',async({page})=>{
 await page.goto('/');
 const track=page.locator('.highlights-track');
 await expect(track).toBeVisible();
 const before=await track.evaluate(e=>getComputedStyle(e).transform);
 await page.waitForTimeout(1100);
 const after=await track.evaluate(e=>getComputedStyle(e).transform);
 expect(after).not.toBe(before);
 await page.getByRole('button',{name:'Pause highlights carousel'}).click();
 await expect(page.getByRole('button',{name:'Play highlights carousel'})).toBeVisible();
 const paused=await track.evaluate(e=>getComputedStyle(e).transform);
 await page.waitForTimeout(500);
 expect(await track.evaluate(e=>getComputedStyle(e).transform)).toBe(paused);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
