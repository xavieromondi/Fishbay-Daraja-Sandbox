const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");

require("dotenv").config();

app.use(express.json());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));
app.use(cors());

const generateToken = async (req, res, next) => {
  const secret = " tK06382CAc5GPlWI";
  console.log(secret);
  const consumer = "nHhEozjLoE9CWgnQR7LTaaWGVwxA1Kb8";
  console.log(consumer);
  const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");

  try {
    const { data } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    req.access_token = data.access_token;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
};

app.get("/stk", (req, res) => {
  res.send(
    `<form action="/stk" method="POST">
      <label>Phone Number</label>
      <input type="text" name="phone" />
      <label>Amount</label>
      <input type="text" name="amount" />
      <button type="submit">Pay</button>
    </form>`
  );
});

app.post("/stk", generateToken, async (req, res) => {
  const callbackurl = "https://samakibay.onrender.com";
  console.log(callbackurl);
  const phone = req.body.phone.substring(1);
  const amount = req.body.amount;
  console.log(phone);
  console.log(amount);

  const date = new Date();

  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const shortcode = 174379;
  console.log(shortcode);
  const passkey =
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  console.log(passkey);
  const password = new Buffer.from(shortcode + passkey + timestamp).toString(
    "base64"
  );

  try {
    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phone}`,
        PartyB: shortcode,
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://mydomain.com/pa",
        AccountReference: `254${phone}`,
        TransactionDesc: "Test",
      },
      {
        headers: {
          Authorization: `Bearer ${req.access_token}`,
        },
      }
    );

    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

app.listen(process.env.PORT, () => console.log("Server running on port 8080"));
