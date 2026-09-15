const API_URL = "https://carbon-footprint-1-a5ae.onrender.com/api/chatbot";

const getUserLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error("Chatbot Location Error:", error);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
};

const sendMessageToBot = async (message) => {
    try {
        const location = await getUserLocation();

        const requestBody = {
            message: message
        };

        // Add location only when available
        if (location) {
            requestBody.latitude = location.latitude;
            requestBody.longitude = location.longitude;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Something went wrong"
            );
        }

        return data.response;

    } catch (error) {
        console.error("Chatbot API Error:", error);

        return "⚠️ Sorry, I'm having trouble connecting right now. Please try again.";
    }
};

export default sendMessageToBot;