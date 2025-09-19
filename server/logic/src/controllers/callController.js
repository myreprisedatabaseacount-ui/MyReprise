// Fonction temporaire pour générer un token de stream
function generateStreamToken(userId) {
  // Implémentation temporaire - à remplacer par la vraie logique
  return `stream_token_${userId}_${Date.now()}`;
}

async function getStreamToken(req, res) {
  try {
    console.log("Generating Stream token for user:", req.user);
    const token = generateStreamToken(req.user.userId);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  getStreamToken
};