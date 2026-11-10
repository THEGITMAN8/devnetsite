window.DEVNET_POSTS = [];

document.addEventListener("DOMContentLoaded", function () {
  var posts = window.DEVNET_POSTS || [];
  var root = document.querySelector("[data-instagram]");
  if (!root || !posts.length) return;
  var list = document.createElement("div");
  list.className = "ig-embeds";
  posts.forEach(function (post) {
    var raw = typeof post === "string" ? post : (post && post.id) || "";
    var id = String(raw).replace(/[^A-Za-z0-9_-]/g, "");
    if (!id) return;
    var frame = document.createElement("iframe");
    frame.className = "ig-embed";
    frame.src = "https://www.instagram.com/p/" + id + "/embed";
    frame.title = (post && post.title) || "DevNet on Instagram";
    frame.loading = "lazy";
    frame.width = "400";
    frame.height = "480";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    list.appendChild(frame);
  });
  if (!list.childElementCount) return;
  root.replaceChildren(list);
});
