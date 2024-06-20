// @ts-check
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

const PROXY_USERNAME = "scrapeops.headless_browser_mode=true";
const PROXY_PASSWORD = "a778b547-9eda-4034-8d52-8ccfdb67014d"; // <-- enter your API_Key here
const PROXY_SERVER = "proxy.scrapeops.io";
const PROXY_SERVER_PORT = "5353";

const randomTime = () => {
  return Math.floor(Math.random() * 2000) + 1000;
};

const moveMouse = async (page) => {
  await page.mouse.move(
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 100)
  );
};

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
  "Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36 Edg/87.0.664.75",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18363",
  "Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
];

const randomIndex = Math.floor(Math.random() * userAgents.length);

(async () => {
  chromium.use(stealth);
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: `http://${PROXY_SERVER}:${PROXY_SERVER_PORT}`,
      username: PROXY_USERNAME,
      password: PROXY_PASSWORD,
    },
  });

  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  const page = await context.newPage();

  const totalPagesNumber = 1;
  const url = `https://allegro.pl/kategoria/sluchawki-66887`;

  for (let pageNumber = 1; pageNumber <= totalPagesNumber; pageNumber++) {
    try {
      await page.setDefaultTimeout(30000); // Increased timeout value
      await page.goto(`${url}?p=${pageNumber}`, { timeout: 180000 });
      await page.waitForTimeout(4000);
      await page.waitForLoadState("load");
      await page.waitForSelector("article[data-verification-id]");
      await page.waitForTimeout(randomTime());

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
            const seller = element.querySelector(
              ".mp0t_0a.mgmw_wo.mqu1_21.mj9z_5r.mli8_k4.mqen_m6.l1fas.mgn2_12"
            )?.textContent;
            return {
              title: title,
              price: price,
              url: url,
              seller: seller,
              isPromoted: isPromoted,
              isSponsored: isSponsored,
            };
          });
        }
      );

      console.log(items);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  await browser.close();
})();
