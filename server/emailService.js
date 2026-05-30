const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
})

// ── Pretty status label ───────────────────────────────────────
const statusLabel = {
  confirmed:  'Order Confirmed',
  processing: 'Being Prepared',
  shipped:    'On Its Way',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}

const statusColor = {
  confirmed:  '#C9A96E',
  processing: '#7A9BE8',
  shipped:    '#B07AE8',
  delivered:  '#50C87A',
  cancelled:  '#E87A7A',
}

// ── Email template ────────────────────────────────────────────
const buildEmailHTML = ({ customerName, orderId, status, items, total, shippingAddress, message }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
    <div style="background:#1C1712;padding:48px 40px;text-align:center;">
      <p style="font-size:10px;letter-spacing:0.4em;color:#C9A96E;text-transform:uppercase;margin:0 0 12px;font-weight:300;">
        EAU DE PARFUM
      </p>
      <h1 style="font-family:Georgia,serif;font-size:36px;font-weight:400;color:#FAF7F2;letter-spacing:0.4em;margin:0;">
        AEVUM
      </h1>
      <p style="font-size:9px;letter-spacing:0.3em;color:#C9A96E;margin:8px 0 0;text-transform:uppercase;">
        By Azka Shahid
      </p>
    </div>

    <!-- Status Banner -->
    <div style="background:${statusColor[status] || '#C9A96E'};padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#FFFFFF;font-weight:600;">
        ${statusLabel[status] || status.toUpperCase()}
      </p>
    </div>

    <!-- Body -->
    <div style="padding:48px 40px;">
      <p style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1C1712;margin:0 0 8px;">
        Dear ${customerName},
      </p>
      <p style="font-size:15px;color:#7A7060;line-height:1.8;margin:0 0 32px;font-weight:300;">
        ${message}
      </p>

      <!-- Order ID -->
      <div style="background:#FAF7F2;border-left:3px solid #C9A96E;padding:16px 20px;margin-bottom:32px;">
        <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#B8924A;margin:0 0 4px;">Order Reference</p>
        <p style="font-size:18px;font-family:monospace;color:#1C1712;font-weight:600;margin:0;">
          #${orderId.slice(-6).toUpperCase()}
        </p>
      </div>

      <!-- Items -->
      <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#B8924A;margin:0 0 16px;">Your Order</p>
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #F0E4CC;">
          <div>
            <p style="font-family:Georgia,serif;font-size:17px;color:#1C1712;margin:0 0 4px;">${item.name}</p>
            <p style="font-size:12px;color:#7A7060;margin:0;">${item.size} · ×${item.quantity}</p>
          </div>
          <p style="font-size:15px;color:#1C1712;font-weight:600;margin:0;">PKR ${(item.price * item.quantity).toLocaleString()}</p>
        </div>
      `).join('')}

      <!-- Total -->
      <div style="display:flex;justify-content:space-between;padding:20px 0;border-top:2px solid #B8924A;margin-top:8px;">
        <p style="font-size:14px;color:#1C1712;font-weight:600;margin:0;letter-spacing:0.1em;text-transform:uppercase;">Total</p>
        <p style="font-size:18px;color:#B8924A;font-weight:700;margin:0;">PKR ${total.toLocaleString()}</p>
      </div>

      <!-- Shipping -->
      ${shippingAddress ? `
        <div style="background:#FAF7F2;padding:20px;margin-top:24px;">
          <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#B8924A;margin:0 0 10px;">Delivering To</p>
          <p style="font-size:14px;color:#1C1712;margin:0 0 4px;font-weight:500;">${shippingAddress.fullName}</p>
          <p style="font-size:13px;color:#7A7060;margin:0;line-height:1.7;">
            ${shippingAddress.address}, ${shippingAddress.city}<br>
            ${shippingAddress.province} · ${shippingAddress.phone}
          </p>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background:#1C1712;padding:36px 40px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#C9A96E;font-style:italic;margin:0 0 8px;">
        "Wear the Unseen."
      </p>
      <p style="font-size:10px;letter-spacing:0.25em;color:rgba(245,240,230,0.3);text-transform:uppercase;margin:0;">
        AEVUM · By Azka Shahid · aevum_byazka
      </p>
    </div>

  </div>
</body>
</html>
`

// ── Send order status email ────────────────────────────────────
const sendOrderEmail = async ({ to, customerName, orderId, status, items, total, shippingAddress }) => {
  const messages = {
    confirmed: 'Your order has been confirmed and is being prepared with care. We will notify you once it ships.',
    processing: 'Your fragrance is currently being prepared and packaged with the utmost care.',
    shipped: 'Your order is on its way! Expect delivery within 3–5 business days. Cash on delivery upon arrival.',
    delivered: 'Your AEVUM order has been delivered. We hope you love every drop. Thank you for choosing us.',
    cancelled: 'Your order has been cancelled. If you have any questions, please reach out to us on Instagram @aevum_byazka.',
  }

  const subjectLines = {
    confirmed:  `Order Confirmed — #${orderId.slice(-6).toUpperCase()} | AEVUM`,
    processing: `Your Order is Being Prepared — AEVUM`,
    shipped:    `Your AEVUM Order is On Its Way ✦`,
    delivered:  `Your AEVUM Order Has Arrived`,
    cancelled:  `Order Cancelled — AEVUM`,
  }

  try {
    await transporter.sendMail({
      from: `"AEVUM By Azka Shahid" <${process.env.EMAIL_USER}>`,
      to,
      subject: subjectLines[status] || `Order Update — AEVUM`,
      html: buildEmailHTML({
        customerName,
        orderId,
        status,
        items,
        total,
        shippingAddress,
        message: messages[status] || 'Your order status has been updated.',
      }),
    })
    console.log(`✅ Email sent to ${to} — status: ${status}`)
    return true
  } catch (err) {
    console.error(`❌ Email failed:`, err.message)
    return false
  }
}

module.exports = { sendOrderEmail }