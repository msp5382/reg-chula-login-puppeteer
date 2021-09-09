const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const login = require("../index");
async function run() {
  puppeteer.use(pluginStealth());

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--window-size=360,500",
      "--window-position=000,000",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      " --disable-site-isolation-trials",
    ],
  });

  const page = await browser.newPage();
  login(page);
}

run();
