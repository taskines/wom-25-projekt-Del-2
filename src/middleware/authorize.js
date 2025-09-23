const jwt = require("jsonwebtoken")
require("dotenv").config()

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  if (!authHeader) return res.status(401).json({ msg: "Missing Authorization header" })

  const token = authHeader.split(" ")[1]
  if (!token) return res.status(401).json({ msg: "Missing token" })

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    req.authUser = user
    next()
  } catch (err) {
    res.status(401).json({ msg: "Invalid token", error: err.message })
  }
}
