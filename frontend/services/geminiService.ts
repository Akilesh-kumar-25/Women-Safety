
export async function generateAlertMessage(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch('http://localhost:3001/api/generate-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error(`Backend message generation failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.message;
    
  } catch (error) {
    console.error("Error fetching alert message from backend:", error);
    // Fallback message in case the backend call fails
    return `EMERGENCY! Need immediate help. Location: https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}
