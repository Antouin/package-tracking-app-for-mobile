// ===== Stockage local (temporaire, remplacé plus tard par Notion) =====
const CLE_COLIS = "colis";
const CLE_CONTACTS = "contacts";
const CLE_PARAMS = "params";

function charger(cle, defaut) {
  try {
    const v = localStorage.getItem(cle);
    return v ? JSON.parse(v) : defaut;
  } catch (e) {
    return defaut;
  }
}
function sauver(cle, valeur) {
  localStorage.setItem(cle, JSON.stringify(valeur));
}

let colis = charger(CLE_COLIS, []);
let contacts = charger(CLE_CONTACTS, {});
let statutActif = "Recu";

// ===== Parametres du message (modifiables dans l'app) =====
const PARAMS_DEFAUT = {
  organisation: "Votre organisation",
  adresse: "Accueil, batiment A, 12 rue Exemple, 75000 Paris",
  horaires: "du lundi au vendredi, de 9h a 17h",
  signature: "Equipe accueil"
};
let CONFIG = Object.assign({}, PARAMS_DEFAUT, charger(CLE_PARAMS, {}));

// ===== Elements =====
const liste = document.getElementById("liste");
const recherche = document.getElementById("recherche");
const dialog = document.getElementById("dialog-form");
const form = document.getElementById("form-colis");
const datalist = document.getElementById("liste-destinataires");

// ===== Utilitaires =====
function esc(t) {
  const AMP = String.fromCharCode(38);   // le caractère &
  const remplacements = {
    "&": AMP + "amp;",
    "<": AMP + "lt;",
    ">": AMP + "gt;",
    '"': AMP + "quot;",
    "'": AMP + "#39;"
  };
  return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
    return remplacements[c];
  });
}

function genererId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function formaterDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ===== Detection du transporteur =====
function deviner(suivi) {
  const s = suivi.trim().toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(s)) return "UPS";
  if (/^(6|8)[A-Z]\d{9,11}$/.test(s) || /^[A-Z]{2}\d{9}FR$/.test(s)) return "Colissimo";
  if (/^\d{10}$/.test(s)) return "DHL";
  if (/^\d{14}$/.test(s)) return "DPD";
  if (/^\d{12}$/.test(s)) return "FedEx";
  return "";
}

// ===== Generation du message =====
function genererObjet(c) {
  return "Colis arrive a l'accueil - " + (c.transporteur || "colis") + " " + c.suivi;
}

function genererMessage(c) {
  const date = new Date(c.dateReception).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const lignes = [];
  lignes.push("Bonjour " + c.destinataire + ",");
  lignes.push("");
  lignes.push("Un colis a votre attention est arrive a l'accueil le " + date + ".");
  lignes.push("");
  lignes.push("- Transporteur : " + (c.transporteur || "non precise"));
  lignes.push("- Numero de suivi : " + c.suivi);
  if (c.expediteur) lignes.push("- Expediteur : " + c.expediteur);
  lignes.push("");
  if (CONFIG.adresse) lignes.push("Retrait : " + CONFIG.adresse);
  if (CONFIG.horaires) lignes.push("Horaires : " + CONFIG.horaires);
  lignes.push("");
  lignes.push("Cordialement,");
  if (CONFIG.signature) lignes.push(CONFIG.signature);
  if (CONFIG.organisation) lignes.push(CONFIG.organisation);
  return lignes.join("\n");
}

// ===== Contacts =====
function majDatalist() {
  datalist.innerHTML = Object.keys(contacts)
    .map(function (nom) { return '<option value="' + esc(nom) + '">'; })
    .join("");
}

function memoriserContact(c) {
  if (!c.destinataire) return;
  contacts[c.destinataire] = { email: c.email || "", societe: c.societe || "" };
  sauver(CLE_CONTACTS, contacts);
  majDatalist();
}

// ===== Affichage =====
function afficher() {
  // Date du jour
  const elDate = document.getElementById("date-jour");
  if (elDate) {
    elDate.textContent = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  // Compteurs des onglets
  ["Recu", "Notifie", "Remis"].forEach(function (s) {
    const el = document.getElementById("cnt-" + s);
    if (el) el.textContent = colis.filter(function (c) { return c.statut === s; }).length;
  });

  const q = recherche.value.trim().toLowerCase();
  const filtres = colis
    .filter(function (c) { return c.statut === statutActif; })
    .filter(function (c) {
      if (!q) return true;
      return [c.suivi, c.destinataire, c.societe, c.expediteur, c.transporteur]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    })
    .sort(function (a, b) { return new Date(b.dateReception) - new Date(a.dateReception); });

  if (!filtres.length) {
    liste.innerHTML = '<p class="vide">Aucun colis.</p>';
    return;
  }

  liste.innerHTML = filtres.map(function (c) {
    let html = '<li class="carte" data-id="' + esc(c.id) + '">';
    html += '<div class="ligne1"><span>' + esc(c.destinataire) + "</span></div>";
    html += '<div class="detail">' + esc(c.transporteur || "") + " · " + esc(c.suivi) + "</div>";
    if (c.societe) html += '<div class="detail">' + esc(c.societe) + "</div>";
    if (c.expediteur) html += '<div class="detail">De : ' + esc(c.expediteur) + "</div>";
        if (!c.email) html += '<div class="alerte">⚠ sans email</div>';

    html += '<div class="dates">';
    html += '<div>📥 Reçu le ' + esc(formaterDate(c.dateReception)) + '</div>';
    if (c.dateNotification) {
      html += '<div>📧 Notifié le ' + esc(formaterDate(c.dateNotification)) + '</div>';
    }
    if (c.dateRemise) {
      html += '<div>✅ Remis le ' + esc(formaterDate(c.dateRemise)) + '</div>';
    }
    html += '</div>';

    if (c.signature) html += '<img class="signature-vignette" src="' + c.signature + '" alt="Signature">';
    html += '<div class="boutons">';
    if (c.statut === "Recu") {
      html += '<button data-action="notifier">📧 Notifier</button>';
    }
    if (c.statut === "Recu" || c.statut === "Notifie") {
      html += '<button class="ok" data-action="remettre">✓ Remis</button>';
    }
    html += '<button class="danger" data-action="supprimer">🗑</button>';
    html += "</div></li>";
    return html;
  }).join("");
}

// ===== Onglets et recherche =====
document.querySelectorAll("[data-statut]").forEach(function (b) {
  b.addEventListener("click", function () {
    statutActif = b.getAttribute("data-statut");
    document.querySelectorAll("[data-statut]").forEach(function (x) {
      x.classList.toggle("active", x === b);
    });
    afficher();
  });
});
recherche.addEventListener("input", afficher);

// ===== Formulaire =====
document.getElementById("btn-nouveau").addEventListener("click", function () {
  form.reset();
  majDatalist();
  dialog.showModal();
});
document.getElementById("btn-annuler").addEventListener("click", function () {
  dialog.close();
});

form.elements["suivi"].addEventListener("input", function (e) {
  const t = deviner(e.target.value);
  if (t) form.elements["transporteur"].value = t;
});

form.elements["destinataire"].addEventListener("change", function (e) {
  const k = contacts[e.target.value];
  if (!k) return;
  if (!form.elements["email"].value) form.elements["email"].value = k.email;
  if (!form.elements["societe"].value) form.elements["societe"].value = k.societe;
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const d = new FormData(form);
  const suivi = String(d.get("suivi") || "").trim();
  if (colis.some(function (c) { return c.suivi === suivi; })) {
    if (!confirm("Ce numero de suivi existe deja. Enregistrer quand meme ?")) return;
  }
  const c = {
    id: genererId(),
    suivi: suivi,
    transporteur: String(d.get("transporteur") || ""),
    expediteur: String(d.get("expediteur") || ""),
    destinataire: String(d.get("destinataire") || "").trim(),
    email: String(d.get("email") || "").trim(),
    societe: String(d.get("societe") || "").trim(),
    notes: String(d.get("notes") || ""),
    statut: "Recu",
    dateReception: new Date().toISOString()
  };
  colis.push(c);
  sauver(CLE_COLIS, colis);
  memoriserContact(c);
  dialog.close();
  statutActif = "Recu";
  document.querySelectorAll("[data-statut]").forEach(function (x) {
    x.classList.toggle("active", x.getAttribute("data-statut") === "Recu");
  });
  afficher();
});

// ===== Actions sur les cartes =====
liste.addEventListener("click", function (e) {
  const bouton = e.target.closest("button[data-action]");
  if (!bouton) return;
  const carte = bouton.closest(".carte");
  const c = colis.find(function (x) { return x.id === carte.getAttribute("data-id"); });
  if (!c) return;
  const action = bouton.getAttribute("data-action");

  if (action === "notifier") {
    ouvrirNotification(c);
  } else if (action === "remettre") {
    ouvrirSignature(c);
  } else if (action === "supprimer") {
    if (confirm("Supprimer ce colis ?")) {
      colis = colis.filter(function (x) { return x.id !== c.id; });
      sauver(CLE_COLIS, colis);
      afficher();
    }
  }
});

// ===== Notification =====
const dlgNotif = document.getElementById("dialog-notif");
const notifObjet = document.getElementById("notif-objet");
const notifCorps = document.getElementById("notif-corps");
let colisEnNotif = null;

function ouvrirNotification(c) {
  colisEnNotif = c;
  document.getElementById("notif-dest").textContent =
    c.destinataire + (c.email ? " <" + c.email + ">" : " (aucun email renseigne)");
  notifObjet.value = genererObjet(c);
  notifCorps.value = genererMessage(c);
  dlgNotif.showModal();
}

document.getElementById("notif-copier").addEventListener("click", function () {
  const texte = "Objet : " + notifObjet.value + "\n\n" + notifCorps.value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte).then(
      function () { alert("Message copie."); },
      function () { notifCorps.select(); alert("Copie impossible, selectionnez le texte manuellement."); }
    );
  } else {
    notifCorps.select();
    document.execCommand("copy");
    alert("Message copie.");
  }
});

document.getElementById("notif-mailto").addEventListener("click", function () {
  if (!colisEnNotif || !colisEnNotif.email) {
    alert("Pas d'email pour ce destinataire.");
    return;
  }
  const url = "mailto:" + encodeURIComponent(colisEnNotif.email) +
    "?subject=" + encodeURIComponent(notifObjet.value) +
    "&body=" + encodeURIComponent(notifCorps.value);
  window.location.href = url;
});

document.getElementById("notif-fermer").addEventListener("click", function () {
  dlgNotif.close();
});

document.getElementById("notif-valider").addEventListener("click", function () {
  if (colisEnNotif) {
    colisEnNotif.statut = "Notifie";
    colisEnNotif.dateNotification = new Date().toISOString();
    sauver(CLE_COLIS, colis);
  }
  dlgNotif.close();
  afficher();
});

// ===== Signature a la remise =====
const dlgSign = document.getElementById("dialog-signature");
const canvas = document.getElementById("sign-canvas");
const ctx = canvas.getContext("2d");
let colisEnRemise = null;
let dessine = false;
let aDessine = false;

function reglerCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * ratio;
  canvas.height = r.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  aDessine = false;
}

function position(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("pointerdown", function (e) {
  dessine = true;
  canvas.setPointerCapture(e.pointerId);
  const p = position(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
});
canvas.addEventListener("pointermove", function (e) {
  if (!dessine) return;
  const p = position(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  aDessine = true;
});
function finTrait() { dessine = false; }
canvas.addEventListener("pointerup", finTrait);
canvas.addEventListener("pointercancel", finTrait);

function ouvrirSignature(c) {
  colisEnRemise = c;
  document.getElementById("sign-info").textContent = c.destinataire + " · " + c.suivi;
  dlgSign.showModal();
  reglerCanvas();
}

function terminerRemise(signature) {
  if (!colisEnRemise) return;
  colisEnRemise.statut = "Remis";
  colisEnRemise.dateRemise = new Date().toISOString();
  if (signature) colisEnRemise.signature = signature;
  sauver(CLE_COLIS, colis);
  dlgSign.close();
  afficher();
}

document.getElementById("sign-effacer").addEventListener("click", reglerCanvas);
document.getElementById("sign-annuler").addEventListener("click", function () { dlgSign.close(); });
document.getElementById("sign-sans").addEventListener("click", function () { terminerRemise(null); });
document.getElementById("sign-valider").addEventListener("click", function () {
  terminerRemise(aDessine ? canvas.toDataURL("image/png") : null);
});

// ===== Fenetre des parametres =====
const dlgParams = document.getElementById("dialog-params");
const formParams = document.getElementById("form-params");

document.getElementById("btn-params").addEventListener("click", function () {
  formParams.elements["organisation"].value = CONFIG.organisation;
  formParams.elements["adresse"].value = CONFIG.adresse;
  formParams.elements["horaires"].value = CONFIG.horaires;
  formParams.elements["signature"].value = CONFIG.signature;
  dlgParams.showModal();
});

document.getElementById("params-annuler").addEventListener("click", function () {
  dlgParams.close();
});

formParams.addEventListener("submit", function (e) {
  e.preventDefault();
  CONFIG = {
    organisation: formParams.elements["organisation"].value.trim(),
    adresse: formParams.elements["adresse"].value.trim(),
    horaires: formParams.elements["horaires"].value.trim(),
    signature: formParams.elements["signature"].value.trim()
  };
  sauver(CLE_PARAMS, CONFIG);
  dlgParams.close();
});

// ===== Export / Import =====
function telecharger(nom, contenu, type) {
  const blob = new Blob([contenu], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

document.getElementById("btn-export").addEventListener("click", function () {
  const date = new Date().toISOString().slice(0, 10);
  const choix = confirm(
    "OK = sauvegarde complete (JSON, reimportable)\nAnnuler = tableau Excel (CSV)"
  );
  if (choix) {
    const data = { version: 1, exporteLe: new Date().toISOString(), colis: colis, contacts: contacts };
    telecharger("colis-" + date + ".json", JSON.stringify(data, null, 2), "application/json");
  } else {
    const cols = ["suivi", "transporteur", "expediteur", "destinataire", "email", "societe", "statut", "dateReception", "dateNotification", "dateRemise", "notes"];
    const echap = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    const lignes = [cols.join(";")].concat(
      colis.map(function (c) { return cols.map(function (k) { return echap(c[k]); }).join(";"); })
    );
    // BOM pour qu'Excel lise bien les accents
    telecharger("colis-" + date + ".csv", "\ufeff" + lignes.join("\n"), "text/csv;charset=utf-8");
  }
});

const champFichier = document.getElementById("fichier-import");
document.getElementById("btn-import").addEventListener("click", function () {
  champFichier.click();
});

champFichier.addEventListener("change", function () {
  const fichier = champFichier.files[0];
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = function () {
    try {
      const data = JSON.parse(lecteur.result);
      const importes = Array.isArray(data) ? data : data.colis;
      if (!Array.isArray(importes)) throw new Error("format");

      let ajoutes = 0, ignores = 0;
      importes.forEach(function (c) {
        if (!c || !c.suivi || !c.destinataire) { ignores++; return; }
        const existe = colis.some(function (x) { return x.id === c.id || x.suivi === c.suivi; });
        if (existe) { ignores++; return; }
        c.id = c.id || genererId();
        c.statut = c.statut || "Recu";
        c.dateReception = c.dateReception || new Date().toISOString();
        colis.push(c);
        ajoutes++;
      });

      if (data.contacts && typeof data.contacts === "object") {
        Object.keys(data.contacts).forEach(function (nom) {
          if (!contacts[nom]) contacts[nom] = data.contacts[nom];
        });
        sauver(CLE_CONTACTS, contacts);
        majDatalist();
      }

      sauver(CLE_COLIS, colis);
      afficher();
      alert(ajoutes + " colis importe(s), " + ignores + " ignore(s) (doublons ou incomplets).");
    } catch (e) {
      alert("Fichier invalide.");
    }
    champFichier.value = ""; // permet de reimporter le meme fichier
  };
  lecteur.readAsText(fichier);
});

// ===== Tuto guide =====
const ETAPES_TUTO = [
  { cible: "#btn-params",   texte: "⚙️ Les paramètres : réglez le nom de l'organisation, l'adresse de retrait, les horaires et la signature utilisés dans les messages aux destinataires." },
  { cible: "#btn-nouveau",  texte: "➕ Nouveau colis : appuyez ici pour enregistrer un colis qui vient d'arriver." },
  { cible: "[data-statut='Recu']",    texte: "📥 En cours : les colis reçus, pas encore signalés au destinataire." },
  { cible: "[data-statut='Notifie']", texte: "📧 Notifiés : le destinataire a été prévenu, le colis attend d'être récupéré." },
  { cible: "[data-statut='Remis']",   texte: "✅ Remis : les colis récupérés (avec la signature si elle a été faite)." }
];

const elTuto = document.getElementById("tuto");
const elTrou = document.getElementById("tuto-trou");
const elBulle = document.getElementById("tuto-bulle");
const elTexte = document.getElementById("tuto-texte");
const btnSuivant = document.getElementById("tuto-suivant");
let etapeTuto = 0;

function afficherEtapeTuto() {
  const etape = ETAPES_TUTO[etapeTuto];
  const el = document.querySelector(etape.cible);
  if (!el) { finirTuto(); return; }

  el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  const m = 6; // marge autour du bouton
  elTrou.style.top = (r.top - m) + "px";
  elTrou.style.left = (r.left - m) + "px";
  elTrou.style.width = (r.width + 2 * m) + "px";
  elTrou.style.height = (r.height + 2 * m) + "px";

  elTexte.textContent = etape.texte;
  btnSuivant.textContent = etapeTuto === ETAPES_TUTO.length - 1 ? "Terminer" : "Suivant";

  // bulle sous l'élément s'il est en haut de l'écran, sinon au-dessus
  const enHaut = r.top < window.innerHeight / 2;
  elBulle.style.top = enHaut ? (r.bottom + 20) + "px" : "";
  elBulle.style.bottom = enHaut ? "" : (window.innerHeight - r.top + 20) + "px";
}

function demarrerTuto() {
  etapeTuto = 0;
  elTuto.hidden = false;
  afficherEtapeTuto();
}
function finirTuto() { elTuto.hidden = true; }

document.getElementById("btn-aide").addEventListener("click", demarrerTuto);
document.getElementById("tuto-quitter").addEventListener("click", finirTuto);
btnSuivant.addEventListener("click", function () {
  etapeTuto++;
  if (etapeTuto >= ETAPES_TUTO.length) finirTuto();
  else afficherEtapeTuto();
});
window.addEventListener("resize", function () {
  if (!elTuto.hidden) afficherEtapeTuto();
});

// ===== Demarrage =====
majDatalist();
afficher();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}