export async function readJsonResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(
      `The server returned an empty response (HTTP ${response.status}). Check that the backend is running and connected to MySQL.`
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    if (!response.ok) {
      throw new Error(
        `The API request failed (HTTP ${response.status}). Check the backend logs and MySQL configuration.`
      );
    }
    throw new Error(`The server returned an invalid response (HTTP ${response.status}). Check the backend logs.`);
  }
}
