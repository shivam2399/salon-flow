
import "dotenv/config";
import { Umzug, SequelizeStorage } from "umzug";
import sequelize from "../config/database.js";

const migrator = new Umzug({
  migrations: {
    glob: "migrations/*.js",
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

try {
  await sequelize.authenticate();
  console.log("Database connection successful.");

  const completed = await migrator.up();
  console.log(`Completed ${completed.length} migration(s).`);
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
