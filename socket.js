import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const feed = document.querySelector(".feed");
const socket = io(
  "https://anonymous-confessions-2-backend.skywarspro15.repl.co"
);
let whatPost = -1;

var decodeEntities = (function () {
  var element = document.createElement("div");

  function decodeHTMLEntities(str) {
    if (str && typeof str === "string") {
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, "");
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gim, "");
      element.innerHTML = str;
      str = element.innerHTML;
      element.innerHTML = "";
    }

    return str;
  }

  return decodeHTMLEntities;
})();

function addReadMore(paragraph) {
  const content = paragraph.innerHTML;
  const maxChars = 200;
  const dots = document.createElement("span");
  dots.classList.add("dots");
  dots.innerHTML = "...";
  const more = document.createElement("span");
  more.classList.add("more");
  more.innerHTML = content.slice(maxChars);
  more.style.display = "none";
  paragraph.innerHTML = content.slice(0, maxChars);
  const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
  if (!regex.test(paragraph.innerHTML.trim().slice(-1))) {
    paragraph.appendChild(dots);
    paragraph.appendChild(more);
    const readMoreButton = document.createElement("button");
    readMoreButton.classList.add("read-more-button");
    readMoreButton.innerHTML = "Read more";
    paragraph.appendChild(readMoreButton);
    readMoreButton.addEventListener("click", () => {
      if (more.style.display === "none") {
        dots.style.display = "none";
        more.style.display = "inline";
        readMoreButton.innerHTML = "Read less";
      } else {
        dots.style.display = "inline";
        more.style.display = "none";
        readMoreButton.innerHTML = "Read more";
      }
    });
  }
}

function createPost(postData, isSorting = true) {
  const pID = postData.id;
  const pTitle = decodeEntities(postData.title);
  const pContent = decodeEntities(postData.content).replace(
    /(?:\r\n|\r|\n)/g,
    "<br>"
  );
  const pFiltered = postData.filtered;
  const pLikes = postData.likes;
  const pShares = postData.shares;
  const pComments = postData.comments;

  const post = document.createElement("div");
  post.classList.add("post");
  post.id = "post-" + pID;

  if (pFiltered) {
    post.classList.add("filtered");
  }

  const title = document.createElement("p");
  title.classList.add("title");
  title.innerHTML = pTitle;
  post.appendChild(title);

  const content = document.createElement("p");
  content.classList.add("content");
  content.innerHTML = pContent;
  addReadMore(content);
  post.appendChild(content);

  const footer = document.createElement("div");
  footer.classList.add("footer");
  post.appendChild(footer);

  const button1 = document.createElement("button");
  button1.id = "relate";
  button1.classList.add("button");
  button1.innerHTML = "Relate (" + pLikes + ")";

  button1.addEventListener("click", () => {
    if (socket.connected) {
      socket.emit("like", pID);
    }
  });

  footer.appendChild(button1);

  const button2 = document.createElement("button");
  button2.id = "comment";
  button2.classList.add("button");
  button2.innerHTML = "Comment (" + pComments.length + ")";

  button2.addEventListener("click", () => {
    if (socket.connected) {
      const allComments = document.querySelector(".allComments");
      allComments.innerHTML = "";
      const loadingElement = document.createElement("p");
      loadingElement.className = "status";
      loadingElement.innerText = "Loading...";
      allComments.prepend(loadingElement);
      openComments();
      socket.emit("fetchComments", pID);
      whatPost = pID;
    }
  });

  footer.appendChild(button2);

  const button3 = document.createElement("button");
  button3.id = "share";
  button3.classList.add("button");
  button3.innerHTML = "Share (" + pShares + ")";
  button3.addEventListener("click", async () => {
    const shareData = {
      title: "Anonymous Confessions: " + pTitle,
      text: "Take a look at this post from Anonymous Confessions!",
      url:
        window.location.protocol +
        "//" +
        window.location.host +
        "/post.html?p=" +
        pID,
    };
    try {
      await navigator.share(shareData);
      socket.emit("share", pID);
    } catch (e) {
      alert("Sorry, we cannot share that post: " + e);
    }
  });
  footer.appendChild(button3);

  if (isSorting) {
    feed.appendChild(post);
    return;
  }

  if (getSortPreference() == "newest") {
    feed.prepend(post);
  } else {
    feed.appendChild(post);
  }
}

function createComment(commentData) {
  const comment = commentData.content;
  const replies = commentData.replies;
  const likes = commentData.likes;

  const div = document.createElement("div");
  div.className = "comment";

  const p = document.createElement("p");
  p.className = "content";
  p.textContent = comment;

  const footer = document.createElement("div");
  footer.className = "footer";

  const relateButton = document.createElement("button");
  relateButton.className = "button";
  relateButton.id = "relate";
  relateButton.textContent = "Relate";

  const replyButton = document.createElement("button");
  replyButton.className = "button";
  replyButton.id = "reply";
  replyButton.textContent = "Reply";

  footer.appendChild(relateButton);
  footer.appendChild(replyButton);

  div.appendChild(p);
  div.appendChild(footer);

  const allComments = document.querySelector(".allComments");

  allComments.appendChild(div);
}

const postConfession = document.getElementById("postConfession");
const commentInput = document.getElementById("commentInput");
const sendComment = document.getElementById("sendComment");
const search = document.querySelector(".search");
let unsorted = [];
let searched = false;
let isSearching = false;

function searchPosts() {
  isSearching = true;
  feed.innerHTML = "";
  history.replaceState(
    { page: 1 },
    "Anonymous Confessions",
    window.location.pathname + "?q=" + search.value
  );
  unsorted.forEach((post) => {
    if (
      post.title
        .toLowerCase()
        .replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "")
        .includes(
          search.value
            .toLowerCase()
            .replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "")
        )
    ) {
      createPost(post);
    } else if (
      post.content
        .toLowerCase()
        .replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "")
        .includes(
          search.value
            .toLowerCase()
            .replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "")
        )
    ) {
      createPost(post);
    }
  });
  searched = true;
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

if (urlParams.has("q")) {
  search.value = urlParams.get("q");
  searchPosts();
}

search.addEventListener("input", () => {
  if (!searched) {
    return;
  }
  if (search.value.trim() != "") {
    return;
  }
  history.replaceState(
    { page: 1 },
    "Anonymous Confessions",
    window.location.pathname
  );
  isSearching = false;
  searched = false;
  if (getSortPreference() == "popular") {
    sortByPopular(unsorted);
  } else if (getSortPreference() == "newest") {
    sortByNewest(unsorted);
  } else if (getSortPreference() == "oldest") {
    sortByOldest(unsorted);
  }
});

search.addEventListener("keydown", (event) => {
  if (event.key != "Enter") {
    return;
  }
  searchPosts();
});

function addPost(title, content) {
  socket.emit("post", {
    title: title,
    content: content,
  });
}

socket.on("disconnect", () => {
  const status = document.createElement("p");
  status.className = "status";
  status.innerText = "You're offline! Hang tight as we attempt to reconnect...";
  feed.prepend(status);
});

function sortByPopular(curPosts) {
  console.log("Popularity sort selected");
  let likesArray = [];
  feed.innerHTML = "";
  const posts = curPosts.slice(0);
  posts.forEach((post) => {
    likesArray.push(post.likes);
  });
  likesArray = likesArray
    .sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    })
    .reverse();
  console.log(likesArray);
  likesArray.forEach((likes) => {
    posts.forEach((post) => {
      if (post.likes == likes) {
        createPost(post);
      }
    });
  });
}

function sortByNewest(curPosts) {
  console.log("Newest sort selected");
  feed.innerHTML = "";
  const posts = curPosts.slice(0).reverse();
  posts.forEach((post) => {
    createPost(post);
  });
}

function sortByOldest(curPosts) {
  console.log(curPosts);
  console.log("Oldest sort selected");
  feed.innerHTML = "";
  const posts = curPosts.slice(0);
  posts.forEach((post) => {
    createPost(post);
  });
}

let sortPref = document.getElementById("sortBy");

function getSortPreference() {
  if (localStorage.getItem("sortby") === null) {
    sortPref.value = "popular";
    return "popular";
  }
  sortPref.value = localStorage.getItem("sortby");
  return localStorage.getItem("sortby");
}

function setSortPreference(pref) {
  localStorage.setItem("sortby", pref);
}

sortPref.addEventListener("change", () => {
  console.log("Before sort", unsorted);
  console.log(sortPref.value);
  setSortPreference(sortPref.value);
  if (sortPref.value == "popular") {
    sortByPopular(unsorted);
  } else if (sortPref.value == "newest") {
    sortByNewest(unsorted);
  } else if (sortPref.value == "oldest") {
    sortByOldest(unsorted);
  }
  console.log("After sort", unsorted);
  if (isSearching) {
    searchPosts();
  }
});

getSortPreference();

socket.on("posts", (allPosts) => {
  unsorted = allPosts;
  console.log(unsorted);
  if (getSortPreference() == "popular") {
    sortByPopular(unsorted);
  } else if (getSortPreference() == "newest") {
    sortByNewest(unsorted);
  } else if (getSortPreference() == "oldest") {
    sortByOldest(unsorted);
  }
  if (isSearching) {
    searchPosts();
  }
});

socket.on("likes", (postData) => {
  let post = feed.querySelector("#post-" + postData.id);
  let footer = post.querySelector(".footer");
  let relate = footer.querySelector("#relate");
  relate.innerText = "Relate (" + postData.likes + ")";
});

socket.on("shares", (postData) => {
  let post = feed.querySelector("#post-" + postData.id);
  let footer = post.querySelector(".footer");
  let relate = footer.querySelector("#share");
  relate.innerText = "Share (" + postData.shares + ")";
});

socket.on("newPost", (post) => {
  unsorted.push(post);
  createPost(post, false);
});

socket.on("posted", () => {
  let pTitle = document.getElementById("pTitle");
  let pContent = document.getElementById("pContent");
  pTitle.value = "";
  pContent.value = "";
  postConfession.innerHTML = "Post confession";
  closeModal("addConfession");
});

socket.on("comments", (comments) => {
  const allComments = document.querySelector(".allComments");
  allComments.innerHTML = "";
  if (comments.length == 0) {
    const statusElement = document.createElement("p");
    statusElement.className = "status";
    statusElement.innerText =
      "Nothing to see here! Add your comment to get started";
    allComments.prepend(statusElement);
  }
  comments.forEach((comment) => {
    createComment(comment);
  });
});

socket.on("newComment", (comment) => {
  const allComments = document.querySelector(".allComments");
  if (allComments.querySelector(".status")) {
    allComments.querySelector(".status").remove();
  }
  if (comment.id == whatPost) {
    createComment(comment.content);
  }
});

socket.on("commentPosted", () => {
  commentInput.value = "";
});

socket.on("timeout", (seconds) => {
  console.log(seconds);
  let descText = document.getElementById("timeoutText");
  if (seconds > 1) {
    descText.innerText = "Please wait " + seconds + " seconds before posting.";
  } else {
    descText.innerText = "Please wait " + seconds + " second before posting.";
  }
});

socket.on("timeout-end", () => {
  let descText = document.getElementById("timeoutText");
  descText.innerText =
    "Share your feelings! Add an anonymous confession for everyone to see.";
});

postConfession.addEventListener("click", () => {
  let pTitle = document.getElementById("pTitle");
  let pContent = document.getElementById("pContent");
  if (socket.connected) {
    postConfession.innerHTML = "Posting...";
    addPost(pTitle.value, pContent.value);
  }
});

sendComment.addEventListener("click", () => {
  let cContent = commentInput.value;
  if (cContent.trim() == "") {
    return;
  }
  socket.emit("comment", { id: whatPost, comment: cContent.trim() });
});
