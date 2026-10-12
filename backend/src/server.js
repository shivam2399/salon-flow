import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/database.js";
import { startReminderCronJob } from "./services/reminder.service.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("MySQL connection established successfully.");

    // Start background appointment reminder cron job
    startReminderCronJob();

    app.listen(PORT, () => {
      console.log(`SalonFlow API running on http://localhost:${PORT}`);
      console.log(`Swagger API Documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

startServer();