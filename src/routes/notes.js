const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authorize = require("../middleware/authorize")

const router = express.Router()
const prisma = new PrismaClient()

// Hämta alla notes för inloggad användare
router.get("/", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub, 10) //  från JWT

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    res.json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error fetching notes", error: err.message })
  }
})

// Hämta en specifik note
router.get("/:id", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub, 10)
    const noteId = parseInt(req.params.id, 10)

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return res.status(404).json({ msg: "Note not found" })
    if (note.userId !== userId) return res.status(403).json({ msg: "Forbidden" })

    res.json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error fetching note", error: err.message })
  }
})

// Skapa ny note
router.post("/", authorize, async (req, res) => {
  try {
    const userId =req.authUser.sub
    const { title, content } = req.body

    if (!title || !content) {
      return res.status(400).json({ msg: "Title and content are required" })
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId // direkt från JWT
      }
    })

    res.status(201).json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error creating note", error: err.message })
  }
})

// Uppdatera note
router.put("/:id", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub, 10)
    const noteId = parseInt(req.params.id, 10)
    const { title, content } = req.body

    const existing = await prisma.note.findUnique({ where: { id: noteId } })
    if (!existing) return res.status(404).json({ msg: "Note not found" })
    if (existing.userId !== userId)
      return res.status(403).json({ msg: "Forbidden: Not your note" })

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { title, content },
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error updating note", error: err.message })
  }
})

// Radera note
router.delete("/:id", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub, 10)
    const noteId = parseInt(req.params.id, 10)

    const existing = await prisma.note.findUnique({ where: { id: noteId } })
    if (!existing) return res.status(404).json({ msg: "Note not found" })
    if (existing.userId !== userId)
      return res.status(403).json({ msg: "Forbidden: Not your note" })

    await prisma.note.delete({ where: { id: noteId } })
    res.json({ msg: "Note deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error deleting note", error: err.message })
  }
})

module.exports = router
