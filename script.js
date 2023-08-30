const body = document.querySelector("html");

function themeToggle() {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

if (localStorage.getItem("theme") == "dark") {
  if (!body.classList.contains("dark-mode")) {
    body.classList.toggle("dark-mode");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add("closed");
  setTimeout(() => {
    modal.style.display = "none";
  }, 750);
}

function openPostModal() {
  const modal = document.querySelector(".popup.addConfession");
  modal.style.display = "flex";
  modal.classList.remove("closed");
}

function openComments() {
  const modal = document.querySelector(".popup.comments");
  modal.style.display = "flex";
  modal.classList.remove("closed");
}
