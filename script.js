const sqlite3 = require("sqlite3").verbose();
const { plugin } = require("playwright-with-fingerprints");
const { open } = require("sqlite");
const fs = require("fs").promises;
require("dotenv").config();

//Change totalPagesNumber for more pages to mine
const totalPagesNumber = 20;
//Change url for different site
const url = `https://allegro.pl/kategoria/sluchawki-66887`;

const randomTime = () => {
  return Math.floor(Math.random() * 2000) + 1000;
};

const moveMouse = async (page) => {
  await page.mouse.move(
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 100)
  );
};

const exportDataToCSV = async (db) => {
  try {
    await db;
    const rows = await db.all("SELECT * FROM allegro_products");

    if (rows.length === 0) {
      console.log("No data found in the database.");
      return;
    }

    const csvData = rows.map((row) => {
      return `${row.id};${row.url};${row.title};${row.price};${row.seller};${row.if_promoted};${row.if_sponsored}`;
    });

    const header = "id;url;title;price;seller;if_promoted;if_sponsored\n";
    const csvContent = header + csvData.join("\n");

    await fs.writeFile("./allegro_products.csv", csvContent);
    console.log("Data exported to allegro_products.csv successfully.");
  } catch (error) {
    console.error("Error exporting data to CSV:", error);
  }
};
const cleanDatabase = async (db) => {
  try {
    await db.run("DELETE FROM allegro_products");
    console.log("Database cleaned successfully.");
  } catch (error) {
    console.error("Error cleaning database:", error);
  }
};
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
  "Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36 Edg/87.0.664.75",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18363",
  "Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
  "Mozilla/5.0 (Linux; Android 12; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.93 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10; HUAWEI ELS-NX9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; LE2115) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; U; Android 11; en-us; Mi 11 Build/RKQ1.200826.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; XQ-AS52) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
  " Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
];

const randomIndex = Math.floor(Math.random() * userAgents.length);

(async () => {
  const fingerprint = await plugin.fetch("", {
    tags: ["Microsoft Windows", "Chrome"],
  });

  plugin.useFingerprint(fingerprint);

  const browser = await plugin.launch({
    headless: true,
    slowMo: 2000,
    userAgent: userAgents[randomIndex],
  });

  const page = await browser.newPage();

  const db = await open({
    filename: "./allegro_products.db",
    driver: sqlite3.Database,
  });

  console.log("Connected to SQLite database");
  await cleanDatabase(db);
  await db.exec(`
      CREATE TABLE IF NOT EXISTS allegro_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        price TEXT,
        seller TEXT,
        if_promoted BOOLEAN,
        if_sponsored BOOLEAN
      )
    `);

  await page.goto(`${url}`, { timeout: 180000 });
  await page.waitForTimeout(randomTime());
  await page.locator('button[data-role="accept-consent"]').click();
  for (let pageNumber = 1; pageNumber <= totalPagesNumber; pageNumber++) {
    try {
      await moveMouse(page);
      const pageURL = await page.url();
      console.log(`ITERATION ${pageNumber}: ${pageURL}`);
      await moveMouse(page);
      await page.setDefaultTimeout(30000);
      await page.waitForTimeout(randomTime());
      await moveMouse(page);
      await page.waitForLoadState("load");
      await page.waitForSelector("article[data-verification-id]");
      await page.waitForTimeout(randomTime());
      await moveMouse(page);
      const items = await page.$$eval(
        "article[data-verification-id]",
        (elements) => {
          return elements.map((element) => {
            const title = element.querySelector("a.mgn2_14")?.textContent;
            const url = element
              .querySelector("a.mgn2_14")
              ?.getAttribute("href");
            const priceElement = element.querySelector(
              ".mli8_k4.msa3_z4.mqu1_1.mp0t_ji.m9qz_yo.mgmw_qw.mgn2_27.mgn2_30_s"
            );

            const price = priceElement?.textContent?.trim();
            const isPromoted =
              element.getAttribute("data-analytics-view-custom-context") ===
              "PROMOTED";
            const isSponsored =
              element.querySelector(
                ".mp0t_0a.mgn2_12.mqu1_16.mli8_k4.mgmw_3z.mp4t_4.mryx_0.mqen_32"
              )?.textContent === "Promowane";

            const sellerName = element
              .querySelector("a.mp0t_0a.mgmw_wo.mqu1_21")
              ?.textContent?.trim();

            return {
              title: title,
              price: price,
              url: url,
              seller: sellerName,
              isPromoted: isPromoted,
              isSponsored: isSponsored,
            };
          });
        }
      );
      await page.waitForTimeout(randomTime());
      console.log(items);
      await moveMouse(page);
      for (const item of items) {
        await db.run(
          "INSERT INTO allegro_products (url, title, price, seller, if_promoted, if_sponsored) VALUES (?, ?, ?, ?, ?, ?)",
          [
            item.url,
            item.title,
            item.price,
            item.seller,
            item.isPromoted,
            item.isSponsored,
          ]
        );
      }
      await page.waitForTimeout(randomTime());
      await page.waitForTimeout(randomTime());
      await page.click('a[rel="next"]');
    } catch (error) {
      console.error("Error:", error);
    }
  }
  await exportDataToCSV(db);
  await browser.close();
  await db.close();
})();
