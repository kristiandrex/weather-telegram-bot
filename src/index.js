"use strict"

const dotenv = require('dotenv');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios').default;

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

async function populateFeature(feature) {
    const [lon, lat] = feature.geometry.coordinates;

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
            lat,
            lon,
            appid: process.env.WEATHER_API_KEY,
            units: 'metric'
        }
    });

    const url = "https://openweathermap.org/find?q=".concat(feature.text.replace(' ', '+'));

    return {
        type: 'location',
        id: feature.id,
        title: feature.text,
        latitude: lat,
        longitude: lon,
        reply_markup: Markup.inlineKeyboard([
            Markup.urlButton(response.data.main.temp + '°C', url)
        ])
    }
}

bot.on('inline_query', async (ctx) => {
    const query = ctx.update.inline_query.query.trim();

    if (query.length <= 0) {
        return;
    }

    try {
        const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`, {
            params: {
                access_token: process.env.MAPBOX_TOKEN
            }
        });

        const places = await Promise.all(response.data.features.map(feature => populateFeature(feature)));

        ctx.answerInlineQuery(places);
    }

    catch (error) {
        console.error(error);
    }
});

bot.launch();

console.log('Bot launched...');