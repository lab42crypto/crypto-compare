import puppeteer from "puppeteer";

export async function scrapeTwitterFollowers(
  url: string
): Promise<{ followers: number; suspended: boolean }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // Add mobile emulation args
      "--enable-features=NetworkService",
      "--window-size=390,844", // iPhone 12 Pro dimensions
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Set mobile viewport
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    // Set mobile user agent
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
    );

    // Convert URL to mobile version
    const mobileUrl = url.replace("twitter.com", "mobile.twitter.com");
    console.log(`🚀 Starting navigation to mobile URL: ${mobileUrl}`);

    await Promise.race([
      page.goto(mobileUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Navigation timeout")), 30000)
      ),
    ]);

    // Log all navigation events
    page.on("request", (request) => {
      const url = request.url();
      // Regular expression to exclude static file URLs
      const staticFilePattern =
        /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|json)$/i;

      if (!staticFilePattern.test(url)) {
        console.log(`🌐 Request: ${url}`);
      }
    });

    page.on("console", (msg) => {
      console.log("Browser console:", msg.text());
    });

    // Check for suspension
    const suspendedText = await page.evaluate(() => {
      const element = document.querySelector('div[data-testid="emptyState"]');
      console.log("Suspension check element:", element?.textContent);
      return element ? element.textContent : null;
    });

    if (suspendedText?.includes("Account suspended")) {
      console.log(`❌ Account suspended detected`);
      return { followers: 0, suspended: true };
    }

    console.log(`⏳ Waiting for content to load...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let followersText = null;
    for (const selector of ['a[href$="verified_followers"]']) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        const element = await page.$(selector);
        if (element) {
          const text = await element.evaluate((el) => el.textContent);
          console.log(`Found text: ${text}`);
          if (text && /[\d,.KkMm]+/.test(text.trim())) {
            followersText = text;
            console.log(`✅ Valid followers count found: ${followersText}`);
            break;
          }
        }
      } catch (e) {
        console.log(`❌ Selector "${selector}" failed:`, e.message);
      }
    }

    const followers = followersText ? parseFollowersCount(followersText) : 0;
    console.log(`📊 Final followers count: ${followers}`);
    return { followers, suspended: false };
  } catch (error) {
    console.error("🚨 Error scraping Twitter followers:", error);
    return { followers: 0, suspended: false };
  } finally {
    console.log(`🔚 Closing browser`);
    await browser.close();
  }
}

function parseFollowersCount(text: string): number {
  const cleanText = text.replace(/[^0-9.]/g, "");
  if (!cleanText) return 0;

  const num = parseFloat(cleanText);
  if (isNaN(num)) return 0;

  if (text.toLowerCase().includes("k")) {
    return Math.round(num * 1000);
  } else if (text.toLowerCase().includes("m")) {
    return Math.round(num * 1000000);
  } else {
    return Math.round(num);
  }
}
