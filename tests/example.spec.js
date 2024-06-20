// @ts-check
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const totalPagesNumber = 20;
  let allOffers = [];
  const offer = {
    title: "",
    price: "",
    url: "",
    seller: "",
    isPromoted: false,
    isSponsored: false,
  };
  const offers = [];
  const url = `https://allegro.pl/kategoria/sluchawki-66887`;
  for (let pageNumber = 1; pageNumber <= totalPagesNumber; pageNumber++) {
    await page.goto(`${url}?p=${pageNumber}`);
    allOffers.push(await page.$$("[data-verification-id]"));
  }
  await browser.close();
})();
