(() => {
  "use strict";

  const API_URL = "https://app.ecvo.com.br/api/publico/alunos-graduados";
  const REQUEST_TIMEOUT_MS = 12000;
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

  if (!count || !directory || !loading || !list || !empty || !error || !retry) return;

  let activeController;

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

  function createDate(value) {
    const parsedDate = value ? new Date(value) : null;

    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
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

  function createGraduationGroup(modality, graduations) {
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
      groups.append(createGraduationGroup(modality, graduations));
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
