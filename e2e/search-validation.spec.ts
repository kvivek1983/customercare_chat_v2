import { test, expect } from '@playwright/test';

/**
 * Test the search input 10-digit mobile number validation logic.
 * Replicates the same onSearchKeydown() + onSearchInput() behavior
 * from ChatNumberListComponent.
 */
test.describe('Search Chat - Mobile Number Validation (max 10 digits)', () => {

  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <html>
      <body>
        <input id="searchInput" type="text" placeholder="Search mobile or name..." />
        <script>
          const input = document.getElementById('searchInput');

          // Same logic as ChatNumberListComponent.onSearchKeydown()
          input.addEventListener('keydown', function(event) {
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
            if (allowedKeys.includes(event.key)) return;
            if (event.ctrlKey || event.metaKey) return;
            if (/^\\d{10}$/.test(input.value) && /^\\d$/.test(event.key)) {
              event.preventDefault();
            }
          });

          // Same logic as ChatNumberListComponent.onSearchInput()
          input.addEventListener('input', function() {
            if (/^\\d+$/.test(input.value) && input.value.length > 10) {
              input.value = input.value.slice(0, 10);
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  test('should allow typing up to 10 digits', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.click();
    await input.pressSequentially('1234567890');
    await expect(input).toHaveValue('1234567890');
  });

  test('should block 11th digit - key does not print', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.click();
    await input.pressSequentially('1234567890');
    // Now try typing more digits - they should be blocked by keydown preventDefault
    await input.pressSequentially('12345');
    await expect(input).toHaveValue('1234567890');
  });

  test('should truncate pasted value beyond 10 digits', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.fill('12345678901234');
    await input.dispatchEvent('input');
    await expect(input).toHaveValue('1234567890');
  });

  test('should allow name search without any digit limit', async ({ page }) => {
    const input = page.locator('#searchInput');
    const longName = 'Gaurav Kumar Sharma Very Long Name';
    await input.click();
    await input.pressSequentially(longName);
    await expect(input).toHaveValue(longName);
  });

  test('should allow mixed alphanumeric input without limit', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.fill('Gaurav12345678901234');
    await input.dispatchEvent('input');
    await expect(input).toHaveValue('Gaurav12345678901234');
  });

  test('should allow exactly 10 digits without issue', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.click();
    await input.pressSequentially('9876543210');
    await expect(input).toHaveValue('9876543210');
  });

  test('should allow backspace after 10 digits and then type again', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.click();
    await input.pressSequentially('1234567890');
    // Delete last digit
    await input.press('Backspace');
    await expect(input).toHaveValue('123456789');
    // Now type a new digit - should be allowed
    await input.pressSequentially('5');
    await expect(input).toHaveValue('1234567895');
  });

  test('should handle empty input', async ({ page }) => {
    const input = page.locator('#searchInput');
    await input.fill('');
    await input.dispatchEvent('input');
    await expect(input).toHaveValue('');
  });
});
