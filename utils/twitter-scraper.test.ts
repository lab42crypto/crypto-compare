import { scrapeTwitterFollowers } from "./twitter-scraper";

async function testTwitterScraper() {
  console.log("Starting Twitter scraper test...");

  try {
    const username = "lab42crypto";
    const url = `https://twitter.com/${username}`;

    console.log(`Testing scraper for URL: ${url}`);

    // Test the scraper
    const followers = await scrapeTwitterFollowers(url);

    // Log results
    console.log("Test Results:");
    console.log("--------------");
    console.log(`Username: ${username}`);
    console.log(`Followers: ${followers.toLocaleString()}`);
    console.log(`Raw followers count: ${followers}`);
    console.log("--------------");

    if (followers === 0) {
      console.error("❌ Test failed: Follower count is 0");
    } else {
      console.log("✅ Test passed: Successfully retrieved follower count");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testTwitterScraper()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
