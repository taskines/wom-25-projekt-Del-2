const apiUrl = "http://localhost:8081/notes"
let notes = []

// Elements
const loginContainer = document.getElementById("login-container")
const boardContainer = document.getElementById("board-container")
const loginForm = document.getElementById("loginForm")
const createNoteForm = document.getElementById("createNoteForm")
const notesBoard = document.getElementById("notesBoard")
const logoutBtn = document.getElementById("logoutBtn")

// --- AUTH ---
loginForm.addEventListener("submit", async e => {
  e.preventDefault()
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const res = await fetch("http://localhost:8080/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem("jwt", data.jwt)
      loginContainer.classList.add("hidden")
      boardContainer.classList.remove("hidden")
      loadNotes()
    } else {
      alert(data.msg)
    }
  } catch (err) {
    console.error(err)
  }
})

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("jwt")
  location.reload()
})

// --- CRUD ---
createNoteForm.addEventListener("submit", async e => {
  e.preventDefault()
  const title = document.getElementById("noteTitle").value
  const content = document.getElementById("noteContent").value
  const note = await createNote(title, content)
  document.getElementById("noteTitle").value = ""
  document.getElementById("noteContent").value = ""
  notes.push(note)
  renderNotes()
})

async function createNote(title, content) {
  const token = localStorage.getItem("jwt")
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  })
  return await res.json()
}

async function updateNote(id, title, content) {
  const token = localStorage.getItem("jwt")
  await fetch(`${apiUrl}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, content }) 
  })
}

async function deleteNote(id) {
  const token = localStorage.getItem("jwt")
  await fetch(`${apiUrl}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
  notes = notes.filter(n => n.id !== id)
  renderNotes()
}

async function loadNotes() {
  const token = localStorage.getItem("jwt")
  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.ok) {
    notes = await res.json()
    renderNotes()
  }
}

// --- RENDER ---
function renderNotes() {
  notesBoard.innerHTML = ""
  notes.forEach(note => {
    const div = document.createElement("div")
    div.className = "note"
    div.setAttribute("draggable", "true")
    div.dataset.id = note.id
    div.style.backgroundColor = "#ffff88"
     div.querySelectorAll("h3, textarea").forEach(el => {
      el.addEventListener("dragover", e => e.stopPropagation())
      el.addEventListener("drop", e => e.stopPropagation())
    })
    

    div.innerHTML = `
      <h3 contenteditable="true">${note.title}</h3>
      <textarea>${note.content}</textarea>
      <input type="color" class="colorPicker" value="#ffff88" />
      <button class="deleteBtn">Delete</button>
    `

    const h3 = div.querySelector("h3")
    const textarea = div.querySelector("textarea")
    const colorPicker = div.querySelector(".colorPicker")

    // Change color visually
    colorPicker.addEventListener("input", () => {
      div.style.backgroundColor = colorPicker.value
    })

    // Delete note
    div.querySelector(".deleteBtn").addEventListener("click", () => deleteNote(note.id))

    // Update title/content (persists to DB)
    h3.addEventListener("blur", () => updateNote(note.id, h3.textContent, textarea.value))
    textarea.addEventListener("blur", () => updateNote(note.id, h3.textContent, textarea.value))

    // Drag & Drop
    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", note.id)
    })

    notesBoard.appendChild(div)
  })
}

notesBoard.addEventListener("dragover", e => {
  e.preventDefault()
})

notesBoard.addEventListener("drop", e => {
  e.preventDefault()

  const id = e.dataTransfer.getData("text/plain")
  const noteDiv = document.querySelector(`[data-id='${id}']`)

  // Get board-relative position
  const boardRect = notesBoard.getBoundingClientRect()
  const offsetX = e.clientX - boardRect.left
  const offsetY = e.clientY - boardRect.top

  noteDiv.style.position = "absolute"
  noteDiv.style.left = `${offsetX - noteDiv.offsetWidth / 2}px`
  noteDiv.style.top = `${offsetY - noteDiv.offsetHeight / 2}px`

  // Optional: bring dragged note to front
  noteDiv.style.zIndex = "1000"
})
