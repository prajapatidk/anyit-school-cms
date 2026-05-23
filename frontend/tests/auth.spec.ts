import { expect, test } from '@playwright/test'

test('signin page loads', async ({ page }) => {
  await page.goto('/signin')
  await expect(page.getByText('Sign In')).toBeVisible()
})
