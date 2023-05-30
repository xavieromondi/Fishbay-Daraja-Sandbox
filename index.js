const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");

require("dotenv").config();
const PORT = process.env.PORT;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const getAccessToken = async () => {
  const consumerKey = "wcMZ02TzOagGtiYg9oGRpfdR8BXYOFMN";
  const consumerSecret = "Axvzm9tnBQxYcJ33";

  try {
    const url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const encodedCredentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");
    console.log(`my credentials ${encodedCredentials}`);
    const headers = {
      Authorization: `Basic ${encodedCredentials}`,
    };

    const response = await axios.get(url, { headers });
    return response.data.access_token;
  } catch (error) {
    throw new Error("Failed to get access token.");
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

app.post("/stk", async (req, res) => {
  const phone = req.body.phone.substring(1);
  const amount = req.body.amount;

  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const shortCode = "174379"; // Sandbox: '174379'
  const passkey =
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  const stk_password = Buffer.from(shortCode + passkey + timestamp).toString(
    "base64"
  );

  // Choose one depending on your development environment
  const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"; // Sandbox
  // const url = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'; // Live

  try {
    const token = getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const requestBody = {
      BusinessShortCode: shortCode,
      Password: stk_password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: `254${phone}`,
      PartyB: shortCode,
      PhoneNumber: `254${phone}`,
      CallBackURL: "https://mydomain.com/path",
      AccountReference: "account",
      TransactionDesc: "test",
    };

    const response = await axios.post(url, requestBody, { headers });
    console.log(response.data); // Log the response data
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
