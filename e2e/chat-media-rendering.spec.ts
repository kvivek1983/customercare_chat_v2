import { test, expect } from '@playwright/test';

/**
 * Chat Message & Media Rendering Tests
 *
 * Tests the full chat display flow — replicates the conversations.component.html
 * template logic for all media types WhatsApp can send.
 *
 * Currently Implemented: text, image, audio, video, document
 * Missing (flagged): sticker, location, contact, interactive, reaction
 */

// Helper: builds a chat message HTML structure matching conversations.component.html
function buildMessageHTML(messages: Array<{
  type: 'Customer' | 'Agent';
  text?: string;
  media_type?: string;
  mediaUrl?: string;
  filename?: string;
  datetime: string;
}>) {
  return messages.map((msg) => {
    const isAgent = msg.type === 'Agent';
    const bubbleClass = isAgent ? 'agent-message' : 'user-message';

    let textBubble = '';
    if (msg.text) {
      textBubble = `
        <div class="message-bubble">
          <span class="message-text">${msg.text}</span>
          <span class="message-time">${msg.datetime}${isAgent ? ' <span class="read-receipt">&#10003;&#10003;</span>' : ''}</span>
        </div>`;
    }

    let mediaContainer = '';
    if (msg.mediaUrl && msg.media_type) {
      let mediaContent = '';

      if (msg.media_type === 'audio') {
        mediaContent = `<audio data-testid="media-audio" controls><source src="${msg.mediaUrl}" type="audio/mpeg"></audio>`;
      } else if (msg.media_type === 'image') {
        mediaContent = `<img data-testid="media-image" src="${msg.mediaUrl}" alt="Image">`;
      } else if (msg.media_type === 'video') {
        mediaContent = `<video data-testid="media-video" controls><source src="${msg.mediaUrl}" type="video/mp4"></video>`;
      } else if (msg.media_type === 'document') {
        mediaContent = `<a data-testid="media-document" href="${msg.mediaUrl}" target="_blank" class="document-link">${msg.filename || 'Download Document'}</a>`;
      } else if (msg.media_type === 'sticker') {
        mediaContent = `<img data-testid="media-sticker" src="${msg.mediaUrl}" alt="Sticker" class="sticker-image">`;
      } else if (msg.media_type === 'location') {
        mediaContent = `<div data-testid="media-location" class="location-container">📍 Location shared</div>`;
      } else if (msg.media_type === 'contacts') {
        mediaContent = `<div data-testid="media-contacts" class="contact-card">👤 Contact shared</div>`;
      }

      if (mediaContent) {
        mediaContainer = `
          <div class="media-container">
            ${mediaContent}
            <span class="message-time">${msg.datetime}${isAgent ? ' <span class="read-receipt">&#10003;&#10003;</span>' : ''}</span>
          </div>`;
      }
    }

    return `<div class="${bubbleClass}">${textBubble}${mediaContainer}</div>`;
  }).join('\n');
}

function pageHTML(bodyContent: string) {
  return `
    <html>
    <head>
      <style>
        .messages { display: flex; flex-direction: column; gap: 8px; padding: 16px; font-family: sans-serif; }
        .user-message { align-self: flex-start; max-width: 70%; }
        .agent-message { align-self: flex-end; max-width: 70%; }
        .message-bubble { background: #e8e8e8; border-radius: 8px; padding: 8px 12px; }
        .agent-message .message-bubble { background: #6c63ff; color: #fff; }
        .message-text { display: block; }
        .message-time { font-size: 11px; color: #999; display: block; text-align: right; margin-top: 4px; }
        .media-container { border-radius: 8px; overflow: hidden; }
        .media-container img { max-width: 250px; border-radius: 8px; }
        .media-container video { max-width: 250px; border-radius: 8px; }
        .media-container audio { width: 250px; }
        .document-link { display: block; padding: 10px; background: #f0f0f0; border-radius: 8px; text-decoration: none; color: #333; }
        .date-separator { text-align: center; color: #999; font-size: 12px; margin: 12px 0; }
        .read-receipt { color: #4fc3f7; }
        .sticker-image { max-width: 150px; }
      </style>
    </head>
    <body>
      <div class="messages" data-testid="messages-container">
        ${bodyContent}
      </div>
    </body>
    </html>`;
}

// ===========================================================================
// 1. TEXT MESSAGE RENDERING
// ===========================================================================

test.describe('Chat - Text Messages', () => {

  test('should render a customer text message', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Hello, I need help with my booking', datetime: '10:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    const bubble = page.locator('.user-message .message-bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble.locator('.message-text')).toHaveText('Hello, I need help with my booking');
    await expect(bubble.locator('.message-time')).toContainText('10:30 AM');
  });

  test('should render an agent text message with read receipt', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Agent', text: 'Sure, let me check your booking', datetime: '10:31 AM'
    }]);
    await page.setContent(pageHTML(html));
    const bubble = page.locator('.agent-message .message-bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble.locator('.message-text')).toHaveText('Sure, let me check your booking');
    await expect(bubble.locator('.read-receipt')).toBeVisible();
  });

  test('should render multiple messages in order', async ({ page }) => {
    const html = buildMessageHTML([
      { type: 'Customer', text: 'Hi', datetime: '10:00 AM' },
      { type: 'Agent', text: 'Hello!', datetime: '10:01 AM' },
      { type: 'Customer', text: 'I have a question', datetime: '10:02 AM' },
    ]);
    await page.setContent(pageHTML(html));
    const msgs = page.locator('[class$="-message"]');
    await expect(msgs).toHaveCount(3);
    await expect(msgs.nth(0).locator('.message-text')).toHaveText('Hi');
    await expect(msgs.nth(1).locator('.message-text')).toHaveText('Hello!');
    await expect(msgs.nth(2).locator('.message-text')).toHaveText('I have a question');
  });

  test('should render empty message without bubble (media-only)', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'image', mediaUrl: 'data:image/png;base64,iVBORw0KGgo=', datetime: '10:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-bubble')).toHaveCount(0);
    await expect(page.locator('.media-container')).toBeVisible();
  });

  test('should render text with special characters and emojis', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Price is ₹500 & 10% off! 🎉', datetime: '10:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Price is ₹500 & 10% off! 🎉');
  });

  test('should render long text message without overflow', async ({ page }) => {
    const longText = 'A'.repeat(500);
    const html = buildMessageHTML([{
      type: 'Customer', text: longText, datetime: '10:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    const bubble = page.locator('.message-bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble.locator('.message-text')).toHaveText(longText);
  });
});

// ===========================================================================
// 2. IMAGE MESSAGE RENDERING
// ===========================================================================

test.describe('Chat - Image Messages', () => {

  // Tiny valid 1x1 PNG base64
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  test('should render image from customer', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'image', mediaUrl: tinyPng, datetime: '11:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    const img = page.locator('[data-testid="media-image"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', tinyPng);
    await expect(img).toHaveAttribute('alt', 'Image');
  });

  test('should render image with caption (text + image)', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Check this photo', media_type: 'image', mediaUrl: tinyPng, datetime: '11:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Check this photo');
    await expect(page.locator('[data-testid="media-image"]')).toBeVisible();
  });

  test('should render image sent by agent with read receipt', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Agent', media_type: 'image', mediaUrl: tinyPng, datetime: '11:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.agent-message [data-testid="media-image"]')).toBeVisible();
    await expect(page.locator('.agent-message .read-receipt')).toBeVisible();
  });
});

// ===========================================================================
// 3. AUDIO MESSAGE RENDERING
// ===========================================================================

test.describe('Chat - Audio Messages', () => {

  // Tiny valid audio data URI
  const audioSrc = 'data:audio/mpeg;base64,//uQx';

  test('should render audio player for voice message', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'audio', mediaUrl: audioSrc, datetime: '11:15 AM'
    }]);
    await page.setContent(pageHTML(html));
    const audio = page.locator('[data-testid="media-audio"]');
    await expect(audio).toBeVisible();
    await expect(audio).toHaveAttribute('controls', '');
    const source = audio.locator('source');
    await expect(source).toHaveAttribute('src', audioSrc);
    await expect(source).toHaveAttribute('type', 'audio/mpeg');
  });

  test('should render audio with caption text', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Voice note', media_type: 'audio', mediaUrl: audioSrc, datetime: '11:15 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Voice note');
    await expect(page.locator('[data-testid="media-audio"]')).toBeVisible();
  });
});

// ===========================================================================
// 4. VIDEO MESSAGE RENDERING
// ===========================================================================

test.describe('Chat - Video Messages', () => {

  const videoSrc = 'data:video/mp4;base64,AAAAIGZ0eXA=';

  test('should render video player with controls', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'video', mediaUrl: videoSrc, datetime: '11:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    const video = page.locator('[data-testid="media-video"]');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
    const source = video.locator('source');
    await expect(source).toHaveAttribute('src', videoSrc);
    await expect(source).toHaveAttribute('type', 'video/mp4');
  });

  test('should render video with caption', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Watch this video', media_type: 'video', mediaUrl: videoSrc, datetime: '11:30 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Watch this video');
    await expect(page.locator('[data-testid="media-video"]')).toBeVisible();
  });
});

// ===========================================================================
// 5. DOCUMENT MESSAGE RENDERING
// ===========================================================================

test.describe('Chat - Document Messages', () => {

  const docUrl = 'data:application/pdf;base64,JVBERi0x';

  test('should render document download link with filename', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'document', mediaUrl: docUrl, filename: 'invoice.pdf', datetime: '11:45 AM'
    }]);
    await page.setContent(pageHTML(html));
    const link = page.locator('[data-testid="media-document"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText('invoice.pdf');
    await expect(link).toHaveAttribute('href', docUrl);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveClass(/document-link/);
  });

  test('should show fallback text when filename missing', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'document', mediaUrl: docUrl, datetime: '11:45 AM'
    }]);
    await page.setContent(pageHTML(html));
    const link = page.locator('[data-testid="media-document"]');
    await expect(link).toHaveText('Download Document');
  });

  test('should render document with caption text', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Please see attached invoice', media_type: 'document', mediaUrl: docUrl, filename: 'invoice.pdf', datetime: '11:45 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Please see attached invoice');
    await expect(page.locator('[data-testid="media-document"]')).toBeVisible();
  });
});

// ===========================================================================
// 6. DATE SEPARATOR RENDERING
// ===========================================================================

test.describe('Chat - Date Separators', () => {

  test('should render date separator between messages', async ({ page }) => {
    const content = `
      <div class="date-separator" data-testid="date-sep"><span>12 Mar 2026</span></div>
      ${buildMessageHTML([{ type: 'Customer', text: 'Hello', datetime: '10:00 AM' }])}
      <div class="date-separator" data-testid="date-sep"><span>13 Mar 2026</span></div>
      ${buildMessageHTML([{ type: 'Customer', text: 'Hi again', datetime: '09:00 AM' }])}
    `;
    await page.setContent(pageHTML(content));
    const separators = page.locator('.date-separator');
    await expect(separators).toHaveCount(2);
    await expect(separators.nth(0)).toContainText('12 Mar 2026');
    await expect(separators.nth(1)).toContainText('13 Mar 2026');
  });
});

// ===========================================================================
// 7. MIXED MEDIA CONVERSATION FLOW
// ===========================================================================

test.describe('Chat - Full Conversation Flow (mixed media)', () => {

  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const audioSrc = 'data:audio/mpeg;base64,//uQx';
  const videoSrc = 'data:video/mp4;base64,AAAAIGZ0eXA=';
  const docUrl = 'data:application/pdf;base64,JVBERi0x';

  test('should render a realistic conversation with all media types', async ({ page }) => {
    const html = buildMessageHTML([
      { type: 'Customer', text: 'Hi, I have an issue with my ride', datetime: '10:00 AM' },
      { type: 'Agent', text: 'Hello! Please share the details', datetime: '10:01 AM' },
      { type: 'Customer', text: 'Here is a screenshot', media_type: 'image', mediaUrl: tinyPng, datetime: '10:02 AM' },
      { type: 'Customer', media_type: 'audio', mediaUrl: audioSrc, datetime: '10:03 AM' },
      { type: 'Customer', text: 'Video of the issue', media_type: 'video', mediaUrl: videoSrc, datetime: '10:04 AM' },
      { type: 'Customer', media_type: 'document', mediaUrl: docUrl, filename: 'receipt.pdf', datetime: '10:05 AM' },
      { type: 'Agent', text: 'Thanks, I will look into this', datetime: '10:06 AM' },
    ]);
    await page.setContent(pageHTML(html));

    // All 7 messages rendered
    const allMessages = page.locator('[class$="-message"]');
    await expect(allMessages).toHaveCount(7);

    // Verify each media type present
    await expect(page.locator('[data-testid="media-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-audio"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-video"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-document"]')).toBeVisible();

    // Verify customer vs agent alignment
    await expect(page.locator('.user-message')).toHaveCount(5);
    await expect(page.locator('.agent-message')).toHaveCount(2);

    // Agent messages have read receipts
    const agentReceipts = page.locator('.agent-message .read-receipt');
    await expect(agentReceipts).toHaveCount(2);
  });
});

// ===========================================================================
// 8. MISSING MEDIA TYPES (WhatsApp sends these but template doesn't handle)
// ===========================================================================

test.describe('Chat - Missing WhatsApp Media Types (GAP ANALYSIS)', () => {

  /**
   * These tests document media types that WhatsApp CAN send but are NOT
   * currently handled in conversations.component.html.
   * They test that the helper function CAN render them (future implementation),
   * and flag that the actual Angular template is missing these.
   */

  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  test('STICKER - not handled in template (should render as image)', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'sticker', mediaUrl: tinyPng, datetime: '12:00 PM'
    }]);
    await page.setContent(pageHTML(html));
    // Sticker SHOULD render as an image with sticker-image class
    const sticker = page.locator('[data-testid="media-sticker"]');
    await expect(sticker).toBeVisible();
    await expect(sticker).toHaveClass(/sticker-image/);
    // NOTE: conversations.component.html does NOT have sticker handling — this is a GAP
  });

  test('LOCATION - not handled in template', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'location', mediaUrl: 'https://maps.example.com', datetime: '12:05 PM'
    }]);
    await page.setContent(pageHTML(html));
    const location = page.locator('[data-testid="media-location"]');
    await expect(location).toBeVisible();
    await expect(location).toContainText('Location shared');
    // NOTE: conversations.component.html does NOT have location handling — this is a GAP
  });

  test('CONTACTS - not handled in template', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'contacts', mediaUrl: 'data:text/vcard;base64,', datetime: '12:10 PM'
    }]);
    await page.setContent(pageHTML(html));
    const contact = page.locator('[data-testid="media-contacts"]');
    await expect(contact).toBeVisible();
    await expect(contact).toContainText('Contact shared');
    // NOTE: conversations.component.html does NOT have contact handling — this is a GAP
  });

  test('UNKNOWN media_type - should not crash, no media rendered', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', media_type: 'unknown_future_type', mediaUrl: 'data:x/y;base64,', datetime: '12:15 PM'
    }]);
    await page.setContent(pageHTML(html));
    // No media content rendered for unknown type
    await expect(page.locator('.media-container')).toHaveCount(0);
    // Message div still exists (no crash)
    await expect(page.locator('.user-message')).toHaveCount(1);
  });
});

// ===========================================================================
// 9. EDGE CASES
// ===========================================================================

test.describe('Chat - Edge Cases', () => {

  test('should render message with mediaUrl but no media_type (no media shown)', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Some text', mediaUrl: 'data:x/y;base64,', datetime: '10:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Some text');
    await expect(page.locator('.media-container')).toHaveCount(0);
  });

  test('should render message with media_type but no mediaUrl (no media shown)', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Loading...', media_type: 'image', datetime: '10:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.message-text')).toHaveText('Loading...');
    await expect(page.locator('.media-container')).toHaveCount(0);
  });

  test('should handle message with no text and no media gracefully', async ({ page }) => {
    // In the real template, this wouldn't render (ngIf checks message || media_type)
    const html = `<div class="user-message"></div>`;
    await page.setContent(pageHTML(html));
    await expect(page.locator('.user-message')).toHaveCount(1);
    await expect(page.locator('.message-bubble')).toHaveCount(0);
    await expect(page.locator('.media-container')).toHaveCount(0);
  });

  test('customer message should NOT have read receipt', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Customer', text: 'Hello', datetime: '10:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.read-receipt')).toHaveCount(0);
  });

  test('agent message SHOULD have read receipt', async ({ page }) => {
    const html = buildMessageHTML([{
      type: 'Agent', text: 'Hi there', datetime: '10:00 AM'
    }]);
    await page.setContent(pageHTML(html));
    await expect(page.locator('.read-receipt')).toHaveCount(1);
  });
});
