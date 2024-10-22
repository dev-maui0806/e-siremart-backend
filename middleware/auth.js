// middleware/auth.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const authenticate = (req, res, next) => {
  const authTokenHeader = req?.headers?.authorization;

  if (!authTokenHeader) {
    console.error("Unauthorized - Missing Authorization Header");
    
    return res
      .status(401)
      .json({ message: "Unauthorized - Missing Authorization Header" });
  }

  const [bearer, authToken] = authTokenHeader.split(" ");

  if (bearer !== "Bearer" || !authToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid Authorization Header Format" });
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid Token" });
  }
};

module.exports = { authenticate };
