import PDFDocument from "pdfkit";

export function generateInvoiceNumber(appointmentId) {
  const year = new Date().getFullYear();
  const paddedId = String(appointmentId).padStart(5, "0");
  return `INV-${year}-${paddedId}`;
}

export function generateInvoicePDF(appointment) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const salon = appointment.salon || {
        name: "SalonFlow Studio",
        address: "Bhilai, Chhattisgarh, India",
        email: "hello@salonflow.local",
        phone: "+91 98765 43210",
      };

      const customer = appointment.customer || {
        name: "Valued Customer",
        email: "customer@example.com",
      };

      const service = appointment.service || {
        name: "Salon Service",
        durationMinutes: 45,
      };

      const staff = appointment.staff?.user || {
        name: "Stylist",
      };

      const invoiceNum =
        appointment.payment?.invoiceNumber ||
        generateInvoiceNumber(appointment.id);

      const priceRs = (Number(appointment.pricePaise || 0) / 100).toFixed(2);

      // Header
      doc
        .fillColor("#e11d48")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SalonFlow", 50, 50);

      doc
        .fillColor("#78716c")
        .fontSize(10)
        .font("Helvetica")
        .text("Professional Salon & Wellness Care", 50, 78)
        .text(salon.address, 50, 92)
        .text(`Email: ${salon.email || "support@salonflow.com"}`, 50, 106);

      // Invoice Title / Meta
      doc
        .fillColor("#1c1917")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("TAX INVOICE", 400, 50, { align: "right" });

      doc
        .fillColor("#44403c")
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice No: ${invoiceNum}`, 350, 75, { align: "right" })
        .text(
          `Date: ${new Date(appointment.createdAt || Date.now()).toLocaleDateString("en-IN")}`,
          350,
          90,
          { align: "right" }
        )
        .text(`Status: ${appointment.status.toUpperCase()}`, 350, 105, {
          align: "right",
        });

      doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e7e5e4").stroke();

      // Billed To
      doc
        .fillColor("#78716c")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("BILLED TO:", 50, 145);

      doc
        .fillColor("#1c1917")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(customer.name, 50, 162);

      doc
        .fillColor("#44403c")
        .fontSize(10)
        .font("Helvetica")
        .text(`Email: ${customer.email || "N/A"}`, 50, 178)
        .text(`Phone: ${customer.phone || "N/A"}`, 50, 192);

      // Table Header
      const tableTop = 230;
      doc
        .rect(50, tableTop, 500, 25)
        .fillColor("#f5f5f4")
        .fill();

      doc
        .fillColor("#1c1917")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Service Description", 60, tableTop + 7)
        .text("Stylist", 250, tableTop + 7)
        .text("Duration", 370, tableTop + 7)
        .text("Amount (INR)", 450, tableTop + 7, { align: "right", width: 90 });

      // Table Row
      const rowTop = tableTop + 35;
      doc
        .fillColor("#292524")
        .fontSize(10)
        .font("Helvetica")
        .text(service.name, 60, rowTop)
        .text(staff.name, 250, rowTop)
        .text(`${appointment.durationMinutes || service.durationMinutes} mins`, 370, rowTop)
        .text(`Rs. ${priceRs}`, 450, rowTop, { align: "right", width: 90 });

      doc.moveTo(50, rowTop + 25).lineTo(550, rowTop + 25).strokeColor("#e7e5e4").stroke();

      // Summary
      const summaryTop = rowTop + 45;
      doc
        .font("Helvetica-Bold")
        .text("Total Paid:", 350, summaryTop)
        .text(`Rs. ${priceRs}`, 450, summaryTop, { align: "right", width: 90 });

      if (appointment.payment) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#78716c")
          .text(
            `Payment Method: ${appointment.payment.paymentMethod.toUpperCase()} | Txn: ${appointment.payment.transactionId || "N/A"}`,
            50,
            summaryTop + 30
          );
      }

      // Footer
      doc
        .fillColor("#a8a29e")
        .fontSize(9)
        .text(
          "Thank you for choosing SalonFlow! For support, contact support@salonflow.com",
          50,
          700,
          { align: "center", width: 500 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
