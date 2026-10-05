import { test, expect } from '@playwright/test';

test('catering form and API reject invalid event details', async ({ page, request }) => {
  test.skip(!process.env.QA_ISOLATED_BASE_URL, 'Inquiry API checks require the disposable QA environment');
  await page.goto('/catering');
  const form = page.locator('.inquiry-form');
  await form.getByLabel('Name', { exact: true }).fill('QA Guest');
  await form.getByLabel('Email', { exact: true }).fill('qa@example.com');
  await form.getByLabel('Phone', { exact: true }).fill('555');
  await form.getByLabel('Your message').fill('Please plan this event.');
  await form.getByLabel('Date', { exact: true }).fill('2099-01-01');
  await form.getByLabel('Number of guests').fill('25');
  await form.getByRole('button', { name: 'Send catering inquiry' }).click();
  await expect(form.getByText('Enter a valid phone number')).toBeVisible();
  const base = { kind: 'catering', name: 'QA Guest', email: 'qa@example.com', phone: '9725550123', message: 'Please plan this event.', date: '2099-01-01', guests: 25 };
  for (const invalid of [{ date: '2020-01-01' }, { guests: 0 }, { phone: '555' }]) {
    const response = await request.post('/api/v1/inquiries', { data: { ...base, ...invalid } });
    expect(response.status()).toBe(422);
  }
});
