const { Telegraf } = require("telegraf");
const axios = require("axios");
require('./keep_alive');

const token = "6739550441:AAGZTtFO3UrlToY9zSFrK7Tk4j90EucSl8s";
const openWeatherMapApiKey = "13dc3d9300dfa030587bde6937a109d5";

const bot = new Telegraf(token);


// Start command
bot.start((ctx) => {
  const welcomeMessage =
    "Welcome to Weather Bot! Send a location or city name to get the current weather.";
  ctx.reply(welcomeMessage);
});

// Handle incoming location messages
bot.on("location", async (ctx) => {
  const { latitude, longitude } = ctx.message.location;

  // Log the user's location in your terminal
  console.log(
    `Received location from ${
      ctx.message.from.username || "Anonymous"
    }: Latitude ${latitude}, Longitude ${longitude}`,
  );

  await handleWeatherRequest(ctx, latitude, longitude);
});

// Handle incoming text messages
bot.on("text", async (ctx) => {
  const locationQuery = ctx.message.text;
  await handleWeatherRequest(ctx, null, null, locationQuery);
});

// Function to get weather data from the OpenWeatherMap API
async function getWeatherData(latitude, longitude, locationQuery = null) {
  let apiUrl;
  if (latitude && longitude) {
    apiUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherMapApiKey}`;
  } else if (locationQuery) {
    apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      locationQuery,
    )}&units=metric&appid=${openWeatherMapApiKey}`;
  } else {
    throw new Error(
      "Invalid request. Provide either location coordinates or a city name.",
    );
  }

  const response = await axios.get(apiUrl);

  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
  }
}

// Function to handle weather request
async function handleWeatherRequest(ctx, latitude, longitude, locationQuery) {
  try {
    // Call the OpenWeatherMap API to get the current weather
    const weatherData = await getWeatherData(
      latitude,
      longitude,
      locationQuery,
    );

    // Extract relevant information from the API response
    const { main, description } = weatherData.weather[0];
    const temperature = weatherData.main.temp;

    // Send the weather information to the user
    const weatherMessage = `Current Weather: ${description}\nTemperature: ${temperature} °C`;
    ctx.reply(weatherMessage);
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    ctx.reply(
      "Error fetching weather data. Please try again or provide a valid city name.\n\nExample city names: London, New York, Tokyo\n\n" +
        "Alternatively, you can share your location, and I will provide a fictional response.",
    );
  }
}

// Start the bot
bot.launch();
