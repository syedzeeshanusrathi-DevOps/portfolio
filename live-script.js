import {
  onUserChange,
  signUp,
  signIn,
  signOutUser,
  loadUserBooks,
  saveBookState
} from "./auth.js";

const libraryEl = document.getElementById("library");
const searchBox = document.getElementById("searchBox");
const emptyState = document.getElementById("emptyState");
const alphaNav = document.getElementById("alphaNav");
const resultCount = document.getElementById("resultCount");
const filterTabs = document.getElementById("filterTabs");
const userArea = document.getElementById("userArea");
const signInBtn = document.getElementById("signInBtn");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authError = document.getElementById("authError");
const authTitle = document.getElementById("authTitle");
const authToggle = document.getElementById("authToggle");
const authToggleText = document.getElementById("authToggleText");
const closeModal = document.getElementById("closeModal");
const signInBanner = document.getElementById("signInBanner");
const bannerSignIn = document.getElementById("bannerSignIn");
const libraryStats = document.getElementById("libraryStats");
document.getElementById("year").textContent = new Date().getFullYear();

let allBooks = [];
let allAudiobooks = [];
let userState = {};       // bookId -> { status, favorite }
let currentUser = null;
let activeFilter = "all";
let isSignUp = false;

function cleanTitle(t) {
  // Drive folder names use `:` where `'` was stripped (e.g. "Can:t" → "Can't")
  return (t || "").replace(/([A-Za-z]):([A-Za-z])/g, "$1'$2");
}

// === Books ===

function bookId(book) {
  const m = (book.pdf || "").match(/\/file\/d\/([^/?]+)/);
  return m ? m[1] : btoa(book.title).slice(0, 20);
}

async function loadBooks() {
  try {
    const [booksRes, audioRes] = await Promise.all([
      fetch("books.json"),
      fetch("audiobooks.json").catch(() => null)
    ]);
    const books = await booksRes.json();
    allBooks = books
      .map((b) => ({
        ...b,
        _type: "book",
        _id: bookId(b),
        _searchKey: (b.title + " " + (b.author || "")).toLowerCase()
      }))
      .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title)));

    if (audioRes && audioRes.ok) {
      const audios = await audioRes.json();
      allAudiobooks = audios
        .map((a) => {
          const title = cleanTitle(a.title);
          return {
            ...a,
            title,
            _type: "audiobook",
            _id: bookId(a),
            _searchKey: (title + " " + (a.author || "")).toLowerCase()
          };
        })
        .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title)));
    }
    applyView();
  } catch (err) {
    libraryEl.innerHTML =
      '<p class="empty-state">Could not load books.json.</p>';
    console.error(err);
  }
}

function sortKey(t) {
  return t.toLowerCase().replace(/^(the|a|an)\s+/, "");
}

function groupByLetter(books) {
  const groups = {};
  for (const book of books) {
    const first = (sortKey(book.title)[0] || "#").toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    (groups[letter] = groups[letter] || []).push(book);
  }
  return groups;
}

function applyView() {
  const q = searchBox.value.trim().toLowerCase();
  let filtered;
  if (activeFilter === "audiobooks" || activeFilter === "listened" || activeFilter === "wantToListen") {
    filtered = allAudiobooks;
  } else if (activeFilter === "favorite") {
    filtered = [...allBooks, ...allAudiobooks];
  } else {
    filtered = allBooks;
  }

  if (q) {
    filtered = filtered.filter((b) => b._searchKey.includes(q));
  }

  if (activeFilter !== "all" && activeFilter !== "audiobooks" && currentUser) {
    filtered = filtered.filter((b) => {
      const s = userState[b._id] || {};
      if (activeFilter === "favorite") return !!s.favorite;
      if (activeFilter === "listened") return s.status === "read";
      if (activeFilter === "wantToListen") return s.status === "wantToRead";
      return s.status === activeFilter;
    });
  }

  render(filtered);
}

function render(books) {
  libraryEl.innerHTML = "";
  emptyState.hidden = books.length > 0;
  resultCount.textContent = books.length
    ? `${books.length} book${books.length === 1 ? "" : "s"}`
    : "";
  renderStats();

  const groups = groupByLetter(books);
  const letters = Object.keys(groups).sort();
  buildAlphaNav(letters);

  for (const letter of letters) {
    const section = document.createElement("section");
    section.className = "letter-section";
    section.id = `letter-${letter}`;

    const heading = document.createElement("h2");
    heading.className = "letter-heading";
    heading.textContent = letter;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "book-grid";
    for (const book of groups[letter]) grid.appendChild(bookCard(book));
    section.appendChild(grid);
    libraryEl.appendChild(section);
  }
}

function bookCard(book) {
  const card = document.createElement("div");
  card.className = "book-card";

  if (!currentUser) {
    card.classList.add("locked");
  } else {
    const s = userState[book._id] || {};
    if (s.status === "read") card.classList.add("is-read");
    if (s.favorite) card.classList.add("is-favorite");
  }

  const link = document.createElement("a");
  const primaryUrl = book.pdf || book.audio;
  link.href = primaryUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const verb = book._type === "audiobook" ? "Listen to" : "Open";
  link.title = currentUser ? `${verb} "${book.title}"` : "Sign in to listen";

  link.addEventListener("click", (e) => {
    if (!currentUser) {
      e.preventDefault();
      openAuth();
    }
  });

  const coverWrap = document.createElement("div");
  coverWrap.className = "cover-wrap";

  const img = document.createElement("img");
  img.className = "book-cover";
  img.loading = "lazy";
  img.alt = `Cover of ${book.title}`;
  const fallback = book._type === "audiobook"
    ? audioPlaceholder(book.title)
    : placeholderCover(book.title);
  img.src = book.cover || fallback;
  img.onerror = () => { img.src = fallback; };
  coverWrap.appendChild(img);
  
  // CRITICAL: Only create lock element if user is NOT signed in
  if (!currentUser) {
    const lock = document.createElement("div");
    lock.className = "lock-overlay";
    lock.textContent = "🔒";
    coverWrap.appendChild(lock);
  }

  // Only show the floating 🎧 badge when a book ALSO has audio in addition to its PDF.
  // Pure audiobooks already open audio via the whole card click.
  if (book.audio && book.pdf) {
    const audioBtn = document.createElement("button");
    audioBtn.className = "audio-badge";
    audioBtn.title = currentUser ? "Listen to audiobook" : "Sign in to listen";
    audioBtn.innerHTML = "🎧";
    audioBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentUser) { openAuth(); return; }
      window.open(book.audio, "_blank", "noopener,noreferrer");
    });
    coverWrap.appendChild(audioBtn);
    card.classList.add("has-audio");
  }
  if (book._type === "audiobook") card.classList.add("is-audiobook");

  const info = document.createElement("div");
  info.className = "book-info";
  const title = document.createElement("p");
  title.className = "book-title";
  title.textContent = book.title;
  info.appendChild(title);
  
  if (book.author) {
    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author;
    info.appendChild(author);
  }

  link.appendChild(coverWrap);
  link.appendChild(info);
  card.appendChild(link);

  // Only add action bar if user is signed in
  if (currentUser) {
    card.appendChild(actionBar(book));
  }

  return card;
}

function actionBar(book) {
  const bar = document.createElement("div");
  bar.className = "action-bar";
  const s = userState[book._id] || {};
  const isAudio = book._type === "audiobook";

  const readBtn = mkBtn("✓", isAudio ? "Mark as Listened" : "Mark as Read", s.status === "read", async () => {
    await toggleStatus(book._id, "read");
  });
  const wantBtn = mkBtn(isAudio ? "🎧" : "📚", isAudio ? "Want to Listen" : "Want to Read", s.status === "wantToRead", async () => {
    await toggleStatus(book._id, "wantToRead");
  });
  const favBtn = mkBtn("★", "Favorite", !!s.favorite, async () => {
    await toggleFavorite(book._id);
  });

  bar.append(readBtn, wantBtn, favBtn);
  return bar;
}

function mkBtn(label, title, active, onClick) {
  const b = document.createElement("button");
  b.className = "action-btn" + (active ? " active" : "");
  b.title = title;
  b.textContent = label;
  b.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    b.disabled = true;
    try { await onClick(); } finally { b.disabled = false; }
  });
  return b;
}

async function toggleStatus(id, status) {
  const cur = userState[id] || {};
  const next = { ...cur };
  next.status = cur.status === status ? null : status;
  userState[id] = next;
  await saveBookState(currentUser.uid, id, next);
  applyView();
}

async function toggleFavorite(id) {
  const cur = userState[id] || {};
  const next = { ...cur, favorite: !cur.favorite };
  userState[id] = next;
  await saveBookState(currentUser.uid, id, next);
  applyView();
}

function placeholderCover(title) {
  const letter = (sortKey(title)[0] || "?").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect width="200" height="300" fill="#5a3e23"/>
    <text x="100" y="170" font-family="Georgia,serif" font-size="120" fill="#f4f1ea" text-anchor="middle">${letter}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function audioPlaceholder(title) {
  const safe = (title || "").replace(/[<>&]/g, "").slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <defs>
      <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#2d4a5a"/>
        <stop offset="100%" stop-color="#1a2c38"/>
      </linearGradient>
    </defs>
    <rect width="200" height="300" fill="url(#g)"/>
    <circle cx="100" cy="135" r="55" fill="#0a1620"/>
    <circle cx="100" cy="135" r="40" fill="none" stroke="#3a5d72" stroke-width="1"/>
    <circle cx="100" cy="135" r="28" fill="none" stroke="#3a5d72" stroke-width="1"/>
    <circle cx="100" cy="135" r="10" fill="#c89a5b"/>
    <circle cx="100" cy="135" r="3" fill="#1a2c38"/>
    <text x="100" y="240" font-family="Georgia,serif" font-size="14" fill="#c89a5b" text-anchor="middle">🎧 AUDIOBOOK</text>
    <foreignObject x="10" y="255" width="180" height="40">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font:11px/1.2 sans-serif;color:#e8d5b0;text-align:center;overflow:hidden">${safe}</div>
    </foreignObject>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function renderStats() {
  const total = allBooks.length;
  if (!total) { libraryStats.hidden = true; return; }

  let read = 0, want = 0, fav = 0;
  let listened = 0, wantListen = 0;
  if (currentUser) {
    for (const b of allBooks) {
      const s = userState[b._id];
      if (!s) continue;
      if (s.status === "read") read++;
      if (s.status === "wantToRead") want++;
      if (s.favorite) fav++;
    }
    for (const b of allAudiobooks) {
      const s = userState[b._id];
      if (!s) continue;
      if (s.status === "read") listened++;
      if (s.status === "wantToRead") wantListen++;
      if (s.favorite) fav++;
    }
  }

  const audioCount = allAudiobooks.length;

  const items = [{ icon: "📚", num: total, label: "Books" }];
  if (audioCount) items.push({ icon: "🎧", num: audioCount, label: "Audio" });
  if (currentUser) {
    items.push(
      { icon: "✓", num: read, label: "Read" },
      { icon: "🔖", num: want, label: "Want" }
    );
    if (audioCount) {
      items.push(
        { icon: "🎧✓", num: listened, label: "Listened" },
        { icon: "🎧🔖", num: wantListen, label: "To Listen" }
      );
    }
    items.push({ icon: "★", num: fav, label: "Favorites" });
  }

  libraryStats.innerHTML = items.map(i => `
    <div class="stat-card">
      <span class="stat-icon">${i.icon}</span>
      <span><span class="stat-num">${i.num}</span><span class="stat-label">${i.label}</span></span>
    </div>`).join("");
  libraryStats.hidden = false;
}

function buildAlphaNav(letters) {
  alphaNav.innerHTML = "";
  for (const letter of letters) {
    const link = document.createElement("a");
    link.href = `#letter-${letter}`;
    link.textContent = letter;
    alphaNav.appendChild(link);
  }
}

// === Search ===
let searchTimer;
searchBox.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyView, 120);
});

// === Filter tabs ===
filterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  for (const t of filterTabs.querySelectorAll(".filter-tab")) t.classList.remove("active");
  tab.classList.add("active");
  activeFilter = tab.dataset.filter;
  applyView();
});

// === Auth modal ===
function openAuth() {
  authError.hidden = true;
  authModal.hidden = false;
  authEmail.focus();
}
function closeAuth() {
  authModal.hidden = true;
  authForm.reset();
  authError.hidden = true;
}
function setMode(signup) {
  isSignUp = signup;
  authTitle.textContent = signup ? "Create account" : "Sign in";
  authSubmit.textContent = signup ? "Create account" : "Sign in";
  authToggleText.textContent = signup ? "Already have an account?" : "Don't have an account?";
  authToggle.textContent = signup ? "Sign in" : "Create one";
  authPassword.autocomplete = signup ? "new-password" : "current-password";
}

signInBtn.addEventListener("click", openAuth);
bannerSignIn.addEventListener("click", openAuth);
closeModal.addEventListener("click", closeAuth);
authModal.addEventListener("click", (e) => { if (e.target === authModal) closeAuth(); });
authToggle.addEventListener("click", () => setMode(!isSignUp));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.hidden = true;
  authSubmit.disabled = true;
  try {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (isSignUp) await signUp(email, password);
    else await signIn(email, password);
    closeAuth();
  } catch (err) {
    authError.hidden = false;
    authError.textContent = friendlyError(err);
  } finally {
    authSubmit.disabled = false;
  }
});

function friendlyError(err) {
  const code = err && err.code;
  switch (code) {
    case "auth/invalid-email": return "That email looks invalid.";
    case "auth/email-already-in-use": return "Email already registered. Try signing in.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong email or password.";
    default: return err.message || "Something went wrong. Try again.";
  }
}

// === Auth state ===
onUserChange((user) => {
  currentUser = user;
  userArea.innerHTML = "";

  const authTabs = filterTabs.querySelectorAll("[data-auth]");
  for (const t of authTabs) t.hidden = !user;

  if (user) {
    const pill = document.createElement("span");
    pill.className = "user-pill";
    pill.textContent = user.email;
    const out = document.createElement("button");
    out.className = "btn-link";
    out.textContent = "Sign out";
    out.addEventListener("click", () => signOutUser());
    userArea.append(pill, out);
    signInBanner.hidden = true;
  } else {
    signInBanner.hidden = false;
    const btn = document.createElement("button");
    btn.id = "signInBtn";
    btn.className = "btn-link";
    btn.textContent = "Sign in";
    btn.addEventListener("click", openAuth);
    userArea.appendChild(btn);
    if (["read", "wantToRead", "favorite", "listened", "wantToListen"].includes(activeFilter)) {
      activeFilter = "all";
      const allTab = filterTabs.querySelector('[data-filter="all"]');
      for (const t of filterTabs.querySelectorAll(".filter-tab")) t.classList.remove("active");
      if (allTab) allTab.classList.add("active");
    }
    userState = {};
  }

  // Re-render immediately so locks/buttons update without waiting for Firestore.
  applyView();

  // Then load the user's saved book states in the background.
  if (user) {
    loadUserBooks(user.uid)
      .then((s) => { userState = s; applyView(); })
      .catch((e) => { console.error(e); userState = {}; });
  }
});

loadBooks();
