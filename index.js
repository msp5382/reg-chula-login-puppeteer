const axios = require("axios").default;
require("dotenv").config();

const visionAPIKey = process.env.VISION_API_KEY;
const id = process.env.ID;
const pass = process.env.PASS;

function dumpFrameTree(frame, indent) {
  for (const child of frame.childFrames()) {
    dumpFrameTree(child, indent + "  ");
  }
}
async function clearBeforeUnload(page) {
  const menuFrame = page.frames().find((frame) => frame.name() === "menu");
  await menuFrame.$eval("body", (el) => el.removeAttribute("onbeforeunload"));
  return;
}
module.exports = async function login(page) {
  await page.goto("https://www2.reg.chula.ac.th/");
  await page.waitForFunction(() => {
    if (document.querySelectorAll("frame")[2]) {
      return true;
    } else {
      return false;
    }
  });
  dumpFrameTree(page.mainFrame(), "");
  const rightFrame = page.frames().find((frame) => frame.name() === "right");
  await rightFrame.evaluate(
    `document.querySelector('.modal').classList.remove("show")`
  );
  await clearBeforeUnload(page);
  const src = await rightFrame.$eval(
    "#CAPTCHA",
    (el) =>
      new Promise((resolve, reject) => {
        const fetchAsBlob = (url) =>
          fetch(url).then((response) => response.blob());
        const convertBlobToBase64 = (blob) =>
          new Promise((_res, rej) => {
            const reader = new FileReader();
            reader.onerror = rej;
            reader.onload = () => {
              _res(reader.result);
            };
            reader.readAsDataURL(blob);
          });

        fetchAsBlob(el.src).then(convertBlobToBase64).then(resolve);
      })
  );
  const base64Data = src.replace(/^data:text\/plain;base64,/, "");
  const { data } = await axios.post(
    "https://vision.googleapis.com/v1/images:annotate",
    {
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {
              type: "TEXT_DETECTION",
            },
          ],
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: "Bearer " + visionAPIKey,
      },
    }
  );
  const captchaCode = data.responses[0].textAnnotations[0].description;
  await rightFrame.type(`input[name="userid"]`, id);
  await rightFrame.type(`input[name="password"]`, pass);
  await rightFrame.type(`input[name="code"]`, captchaCode);
  //process.exit();
};
