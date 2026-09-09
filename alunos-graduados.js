(() => {
  "use strict";

  const API_URL = "https://app.ecvo.com.br/api/publico/alunos-graduados";
  const REQUEST_TIMEOUT_MS = 12000;
  const CERTIFICATE_WIDTH = 2000;
  const CERTIFICATE_HEIGHT = 1414;
  const CERTIFICATE_ASSETS = {
    logo: "/assets/logo-ecvo-negativo.png",
    signature: "/assets/assinatura-digital-marcus-vinicius.png",
  };
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const count = document.querySelector("#graduates-count");
  const directory = document.querySelector("#graduates-directory");
  const loading = document.querySelector("#graduates-loading");
  const list = document.querySelector("#graduates-list");
  const empty = document.querySelector("#graduates-empty");
  const error = document.querySelector("#graduates-error");
  const retry = document.querySelector("#graduates-retry");
  const certificateStatus = document.querySelector("#certificate-status");

  if (!count || !directory || !loading || !list || !empty || !error || !retry || !certificateStatus) return;

  let activeController;
  let certificateAssetsPromise;

  function textValue(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function normalizePhotoUrl(value) {
    const candidate = textValue(value);
    if (!candidate) return null;

    try {
      const url = new URL(candidate);
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  }

  function normalizeGraduation(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const modality = textValue(value.modalidade);
    const level = textValue(value.faixa);
    if (!modality || !level) return null;

    return {
      modality,
      level,
      date: textValue(value.dataGraduacao),
    };
  }

  function normalizeStudent(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const name = textValue(value.nome);
    if (!name || !Array.isArray(value.graduacoes)) return null;

    const graduations = value.graduacoes.map(normalizeGraduation).filter(Boolean);
    if (!graduations.length) return null;

    return {
      name,
      athleteId: textValue(value.idAtleta),
      photoUrl: normalizePhotoUrl(value.fotoUrl),
      graduations,
    };
  }

  function initialsFor(name) {
    const parts = name.split(/\s+/u).filter(Boolean);
    const selected = parts.length > 1 ? [parts[0], parts.at(-1)] : parts;
    return selected
      .map((part) => Array.from(part)[0] || "")
      .join("")
      .toLocaleUpperCase("pt-BR")
      .slice(0, 2);
  }

  function groupByModality(graduations) {
    const groups = new Map();

    graduations.forEach((graduation) => {
      if (!groups.has(graduation.modality)) groups.set(graduation.modality, []);
      groups.get(graduation.modality).push(graduation);
    });

    return groups;
  }

  function createPhoto(student) {
    const media = document.createElement("div");
    media.className = "graduate-photo";

    const fallback = document.createElement("span");
    fallback.className = "graduate-photo-fallback";
    fallback.textContent = initialsFor(student.name);
    media.append(fallback);

    if (!student.photoUrl) {
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `Foto não disponível para ${student.name}`);
      return media;
    }

    fallback.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.alt = `Foto de ${student.name}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("load", () => media.classList.add("has-photo"), { once: true });
    image.addEventListener("error", () => {
      image.remove();
      fallback.removeAttribute("aria-hidden");
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `Foto não disponível para ${student.name}`);
    }, { once: true });
    image.crossOrigin = "anonymous";
    image.src = student.photoUrl;
    media.append(image);
    return media;
  }

  function parseGraduationDate(value) {
    const parsedDate = value ? new Date(value) : null;
    return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  }

  function createDate(value) {
    const parsedDate = parseGraduationDate(value);

    if (!parsedDate) {
      const fallback = document.createElement("span");
      fallback.className = "graduation-date graduation-date--fallback";
      fallback.textContent = "Data não disponível";
      return fallback;
    }

    const time = document.createElement("time");
    time.className = "graduation-date";
    time.dateTime = parsedDate.toISOString();
    time.textContent = dateFormatter.format(parsedDate);
    return time;
  }

  function loadCertificateImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", reject, { once: true });
      image.src = source;
    });
  }

  function getCertificateAssets() {
    if (!certificateAssetsPromise) {
      certificateAssetsPromise = Promise.all([
        loadCertificateImage(CERTIFICATE_ASSETS.logo),
        loadCertificateImage(CERTIFICATE_ASSETS.signature),
      ]).then(([logo, signature]) => ({ logo, signature }));
    }

    return certificateAssetsPromise;
  }

  function certificateAccent(level) {
    const normalized = level.normalize("NFD").replace(/\p{Mark}/gu, "").toLocaleLowerCase("pt-BR");
    const accents = [
      ["amarel", "#f5c518", "#111111"],
      ["laranj", "#ed7626", "#ffffff"],
      ["azul", "#2159a8", "#ffffff"],
      ["verde", "#27784a", "#ffffff"],
      ["roxa", "#6b3f99", "#ffffff"],
      ["roxo", "#6b3f99", "#ffffff"],
      ["marrom", "#6b4130", "#ffffff"],
      ["preta", "#111111", "#ffffff"],
      ["preto", "#111111", "#ffffff"],
      ["branca", "#f1eee8", "#111111"],
      ["branco", "#f1eee8", "#111111"],
      ["vermelh", "#d71920", "#ffffff"],
      ["cinza", "#777b80", "#ffffff"],
    ];
    const match = accents.find(([keyword]) => normalized.includes(keyword));
    return match ? { background: match[1], foreground: match[2] } : { background: "#e21a22", foreground: "#ffffff" };
  }

  function setFittedFont(context, text, maxWidth, startSize, minimumSize, weight, family) {
    let size = startSize;
    do {
      context.font = `${weight} ${size}px ${family}`;
      if (context.measureText(text).width <= maxWidth) return size;
      size -= 2;
    } while (size >= minimumSize);
    return minimumSize;
  }

  function drawCertificateBackground(context) {
    const gradient = context.createLinearGradient(420, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
    gradient.addColorStop(0, "#f8f5ef");
    gradient.addColorStop(1, "#ece7de");
    context.fillStyle = gradient;
    context.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

    context.fillStyle = "#121416";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(620, 0);
    context.lineTo(405, CERTIFICATE_HEIGHT);
    context.lineTo(0, CERTIFICATE_HEIGHT);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 2;
    for (let offset = -380; offset < 420; offset += 48) {
      context.beginPath();
      context.moveTo(offset, CERTIFICATE_HEIGHT);
      context.lineTo(offset + 500, CERTIFICATE_HEIGHT - 500);
      context.stroke();
    }

    context.strokeStyle = "#e21a22";
    context.lineWidth = 18;
    for (let offset = -350; offset < 290; offset += 58) {
      context.beginPath();
      context.moveTo(offset, CERTIFICATE_HEIGHT + 10);
      context.lineTo(offset + 350, CERTIFICATE_HEIGHT - 340);
      context.stroke();
    }

    context.strokeStyle = "#d8d2c8";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(638, 42);
    context.lineTo(CERTIFICATE_WIDTH - 42, 42);
    context.lineTo(CERTIFICATE_WIDTH - 42, CERTIFICATE_HEIGHT - 42);
    context.lineTo(420, CERTIFICATE_HEIGHT - 42);
    context.stroke();
  }

  function drawCertificateRibbon(context, graduation) {
    const accent = certificateAccent(graduation.level);
    const label = graduation.level.toLocaleUpperCase("pt-BR");

    context.save();
    context.translate(CERTIFICATE_WIDTH - 260, 220);
    context.rotate(Math.PI / 4);
    context.fillStyle = accent.background;
    context.fillRect(-370, -75, 740, 150);
    context.strokeStyle = graduation.level.toLocaleLowerCase("pt-BR").includes("branc") ? "#aaa49a" : accent.background;
    context.lineWidth = 3;
    context.strokeRect(-370, -75, 740, 150);
    context.fillStyle = accent.foreground;
    context.textAlign = "center";
    context.textBaseline = "middle";
    setFittedFont(context, label, 610, 50, 30, 700, '"Archivo", Arial, sans-serif');
    context.fillText(label, 0, 0);
    context.restore();
  }

  function drawCertificateSignature(context, signature) {
    const sourceX = 18;
    const sourceY = 260;
    const sourceWidth = signature.naturalWidth - 36;
    const sourceHeight = Math.min(545, signature.naturalHeight - sourceY);
    context.drawImage(signature, sourceX, sourceY, sourceWidth, sourceHeight, 900, 1065, 740, 286);
  }

  async function createCertificateCanvas(student, graduation) {
    const [{ logo, signature }] = await Promise.all([
      getCertificateAssets(),
      document.fonts?.ready || Promise.resolve(),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = CERTIFICATE_WIDTH;
    canvas.height = CERTIFICATE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");

    drawCertificateBackground(context);
    context.drawImage(logo, 86, 210, 360, 360);

    context.fillStyle = "#f5f1e9";
    context.textAlign = "center";
    context.font = '700 34px "JetBrains Mono", monospace';
    context.fillText("ESCOLA DE COMBATE", 258, 650);
    context.font = '500 25px "Archivo", Arial, sans-serif';
    context.fillText("VINICIUS OLIVEIRA", 258, 698);

    drawCertificateRibbon(context, graduation);

    const contentLeft = 655;
    const contentWidth = 1180;
    context.textAlign = "left";
    context.fillStyle = "#171717";
    context.font = '700 45px "JetBrains Mono", monospace';
    context.fillText("CERTIFICADO DE", contentLeft, 215);
    context.font = '400 106px "Archivo Black", Arial, sans-serif';
    context.fillText("GRADUAÇÃO", contentLeft, 335);

    const modality = graduation.modality.toLocaleUpperCase("pt-BR");
    context.fillStyle = "#e21a22";
    setFittedFont(context, modality, 960, 52, 32, 700, '"Archivo", Arial, sans-serif');
    context.fillText(modality, contentLeft, 430);

    context.fillStyle = "#e21a22";
    context.fillRect(contentLeft, 515, 154, 8);

    context.fillStyle = "#111111";
    setFittedFont(context, student.name, contentWidth, 77, 43, 700, '"Archivo", Arial, sans-serif');
    context.fillText(student.name, contentLeft, 635);
    context.fillStyle = "#242424";
    context.fillRect(contentLeft, 665, contentWidth, 3);

    context.fillStyle = "#242424";
    context.font = '400 31px "Archivo", Arial, sans-serif';
    context.fillText("Certificamos que a graduação abaixo consta nos registros oficiais", contentLeft, 740);
    context.fillText("da Escola de Combate Vinicius Oliveira.", contentLeft, 785);

    context.fillStyle = "#e21a22";
    const levelLabel = graduation.level.toLocaleUpperCase("pt-BR");
    setFittedFont(context, levelLabel, contentWidth, 55, 36, 700, '"Archivo", Arial, sans-serif');
    context.fillText(levelLabel, contentLeft, 870);

    context.fillStyle = "#242424";
    context.fillRect(contentLeft, 920, 900, 2);
    context.font = '700 27px "Archivo", Arial, sans-serif';
    context.fillText("Escola de Combate Vinicius Oliveira", contentLeft, 970);
    context.font = '400 25px "Archivo", Arial, sans-serif';
    const parsedDate = parseGraduationDate(graduation.date);
    const dateLabel = parsedDate ? dateFormatter.format(parsedDate) : "data de graduação não disponível";
    context.fillText(`João Pessoa · ${dateLabel}`, contentLeft, 1020);

    drawCertificateSignature(context, signature);

    context.fillStyle = "#68635c";
    context.font = '500 18px "JetBrains Mono", monospace';
    context.fillText("REGISTRO PÚBLICO · ECVO.COM.BR/ALUNOS-GRADUADOS", contentLeft, 1380);

    return canvas;
  }

  function certificateFilename(student, graduation) {
    const slug = `${student.name}-${graduation.modality}-${graduation.level}`
      .normalize("NFD")
      .replace(/\p{Mark}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `certificado-ecvo-${slug || "graduacao"}.png`;
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image unavailable"));
      }, "image/png");
    });
  }

  async function downloadCertificate(button, student, graduation) {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Gerando certificado…";
    certificateStatus.textContent = `Gerando o certificado de ${student.name}.`;

    try {
      const canvas = await createCertificateCanvas(student, graduation);
      const blob = await canvasBlob(canvas);
      const downloadUrl = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = downloadUrl;
      download.download = certificateFilename(student, graduation);
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      certificateStatus.textContent = `Certificado de ${student.name} preparado para download.`;
      if (typeof window.gtag === "function") {
        window.gtag("event", "certificate_download", {
          page_path: window.location.pathname,
          cta_position: "graduation_record",
        });
      }
    } catch {
      certificateAssetsPromise = undefined;
      certificateStatus.textContent = "Não foi possível gerar o certificado agora. Tente novamente.";
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = originalLabel;
    }
  }

  function createCertificateButton(student, graduation) {
    const button = document.createElement("button");
    button.className = "graduation-certificate-button";
    button.type = "button";
    button.textContent = "Baixar certificado";
    button.setAttribute(
      "aria-label",
      `Baixar certificado de ${student.name}, ${graduation.level}, ${graduation.modality}, em formato PNG`,
    );
    button.addEventListener("click", () => downloadCertificate(button, student, graduation));
    return button;
  }

  function createGraduationGroup(student, modality, graduations) {
    const group = document.createElement("section");
    group.className = "graduation-group";

    const heading = document.createElement("h3");
    heading.textContent = modality;
    group.append(heading);

    const history = document.createElement("ol");
    history.className = "graduation-history";

    graduations.forEach((graduation, index) => {
      const isLatest = index === graduations.length - 1;
      const item = document.createElement("li");
      item.className = isLatest ? "graduation-record graduation-record--latest" : "graduation-record";

      const marker = document.createElement("span");
      marker.className = "graduation-marker";
      marker.setAttribute("aria-hidden", "true");
      item.append(marker);

      const details = document.createElement("div");
      const level = document.createElement("strong");
      level.textContent = graduation.level;
      details.append(level, createDate(graduation.date));

      if (isLatest) {
        const latest = document.createElement("span");
        latest.className = "graduation-latest-label";
        latest.textContent = "Mais recente";
        details.append(latest);
      }

      details.append(createCertificateButton(student, graduation));

      item.append(details);
      history.append(item);
    });

    group.append(history);
    return group;
  }

  function createStudentCard(student) {
    const card = document.createElement("article");
    card.className = "graduate-card";

    const header = document.createElement("header");
    header.className = "graduate-card-header";
    header.append(createPhoto(student));

    const identity = document.createElement("div");
    identity.className = "graduate-identity";
    const name = document.createElement("h2");
    name.textContent = student.name;
    identity.append(name);

    if (student.athleteId) {
      const athleteId = document.createElement("p");
      athleteId.className = "graduate-athlete-id";
      const label = document.createElement("span");
      label.textContent = "ID do atleta";
      const value = document.createElement("strong");
      value.textContent = student.athleteId;
      athleteId.append(label, value);
      identity.append(athleteId);
    }

    header.append(identity);
    card.append(header);

    const groups = document.createElement("div");
    groups.className = "graduation-groups";
    groupByModality(student.graduations).forEach((graduations, modality) => {
      groups.append(createGraduationGroup(student, modality, graduations));
    });
    card.append(groups);

    return card;
  }

  function setState(state) {
    directory.setAttribute("aria-busy", state === "loading" ? "true" : "false");
    loading.hidden = state !== "loading";
    list.hidden = state !== "success";
    empty.hidden = state !== "empty";
    error.hidden = state !== "error";
  }

  function updateCount(total) {
    const label = total === 1 ? "aluno com graduação registrada" : "alunos com graduação registrada";
    count.textContent = `Nesta consulta: ${total} ${label}.`;
  }

  async function loadStudents() {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    list.replaceChildren();
    count.textContent = "Consultando os registros atuais…";
    setState("loading");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Request failed");
      const payload = await response.json();
      if (
        !payload
        || typeof payload !== "object"
        || !Number.isInteger(payload.total)
        || payload.total < 0
        || !Array.isArray(payload.alunos)
      ) {
        throw new Error("Unexpected response");
      }

      const students = payload.alunos.map(normalizeStudent).filter(Boolean);
      if (payload.alunos.length > 0 && students.length === 0) {
        throw new Error("No valid records");
      }
      if (controller !== activeController) return;

      const fragment = document.createDocumentFragment();
      students.forEach((student) => fragment.append(createStudentCard(student)));
      list.replaceChildren(fragment);
      updateCount(students.length);
      setState(students.length ? "success" : "empty");
    } catch {
      if (controller !== activeController) return;
      count.textContent = "Quantidade indisponível no momento.";
      setState("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  retry.addEventListener("click", () => {
    loadStudents();
    loading.focus();
  });

  loadStudents();
})();
