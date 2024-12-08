import puppeteer from "puppeteer";

export async function scrapeTwitterFollowers(url: string): Promise<number> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await Promise.race([
      page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Navigation timeout")), 30000)
      ),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let followersText = null;
    for (const selector of ['a[href$="verified_followers"]']) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        const element = await page.$(selector);
        if (element) {
          const text = await element.evaluate((el) => el.textContent);
          if (text && /[\d,.KkMm]+/.test(text.trim())) {
            followersText = text;
            break;
          }
        }
      } catch (e) {
        console.log(`Selector "${selector}" failed, trying next...`);
      }
    }

    if (!followersText) {
      console.error("Failed to find followers count");
      return 0;
    }

    console.log("Found followers text:", followersText);
    const followers = parseFollowersCount(followersText);
    return followers;
  } catch (error) {
    console.error("Error scraping Twitter followers:", error);
    return 0;
  } finally {
    try {
      await browser.close();
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }
}

function parseFollowersCount(text: string): number {
  // Remove any non-numeric characters except dots and numbers
  const cleanText = text.replace(/[^0-9.]/g, "");
  if (!cleanText) return 0;

  const num = parseFloat(cleanText);
  if (isNaN(num)) return 0;

  // Handle different formats
  if (text.toLowerCase().includes("k")) {
    return Math.round(num * 1000);
  } else if (text.toLowerCase().includes("m")) {
    return Math.round(num * 1000000);
  } else {
    return Math.round(num);
  }
}
