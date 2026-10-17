import cron from "node-cron";
import { runMonthlyCertificateJob } from "../routes/certificateMail.js";

function isLastDayOfMonth() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getMonth() !== today.getMonth();
}

export function initCronJobs() {
  console.log("Initializing automated monthly certificate cron service...");

  // Runs every day at 23:50: checks if today is the last day of the month
  cron.schedule("50 23 * * *", async () => {
    console.log("Daily 23:50 cron trigger: checking for month-end...");
    if (isLastDayOfMonth()) {
      console.log("Today is the LAST DAY of the month! Launching automated certificate dispatch...");
      try {
        await runMonthlyCertificateJob();
      } catch (err) {
        console.error("Scheduled monthly certificate error:", err);
      }
    } else {
      console.log("Not the last day of the month. Skipping automated certificate dispatch.");
    }
  });

  // Also runs at 00:05 on the 1st of every month as a safety check for previous month
  cron.schedule("5 0 1 * *", async () => {
    console.log("1st of month 00:05 safety cron trigger: verifying monthly certificates...");
    try {
      await runMonthlyCertificateJob();
    } catch (err) {
      console.error("1st of month safety cron error:", err);
    }
  });

  console.log("Automated monthly certificate scheduler active (Daily 23:50 check + 1st of month safety check).");
}
