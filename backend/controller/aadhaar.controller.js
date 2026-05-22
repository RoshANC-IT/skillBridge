export const uploadAadhaar = async (req, res) => {
  const { userId } = req.body;
  const aadhaarImage = req.file.path;

  // Use OCR to extract name, DOB, Aadhaar number
  const extractedData = await runOCR(aadhaarImage);

  await User.findByIdAndUpdate(userId, {
    aadhaarVerified: true,
    aadhaarDetails: extractedData
  });

  res.status(200).json({ message: "Aadhaar verified", data: extractedData });
};
