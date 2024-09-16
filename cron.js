import cron from "cron";
import https from "https";

const URL = "https://api.shishyakul.in";

const job = new cron.CronJob("*/14 * * * *", function () {
  const currentHour = new Date().getHours();

  // Check if the current hour is between 8 AM and 8 PM
  if (currentHour >= 8 && currentHour < 20) {
    https
      .get(URL, (res) => {
        if (res.statusCode === 200) {
          // console.log("GET request sent successfully");
        } else {
          // console.log("GET request failed", res.statusCode);
        }
      })
      .on("error", (e) => {
        // console.error("Error while sending request: ", e);
      });
  } else {
    // console.log("Cron job skipped due to non-operational hours");
  }
});

export default job;
