import { test, expect } from '@playwright/test';

// Replace these with actual credentials from your local database
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'arkasoftware1@gmail.com';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'saeed0098';
const TEACHER_ROOM_USERNAME = process.env.TEACHER_ROOM_USERNAME || TEACHER_EMAIL;
const TEACHER_ROOM_PASSWORD = process.env.TEACHER_ROOM_PASSWORD || TEACHER_PASSWORD;
const STUDENT_ROOM_USERNAME = process.env.STUDENT_ROOM_USERNAME || 'YaldaNa';
const STUDENT_ROOM_PASSWORD = process.env.STUDENT_ROOM_PASSWORD || 'yalda0098';

async function loginDashboard(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel(/email|ایمیل/i).fill(TEACHER_EMAIL);
  await page.getByLabel(/password|رمز/i).fill(TEACHER_PASSWORD);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/Login') && res.request().method() === 'POST'),
    page.getByRole('button', { name: /login|ورود/i }).click(),
  ]);
}

test.describe('WebRTC Online Room E2E Tests', () => {
  test.setTimeout(120000);
  
  test('Teacher and Student can join, see video, and interact', async ({ browser }) => {
    // ---------------------------------------------------------
    // 1. Teacher Setup (Browser Context 1)
    // ---------------------------------------------------------
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    teacherPage.on('console', msg => console.log('Teacher Page Console:', msg.text()));
    teacherPage.on('pageerror', error => console.log('Teacher Page Error:', error.message));

    await loginDashboard(teacherPage);

    // Go to rooms list to find an active room
    await teacherPage.goto('/dashboard/rooms');
    if (teacherPage.url().includes('redirect=%2Fdashboard%2Frooms')) {
      await loginDashboard(teacherPage);
      await teacherPage.goto('/dashboard/rooms');
    }
    await teacherPage.waitForLoadState('networkidle');

    // Find any room entry link from rooms page.
    const firstRoomLink = teacherPage.locator('a[href^="/room/"], a[href*="/room/"]').first();
    await expect(firstRoomLink).toBeVisible({ timeout: 30000 });
    
    // Get the room URL
    const roomUrl = await firstRoomLink.getAttribute('href');
    if (!roomUrl) throw new Error('Could not find a room URL in the dashboard');
    console.log('Found room URL:', roomUrl);

    // Teacher navigates to the room
    await teacherPage.goto(roomUrl, { waitUntil: 'domcontentloaded' });

    await teacherPage.screenshot({ path: 'teacher-room.png' });
    console.log('Saved screenshot of teacher room page');

    const bodyText = await teacherPage.locator('body').innerText();
    console.log('Teacher room text:', bodyText);
    
    // Teacher must login to room again using room credentials.
    const roomUsernameInput = teacherPage.locator('input[name="username"], input[placeholder*="نام"], input[placeholder*="user"]').first();
    const roomPasswordInput = teacherPage.locator('input[type="password"]').first();
    if ((await roomUsernameInput.count()) > 0 && (await roomPasswordInput.count()) > 0) {
      await roomUsernameInput.fill(TEACHER_ROOM_USERNAME);
      await roomPasswordInput.fill(TEACHER_ROOM_PASSWORD);
      await teacherPage.getByRole('button', { name: /login|ورود/i }).first().click();
    }

    const joinRoomButton = teacherPage.locator('button:has-text("به اتاق بپیوندید"), button:has-text("Join Room"), button:has-text("ورود به اتاق"), button:has-text("پیوستن به اتاق"), button:has-text("Join")');
    await expect(joinRoomButton).toBeVisible({ timeout: 15000 });
    await joinRoomButton.click();

    await teacherPage.screenshot({ path: 'teacher-room-after-join.png' });
    console.log('Saved screenshot of teacher room page after join');

    const bodyText2 = await teacherPage.locator('body').innerText();
    console.log('Teacher room text after join:', bodyText2);

    // Wait for the actual room UI to render (e.g. the video grid or sidebar)
    await expect(teacherPage.locator('video, .lucide-mic, .lucide-video, .lucide-screen-share, .lucide-users, .lucide-message-square').first()).toBeVisible({ timeout: 15000 });

    // ---------------------------------------------------------
    // 2. Student Setup (Browser Context 2)
    // ---------------------------------------------------------
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // Student goes directly to the room link
    await studentPage.goto(roomUrl);

    // Student flow: use guest button when enabled; otherwise use room username/password.
    const guestModeButton = studentPage.locator('button:has-text("Join as Guest"), button:has-text("مهمان")').first();
    const studentUsernameInput = studentPage.locator('input[name="username"], input[placeholder*="نام"], input[placeholder*="user"]').first();
    const studentPasswordInput = studentPage.locator('input[type="password"]').first();

    if (await guestModeButton.isVisible({ timeout: 7000 }).catch(() => false)) {
      await guestModeButton.click();
      await studentPage.locator('input[name="firstName"], input[id="firstName"]').first().fill('Test');
      await studentPage.locator('input[name="lastName"], input[id="lastName"]').first().fill('Student');
      await studentPage.locator('button:has-text("Join as Guest"), button:has-text("ورود"), button:has-text("تایید")').first().click();
    } else if (
      (await studentUsernameInput.isVisible({ timeout: 5000 }).catch(() => false)) &&
      (await studentPasswordInput.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      if (!STUDENT_ROOM_USERNAME || !STUDENT_ROOM_PASSWORD) {
        throw new Error(
          'Student login requires credentials because guest login is not available. Set STUDENT_ROOM_USERNAME and STUDENT_ROOM_PASSWORD.'
        );
      }
      await studentUsernameInput.fill(STUDENT_ROOM_USERNAME);
      await studentPasswordInput.fill(STUDENT_ROOM_PASSWORD);
      await studentPage.getByRole('button', { name: /login|ورود/i }).first().click();
    } else {
      // If login form is not present, the app may have already entered the room.
      await studentPage.waitForLoadState('networkidle');
    }

    await studentPage.screenshot({ path: 'student-room-after-join.png' });
    console.log('Saved screenshot of student room page after join');
    
    // Check if there are any console errors
    studentPage.on('console', msg => console.log('Student Page Console:', msg.text()));

    const studentBodyText = await studentPage.locator('body').innerText();
    console.log('Student room text after join:', studentBodyText);

    // Wait for student to enter the room
    await expect(studentPage.locator('video, .lucide-mic, .lucide-video, .lucide-screen-share, .lucide-users, .lucide-message-square').first()).toBeVisible({ timeout: 15000 });

    // ---------------------------------------------------------
    // 3. Verify WebRTC Interactions
    // ---------------------------------------------------------
    
    // Check that Teacher sees the Student in the participant list
    await expect(teacherPage.locator(`text=Test Student`)).toBeVisible();

    // Check that Student sees the Teacher in the participant list
    // (Assuming the teacher's name is rendered in the DOM)
    // await expect(studentPage.locator(`text=Teacher Name`)).toBeVisible();

    // Test Chat Messaging
    await studentPage.fill('input[placeholder*="پیام"], input[placeholder*="message"]', 'Hello from student!');
    await studentPage.click('button[type="submit"], button:has(.lucide-send)');

    // Verify Teacher receives the message
    await expect(teacherPage.locator('text=Hello from student!')).toBeVisible();

    // Test Video Streams
    // Since we launched with --use-fake-device-for-media-stream,
    // the video elements should be receiving a fake stream (a spinning green circle with a beep).
    const teacherVideoElements = await teacherPage.locator('video').count();
    expect(teacherVideoElements).toBeGreaterThan(0);

    const studentVideoElements = await studentPage.locator('video').count();
    expect(studentVideoElements).toBeGreaterThan(0);

    // ---------------------------------------------------------
    // 4. Test Moderator Actions (Teacher mutes Student)
    // ---------------------------------------------------------
    // Teacher clicks on the student's menu and mutes them
    // (You will need to adjust these selectors to match your exact UI)
    // await teacherPage.click('button[aria-label="Participant options for Test Student"]');
    // await teacherPage.click('text=Mute');
    
    // Verify Student's mic is muted in their own UI
    // await expect(studentPage.locator('button[aria-label="Unmute"]')).toBeVisible();

  });
});
