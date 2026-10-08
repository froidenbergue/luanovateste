(function () {
  const C = CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wa = (num, msg = C.contato.mensagemPadrao) => `https://wa.me/55${num}?text=${encodeURIComponent(msg)}`;
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    n.innerHTML = html;
    return n;
  };

  /* Links gerais */
  $$("[data-grupo]").forEach((a) => (a.href = C.contato.grupoPromocoes));
  $$("[data-grupo-loja]").forEach((a) => (a.href = C.contato.grupoLoja));
  $$("[data-maps]").forEach((a) => (a.href = C.links.maps));
  $$("[data-rede]").forEach((a) => (a.href = C.redes[a.dataset.rede]));

  /* Marcas: faixas contínuas em sentidos opostos (4 no celular, 3 no desktop). Só as logos aparecem; o nome fica no alt. */
  const marquee = $("#marquee");
  const num = $("#marcas-num");
  if (num) num.textContent = C.marcas.length;
  const itemMarca = (m) => el("li", { class: "marca" }, `<img src="${m.img}" alt="Logo da marca ${m.nome}" width="132" height="132" loading="lazy" decoding="async">`);
  const montarFaixas = () => {
    const celular = window.innerWidth < 820;
    const linhas = celular ? 4 : 3;
    const velocidade = celular ? 52 : 64; // px por segundo (20% mais lento que antes: 65 e 80)
    marquee.innerHTML = "";
    for (let r = 0; r < linhas; r++) {
      const row = el("div", { class: "marquee__row" + (r % 2 ? " marquee__row--rev" : "") });
      const ul = el("ul", { class: "marquee__track" });
      row.appendChild(ul);
      marquee.appendChild(row);
      C.marcas.filter((_, i) => i % linhas === r).forEach((m) => ul.appendChild(itemMarca(m)));
      const originais = [...ul.children];
      const conjunto = ul.getBoundingClientRect().width;
      const k = Math.max(1, Math.ceil(window.innerWidth / conjunto));
      const clonar = () => originais.forEach((li) => { const c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); ul.appendChild(c); });
      for (let i = 1; i < k; i++) clonar();
      [...ul.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); ul.appendChild(c); });
      ul.style.setProperty("--dur", ((conjunto * k) / velocidade).toFixed(1) + "s");
    }
  };
  montarFaixas();
  let larguraAtual = window.innerWidth, timerFaixas;
  window.addEventListener("resize", () => {
    if (window.innerWidth === larguraAtual) return;
    larguraAtual = window.innerWidth;
    clearTimeout(timerFaixas);
    timerFaixas = setTimeout(montarFaixas, 250);
  });

  /* Equipe */
  const avatar = (p) => `<span class="pessoa__avatar" role="img" aria-label="${p.nome}, ${p.cargo}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.2" r="4"></circle><path d="M4 21c0-4.4 3.6-7.4 8-7.4s8 3 8 7.4"></path></svg></span>`;
  const equipe = $("#equipe");
  C.equipe.forEach((p) => {
    const li = el("li");
    li.innerHTML = `<a class="pessoa" href="${wa(p.whatsapp)}" target="_blank" rel="noopener" aria-label="Falar com ${p.nome} (${p.cargo}) no WhatsApp">
      ${p.foto ? `<img src="${p.foto}" alt="${p.nome}, ${p.cargo}" loading="lazy">` : avatar(p)}
      <span class="pessoa__info"><strong>${p.nome}</strong><span>${p.cargo}</span><em>Chamar no WhatsApp</em></span></a>`;
    equipe.appendChild(li);
  });
  const cardGrupo = (titulo, texto, url) => `<div class="grupo"><img src="assets/images/logo.jpg" alt="" width="64" height="64" loading="lazy">
     <div><h3>${titulo}</h3><p>${texto}</p></div>
     <a class="btn" href="${url}" target="_blank" rel="noopener" aria-label="Entrar no ${titulo.toLowerCase()}">Entrar no grupo</a></div>`;
  equipe.insertAdjacentElement("afterend", el("div", { class: "grupos" },
    cardGrupo("Grupo da loja", "Entre no grupo da loja e fique por dentro das novidades da Lua Nova.", C.contato.grupoLoja) +
    cardGrupo("Grupo de promoções", "Entre no grupo do WhatsApp da loja e acompanhe as promoções.", C.contato.grupoPromocoes)));

  /* Endereço, horários, mapa e rodapé */
  const e = C.endereco;
  $("#endereco").innerHTML = `${e.rua}<br>${e.bairro}, ${e.cidade}/${e.estado}<br>CEP ${e.cep}`;
  $("#rodape-end").textContent = `${e.rua}, ${e.bairro}, ${e.cidade}/${e.estado}`;
  $("#mapa").src = "https://maps.google.com/maps?output=embed&q=" + encodeURIComponent(`${e.rua}, ${e.cidade} ${e.estado}, ${e.cep}`);
  $("#copy").textContent = `© ${new Date().getFullYear()} ${C.empresa.nome}. Todos os direitos reservados.`;

  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const hoje = agora.getDay();
  const min = agora.getHours() * 60 + agora.getMinutes();
  const toMin = (h) => { const [a, b] = h.split(":"); return +a * 60 + +b; };
  let aberto = false;
  const dl = $("#horarios");
  C.horarios.forEach((h) => {
    const ehHoje = h.dias.includes(hoje);
    if (ehHoje) aberto = h.turnos.some(([a, b]) => min >= toMin(a) && min < toMin(b));
    dl.appendChild(el("div", ehHoje ? { class: "hoje" } : {}, `<dt>${h.rotulo}</dt><dd>${h.texto}</dd>`));
  });
  $("#status").appendChild(el("span", { class: "pill " + (aberto ? "pill--on" : "pill--off") }, aberto ? "Aberto agora" : "Fechado no momento"));


  /* Menu de atendentes do WhatsApp */
  const whatsappMenu = $("#whatsapp-menu");
  const whatsappFab = $("#whatsapp-fab");
  const whatsappHeader = $("[data-whatsapp-menu]");

  const montarMenuWhatsApp = (msg = C.contato.mensagemPadrao) => {
    if (!whatsappMenu) return;
    whatsappMenu.innerHTML = `<div class="whatsapp-menu__title">Fale com uma de nossas atendentes</div>`;
    C.equipe.forEach((p) => {
      const a = el("a", { href: wa(p.whatsapp, msg), target: "_blank", rel: "noopener", "aria-label": `Falar com ${p.nome} no WhatsApp` },
        `<span class="whatsapp-menu__icon">WA</span><span><span class="whatsapp-menu__name">${p.nome}</span><span class="whatsapp-menu__role">${p.cargo}</span></span>`);
      whatsappMenu.appendChild(a);
    });
  };

  const alternarWhatsApp = () => {
    if (!whatsappMenu) return;
    const abrir = !whatsappMenu.classList.contains("open");
    if (abrir) montarMenuWhatsApp();
    whatsappMenu.classList.toggle("open", abrir);
    whatsappMenu.setAttribute("aria-hidden", String(!abrir));
    if (whatsappFab) whatsappFab.setAttribute("aria-expanded", String(abrir));
  };

  montarMenuWhatsApp();
  whatsappFab?.addEventListener("click", alternarWhatsApp);
  whatsappHeader?.addEventListener("click", (ev) => { ev.preventDefault(); alternarWhatsApp(); });
  $$("[data-whatsapp-condicional]").forEach((b) => b.addEventListener("click", (ev) => {
    ev.preventDefault();
    montarMenuWhatsApp(C.contato.mensagemCondicional);
    whatsappMenu?.classList.add("open");
    whatsappMenu?.setAttribute("aria-hidden", "false");
    whatsappFab?.setAttribute("aria-expanded", "true");
  }));
  document.addEventListener("click", (ev) => {
    if (whatsappMenu?.classList.contains("open") && !ev.target.closest(".whatsapp-fab-wrap") && !ev.target.closest("[data-whatsapp-menu]") && !ev.target.closest("[data-whatsapp-condicional]")) {
      whatsappMenu.classList.remove("open");
      whatsappMenu.setAttribute("aria-hidden", "true");
      whatsappFab?.setAttribute("aria-expanded", "false");
    }
  });

  /* Menu mobile */
  const burger = $("#burger"), menu = $("#menu");
  const fechar = () => { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu"); };
  burger.addEventListener("click", () => {
    const abrir = !menu.classList.contains("open");
    menu.classList.toggle("open", abrir);
    burger.setAttribute("aria-expanded", String(abrir));
    burger.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", fechar));
  document.addEventListener("keydown", (ev) => ev.key === "Escape" && fechar());
})();
