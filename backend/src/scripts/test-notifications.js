import "dotenv/config";
import nodemailer from "nodemailer";

async function testNotifications() {
  console.log("\n=======================================================");
  console.log("    SalonFlow - Email & SMS Notification Diagnostic    ");
  console.log("=======================================================\n");

  // ================= 1. EMAIL (SENDGRID / SMTP) =================
  console.log("[1/2] Testing Email Notification Service...");
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "no-reply@salonflow.com";

  console.log(`   Host:        ${host || "(not configured)"}`);
  console.log(`   Port:        ${port}`);
  console.log(`   From:        ${from}`);
  console.log(`   API Key:     ${pass ? pass.substring(0, 8) + "••••••••" : "(not set)"}`);

  // Test SendGrid REST API if key starts with SG.
  if (pass && pass.startsWith("SG.")) {
    console.log("\n   Checking SendGrid API Key validity via SendGrid API...");
    try {
      const sgRes = await fetch("https://api.sendgrid.com/v3/scopes", {
        headers: { Authorization: `Bearer ${pass}` },
      });
      if (sgRes.ok) {
        console.log("   ✅ SendGrid API Key is VALID and ACTIVE!");
      } else {
        const sgData = await sgRes.json().catch(() => ({}));
        console.error("   ❌ SendGrid API Key validation error:", sgData.errors ? sgData.errors[0]?.message : `HTTP ${sgRes.status}`);
      }
    } catch (e) {
      console.warn("   ⚠️  Could not reach SendGrid HTTP endpoint:", e.message);
    }
  }

  if (host && user && pass) {
    console.log("\n   Testing SMTP Connection (with 6s timeout)...");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });

    try {
      await transporter.verify();
      console.log("   ✅ SMTP Transporter connected & ready to send!");
    } catch (err) {
      console.warn("   ⚠️  SMTP connection timed out or rejected:", err.message);
      console.log("      (Note: Some home ISPs block outbound SMTP port 587. If so, port 2525 or 465 can be used).");
    }
  } else {
    console.log("   ℹ️  SMTP keys not set. SalonFlow automatically uses Ethereal test inbox for local development.");
  }

  // ================= 2. TWILIO SMS =================
  console.log("\n[2/2] Testing Twilio SMS Service...");
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log(`   Account SID: ${accountSid || "(not set)"}`);
  console.log(`   Auth Token:  ${authToken ? authToken.substring(0, 6) + "••••••••" : "(not set)"}`);
  console.log(`   From Number: ${fromNumber || "(not set)"}`);

  if (accountSid && authToken) {
    if (accountSid === authToken) {
      console.error("\n   ❌ MISCONFIGURATION DETECTED: TWILIO_AUTH_TOKEN is set to the same value as TWILIO_ACCOUNT_SID!");
      console.error("      In your Twilio Console (https://console.twilio.com):");
      console.error("      1. 'Account SID' starts with 'AC...'");
      console.error("      2. 'Auth Token' is a separate 32-character secret (click 'Show Auth Token' in the Twilio dashboard).");
      console.error("      Please paste the actual Auth Token into backend/.env under TWILIO_AUTH_TOKEN.");
    } else {
      try {
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
        const twilioRes = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
        });

        const data = await twilioRes.json();
        if (twilioRes.ok) {
          console.log("\n   ✅ Twilio API authenticated successfully!");
          console.log(`      Account Name:   ${data.friendly_name}`);
          console.log(`      Account Status: ${data.status}`);
        } else {
          console.error("\n   ❌ Twilio Authentication Failed:", data.message || `HTTP ${twilioRes.status}`);
        }
      } catch (err) {
        console.error("   ❌ Twilio request failed:", err.message);
      }
    }
  } else {
    console.log("   ℹ️  Twilio credentials not configured. SMS is simulated in server logs.");
  }

  console.log("\n=======================================================");
  console.log("              Diagnostic Check Finished               ");
  console.log("=======================================================\n");
}

testNotifications().catch(console.error);

