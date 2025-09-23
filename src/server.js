const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()
app.use(cors())
app.use(express.json())

const notesRouter = require("./routes/notes")
app.use("/notes", notesRouter)

const PORT = process.env.PORT || 8081
app.listen(PORT, () => console.log(`Collaborative API running on http://localhost:${PORT}`))
