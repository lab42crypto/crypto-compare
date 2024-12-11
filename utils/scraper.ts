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
      headless: "new",
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    // Rest of your scraping code...
    const page = await browser.newPage();
    // ...
  } catch (error) {
    console.error("Error in scrapeTwitterFollowers:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
