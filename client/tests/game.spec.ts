import { test, expect, Page } from '@playwright/test';

// Helper function to delay 2 seconds per step for video visibility
async function delayStep(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

// Helper function to load the app (welcome screen removed)
async function startApp(page: Page) {
  await page.goto('/');
  await delayStep(page);
}

// Helper function to register and login a user
async function registerAndLogin(page: Page, username: string, password: string) {
  await startApp(page);

  // Switch to register
  const switchBtn = page.locator('text=NEED AN ACCOUNT? SIGN UP');
  await switchBtn.waitFor({ state: 'visible' });
  await switchBtn.click();
  await delayStep(page);

  // Mismatched password test
  await page.locator('.input-group:has-text("USERNAME") input').fill(username);
  await delayStep(page);
  await page.locator('.input-group:has-text("PASSWORD") input').first().fill(password);
  await delayStep(page);
  await page.locator('.input-group:has-text("CONFIRM PASSWORD") input').fill(password + 'wrong');
  await delayStep(page);
  await page.locator('button.submit-btn').click();
  await delayStep(page);

  // Assert error message
  const errorMsg = page.locator('.error-msg');
  await expect(errorMsg).toHaveText('Passwords do not match!');

  // Match password and register successfully
  await page.locator('.input-group:has-text("CONFIRM PASSWORD") input').fill(password);
  await delayStep(page);
  await page.locator('button.submit-btn').click();
  await delayStep(page);

  // Assert success message
  const successMsg = page.locator('.success-msg');
  await expect(successMsg).toHaveText('Registration successful! Please login.');

  // Wait for automatic redirect to login form (2 seconds)
  await page.waitForTimeout(2200);

  // Assert we are back in LOGIN form
  await expect(page.locator('h2')).toHaveText('LOGIN');

  // Test incorrect login
  await page.locator('.input-group:has-text("USERNAME") input').fill(username);
  await delayStep(page);
  await page.locator('.input-group:has-text("PASSWORD") input').fill(password + 'wrong');
  await delayStep(page);
  await page.locator('button.submit-btn').click();
  await delayStep(page);
  await expect(page.locator('.error-msg')).toHaveText('Invalid credentials');

  // Test correct login
  await page.locator('.input-group:has-text("PASSWORD") input').fill(password);
  await delayStep(page);
  await page.locator('button.submit-btn').click();
  await delayStep(page);

  // Verify inside Lobby
  await expect(page.locator('.lobby-container')).toBeVisible();
  await expect(page.locator('.header-username')).toHaveText(username, { ignoreCase: true });
  
  // Wait for socket connection to initialize
  await expect(page.locator('.app-container.socket-connected')).toBeVisible();
  await delayStep(page);
}

// Helper to make a board move
async function makeMove(page: Page, row: number, col: number) {
  const cell = page.locator(`.board-row:nth-child(${row + 1}) .board-cell:nth-child(${col + 1})`);
  await cell.waitFor({ state: 'visible' });
  await cell.click();
  await delayStep(page);
}

test.describe('Caro Pixel E2E Tests', () => {
  test.describe.configure({ timeout: 180000 });

  test('E2E Auth & Customization Flow', async ({ page }) => {
    const randomUser = `user_${Math.random().toString(36).substring(2, 7)}`;
    await registerAndLogin(page, randomUser, 'password123');

    // 1. Open Profile Modal
    const profileHeaderBtn = page.locator('.header-avatar-btn');
    await expect(profileHeaderBtn).toBeVisible();
    await profileHeaderBtn.click();
    await delayStep(page);

    // 2. Select a different avatar (e.g. Avatar 3)
    const avatar3 = page.locator('.avatar-grid .avatar-item').nth(2); // index 2 is avatar 3
    await expect(avatar3).toBeVisible();
    await avatar3.click();
    await delayStep(page);

    // 3. Select a different theme (e.g. Gameboy or Dark)
    const themeBtn = page.locator('.theme-options button:has-text("GAMEBOY")');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await delayStep(page);

    // 4. Save changes and handle the alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Profile updated!');
      await dialog.accept();
    });
    
    const saveBtn = page.locator('button.save-btn');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await delayStep(page);

    // 5. Verify the theme CSS class is applied on the app-container
    await expect(page.locator('.app-container')).toHaveClass(/gameboy/);

    // 6. Close the profile modal
    const closeBtn = page.locator('.profile-header .close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await delayStep(page);
  });

  test('E2E Multiplayer, Gameplay, Chat, Emotes, Win/Elo & Replay Flow', async ({ browser }) => {
    // Create two separate browser contexts for multiplayer
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const userA = `play_a_${Math.random().toString(36).substring(2, 7)}`;
    const userB = `play_b_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Auth both users
    await registerAndLogin(pageA, userA, 'password123');
    await registerAndLogin(pageB, userB, 'password123');

    // 2. User A creates a room
    await pageA.locator('button.create-btn').click();
    
    // Wait for the room to be created and get the room ID
    const roomInfo = pageA.locator('.room-info p');
    await expect(roomInfo).toContainText('ROOM ID:');
    const roomText = await roomInfo.textContent();
    const roomId = roomText?.replace('ROOM ID:', '').trim() || '';
    expect(roomId.length).toBeGreaterThan(0);
    await delayStep(pageA);

    // 3. User B joins the room
    await pageB.locator('.join-code-form input').fill(roomId);
    await delayStep(pageB);
    await pageB.locator('.join-code-form button[type="submit"]').click();
    await delayStep(pageB);

    // Verify both are in the game board and status is playing
    await expect(pageA.locator('.board')).toBeVisible();
    await expect(pageB.locator('.board')).toBeVisible();
    await expect(pageA.locator('.game-status')).toContainText('YOUR TURN!');
    await expect(pageB.locator('.game-status')).toContainText("OPPONENT'S TURN...");

    // 4. Send chat from A and verify on B
    await pageA.locator('.chat-input input').fill('Hello from A!');
    await pageA.locator('.chat-input button[type="submit"]').click();
    await expect(pageB.locator('.chat-messages')).toContainText('Hello from A!');
    await pageA.waitForTimeout(500);

    // 5. Send emote from A and verify on B
    const emoteBtn = pageA.locator('.emote-panel button:has-text("😎")').first();
    await expect(emoteBtn).toBeVisible();
    await emoteBtn.click();
    await expect(pageB.locator('.emote-bubble').first()).toContainText('😎');
    await pageA.waitForTimeout(500);

    // 6. Play a match where Player A wins
    // We will place pieces in 5 consecutive cells: (0,0), (0,1), (0,2), (0,3), (0,4) for X
    // O will place at (1,0), (1,1), (1,2), (1,3)
    
    // Turn 1: X plays (0,0)
    await makeMove(pageA, 0, 0);
    // Turn 2: O plays (1,0)
    await makeMove(pageB, 1, 0);

    // Turn 3: X plays (0,1)
    await makeMove(pageA, 0, 1);
    // Turn 4: O plays (1,1)
    await makeMove(pageB, 1, 1);

    // Turn 5: X plays (0,2)
    await makeMove(pageA, 0, 2);
    // Turn 6: O plays (1,2)
    await makeMove(pageB, 1, 2);

    // Turn 7: X plays (0,3)
    await makeMove(pageA, 0, 3);
    // Turn 8: O plays (1,3)
    await makeMove(pageB, 1, 3);

    // Turn 9: X plays (0,4) -> X wins!
    await makeMove(pageA, 0, 4);

    // Verify game finished status on A and B
    await expect(pageA.locator('.win-msg')).toContainText('YOU WIN!');
    await expect(pageB.locator('.win-msg')).toContainText('YOU LOSE!');

    // Verify winning cells highlighted (at least one cell check)
    const winCell = pageA.locator('.board-cell.winner-cell').first();
    await expect(winCell).toBeVisible();

    // Leave room to verify ELO update in the lobby
    await pageA.locator('button.leave-btn').click();
    await delayStep(pageA);
    await expect(pageA.locator('.lobby-container')).toBeVisible();

    await pageB.locator('button.leave-btn').click();
    await delayStep(pageB);
    await expect(pageB.locator('.lobby-container')).toBeVisible();

    // ELO should update (A increases, B decreases)
    // Starting ELO is 1000
    const eloA = pageA.locator('.header-elo');
    const eloB = pageB.locator('.header-elo');
    await expect(eloA).not.toHaveText('1000');
    await expect(eloB).not.toHaveText('1000');

    const scoreA = parseInt(await eloA.innerText() || '1000');
    const scoreB = parseInt(await eloB.innerText() || '1000');
    
    expect(scoreA).toBeGreaterThan(1000);
    expect(scoreB).toBeLessThan(1000);

    // 7. Verify Replay Flow
    // Open Profile
    await pageA.locator('.header-avatar-btn').click();
    await delayStep(pageA);

    // Locate the replay button of the first history item
    const replayBtn = pageA.locator('.history-list .history-item .replay-btn').first();
    await expect(replayBtn).toBeVisible();
    await replayBtn.click();
    await delayStep(pageA);

    // We should be in Replay Mode now
    const replayContainer = pageA.locator('.replay-container');
    await expect(replayContainer).toBeVisible();

    const nextBtn = pageA.locator('.replay-controls button:has-text("NEXT")');
    const backBtn = pageA.locator('.replay-controls button:has-text("BACK")');

    // Click NEXT a few times to see moves replayed
    await nextBtn.click();
    await delayStep(pageA);
    await nextBtn.click();
    await delayStep(pageA);
    await nextBtn.click();
    await delayStep(pageA);

    // Click BACK
    await backBtn.click();
    await delayStep(pageA);

    // Close Replay Mode
    const closeReplayBtn = pageA.locator('.replay-header .close-btn');
    await expect(closeReplayBtn).toBeVisible();
    await closeReplayBtn.click();
    await delayStep(pageA);

    await contextA.close();
    await contextB.close();
  });

  test('E2E Timeout Flow', async ({ browser }) => {
    // Test with TURN_TIMEOUT = 5 (configured in playwright.config.ts)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const userA = `timeout_a_${Math.random().toString(36).substring(2, 7)}`;
    const userB = `timeout_b_${Math.random().toString(36).substring(2, 7)}`;

    await registerAndLogin(pageA, userA, 'password123');
    await registerAndLogin(pageB, userB, 'password123');

    // Create room
    await pageA.locator('button.create-btn').click();
    await delayStep(pageA);
    
    const roomInfo = pageA.locator('.room-info p');
    await expect(roomInfo).toContainText('ROOM ID:');
    const roomText = await roomInfo.textContent();
    const roomId = roomText?.replace('ROOM ID:', '').trim() || '';

    // Join room
    await pageB.locator('.join-code-form input').fill(roomId);
    await delayStep(pageB);
    await pageB.locator('.join-code-form button[type="submit"]').click();
    await delayStep(pageB);

    // Game starts, it is Player A's turn (X)
    await expect(pageA.locator('.game-status')).toContainText('YOUR TURN!');
    
    // Player A does not play. Wait for timeout (TURN_TIMEOUT is 5s, let's wait 6.5s)
    await pageA.waitForTimeout(6500);

    // Assert Player A lost by timeout and Player B won
    await expect(pageA.locator('.win-msg')).toContainText('YOU LOSE! (TIMEOUT)');
    await expect(pageB.locator('.win-msg')).toContainText('YOU WIN!');
    await delayStep(pageA);

    await contextA.close();
    await contextB.close();
  });

});
