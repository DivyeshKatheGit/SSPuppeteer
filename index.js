const express = require('express');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const moment = require('moment');
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 4040;

app.use(express.json({ limit: '50mb' }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// cloudinary configuration 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function WebSiteScreenShot(website_url) {

  const filename = moment().unix();
  const filepath = __dirname + `/uploads/${filename}.jpg`;

  try {
    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1940, height: 1080 });
    await page.goto(website_url, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: filepath,
      fullPage: true
    });

    await browser.close();

    return { filename, filepath };
  }
  catch (e) {
    console.log("error object:");
    console.log(e);
    console.log();

    console.log("error object toString():");
    console.log("\t" + e.toString());

    console.log();
    console.log("error object attributes: ");
    console.log('\tname: ' + e.name + ' message: ' + e.message + ' at: ' + e.at + ' text: ' + e.text);

    console.log();
    console.log("error object stack: ");
    console.log(e.stack);
    return false;
  }
}

app.post('/upload', async (req, res) => {

  let { url } = req.body;

  const data = await WebSiteScreenShot(url);

  if (!data) {
    res.json({
      error: true,
    });
    return;
  }

  const { filename, filepath } = data;

  const cloud_res = cloudinary.uploader.upload(filepath, { public_id: filename });
  cloud_res.then(async (data) => {
    console.log(data)
    fs.unlink(filepath, (err) => { console.log(err) });
    res.json({
      error: false,
      ...data
    })

  }).catch((err) => {
    res.json({
      error: true,
    });
  });


});

app.get('/', (req, res) => {
  res.json({
    status: 'Hello, This is a server!'
  })
});

app.listen(PORT, () => {
  console.log(`listening to http://localhost:${PORT}`);
})