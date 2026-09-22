// WhatsApp is the only collection channel. Selection alone never stores or sends data.
const yogaLink = document.querySelector("#yoga-whatsapp");
const yogaPeriod = document.querySelector("#yoga-period");
const yogaExperience = document.querySelector("#yoga-experience");

if (yogaLink && yogaPeriod && yogaExperience) {
  const updateMessage = () => {
    const details = [];
    if (yogaPeriod.value) details.push(`Período preferido: ${yogaPeriod.value}.`);
    if (yogaExperience.value) details.push(`Experiência: ${yogaExperience.value}.`);
    const message = [yogaLink.dataset.baseMessage, ...details].join("\n");
    yogaLink.href = `https://wa.me/${yogaLink.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  yogaPeriod.addEventListener("change", updateMessage);
  yogaExperience.addEventListener("change", updateMessage);
}
