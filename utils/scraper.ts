import puppeteer from "puppeteer";

export async function scrapeTwitterFollowers(
  username: string
): Promise<number> {
  let browser;
  try {
    const executablePath = process.env.VERCEL
      ? "/vercel/.cache/puppeteer/chrome/linux-131.0.6778.87/chrome-linux64/chrome"
      : undefined;

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.goto(`https://twitter.com/${username}`);
    // Add your scraping logic here
    return 0; // Replace with actual follower count
  } catch (error) {
    console.error("Error in scrapeTwitterFollowers:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
