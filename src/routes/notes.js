const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authorize = require("../middleware/authorize")

const router = express.Router()
const prisma = new PrismaClient()

// Hämta alla notes för inloggade användare
router.get("/", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub)
    const notes = await prisma.note.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" }
    })
    res.json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error fetching notes" })
  }
})

// POST skapa ny note
router.post("/", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub)
    const { title, content } = req.body

    if (!title || !content) {
      return res.status(400).json({ msg: "Title and content are required" })
    }

    const note = await prisma.note.create({
      data: { title, content, ownerId: userId }
    })

    res.status(201).json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error creating note", error: err.message })
  }
})

// PUT updatera note 
router.put("/:id", authorize, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub)
    const noteId = parseInt(req.params.id)
    const { title, content } = req.body

    const existing = await prisma.note.findUnique({ where: { id: noteId } })
    if (!existing) return res.status(404).json({ msg: "Note not found" })
    if (existing.ownerId !== userId)
      return res.status(403).json({ msg: "Forbidden: Not your note" })

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { title, content }
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
    const userId = parseInt(req.authUser.sub)
    const noteId = parseInt(req.params.id)

    const existing = await prisma.note.findUnique({ where: { id: noteId } })
    if (!existing) return res.status(404).json({ msg: "Note not found" })
    if (existing.ownerId !== userId)
      return res.status(403).json({ msg: "Forbidden: Not your note" })

    await prisma.note.delete({ where: { id: noteId } })
    res.json({ msg: "Note deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error deleting note", error: err.message })
  }
})

module.exports = router
