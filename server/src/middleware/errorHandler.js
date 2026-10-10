export default function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "Invalid JSON body" } });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: { message: "Already exists" } });
  }

  if (err.status) {
    return res
      .status(err.status)
      .json({ error: { message: err.message, details: err.details } });
  }

  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong" } });
}