import otpGenerator from "otp-generator";
import { sendSMS } from "../utils/sms.js"; // use Twilio, MSG91, etc.

export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number required" });

  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false });
  await sendSMS(phone, `Your Skill Bridge OTP is ${otp}`);

  // Store OTP temporarily (in-memory, Redis, or DB)
  req.app.locals.otpStore = { [phone]: otp };

  res.status(200).json({ message: "OTP sent" });
};


export const verifyOtp = async (req, res) => {
  const { phone, otp, role } = req.body;
  const storedOtp = req.app.locals.otpStore?.[phone];

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, role }); // minimal signup
  }

  const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(200).json({ token, user });
};
