const jwt = require("jsonwebtoken");
const prisma = require("../src/utils/prisma");

exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Expired, tampered with or malformed: the client must sign in again (401),
      // not see a server error.
      const expired = error.name === "TokenExpiredError";
      return res.status(401).json({
        error: expired ? "Session expired" : "Invalid token",
        message: expired
          ? "Your session has expired. Please log in again."
          : "Please log in again.",
        code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!user) {
      return res.status(401).json({ error: "User not found", message: "Please log in again." });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(500).json({ error: "Failed to authenticate token" });
  }
};

exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};
