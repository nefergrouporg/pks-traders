import axios from "axios";

export const baseUrl = import.meta.env.VITE_BASE_URL;

export const getUpiId = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${baseUrl}/api/config/upi-id`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.upiId;
  } catch (error) {
    console.error("Error fetching UPI ID:", error);
    return null;
  }
};

export const setUpiId = async (upiId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${baseUrl}/api/config/upi-id`,
      {
        upiId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error setting UPI ID:", error);
    return null;
  }
};