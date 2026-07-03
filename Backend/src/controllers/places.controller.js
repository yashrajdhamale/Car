export const searchPlaces = (req, res) => {
  const query = (req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query parameter q is required",
    });
  }

  return res.json({
    success: true,
    query,
    suggestedLocations: [
      {
        placeName: `${query} City Center`,
        placeAddress: `Sample address for ${query}`,
      },
    ],
  });
};
