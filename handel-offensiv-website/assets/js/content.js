/* Lädt redaktionell gepflegte Texte aus cms/content.json und setzt sie in
   die mit data-edit markierten Elemente ein. Fällt bei Fehlern lautlos auf
   die fest eingebauten Texte zurück. */
(function () {
  "use strict";
  fetch("cms/content.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (texte) {
      if (!texte) return;
      document.querySelectorAll("[data-edit]").forEach(function (el) {
        var key = el.getAttribute("data-edit");
        if (typeof texte[key] === "string" && texte[key].trim() !== "") {
          el.innerHTML = texte[key];
        }
      });
    })
    .catch(function () { /* Offline/Fehler: eingebaute Texte bleiben stehen */ });
})();
