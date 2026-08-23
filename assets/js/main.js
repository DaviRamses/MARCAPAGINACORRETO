/*
 * main.js — comportamentos da pagina.
 *
 * A pagina original era um app React (Lovable). Este clone e HTML estatico,
 * entao as poucas partes que dependiam de JavaScript foram reescritas aqui
 * em JS puro, sem nenhuma dependencia. Cada bloco e independente:
 * pode editar ou remover um sem quebrar os outros.
 */

/* ------------------------------------------------------------------ *
 * RASTREAMENTO
 * ------------------------------------------------------------------ *
 * Nao ha nenhum codigo de rastreamento neste arquivo, de proposito.
 * Quem rastreia e o pixel da UTMify, carregado no <head> do index.html.
 * Ele dispara sozinho:
 *   PageView         ao carregar a pagina
 *   ViewContent      ao rolar mais de 100px, ou apos 8 segundos
 *   InitiateCheckout ao clicar em link cujo endereco contenha "checkout"
 *
 * Por isso NAO adicione fbq('track', ...) aqui: os eventos sairiam
 * duplicados. O pixel antigo do site de origem foi removido.
 */

/* ------------------------------------------------------------------ *
 * 1. Barra do topo: data de hoje + contador ate o fim do dia
 * ------------------------------------------------------------------ */

(function () {
  var hoje = document.querySelector('[data-today]');
  if (hoje) {
    hoje.textContent = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  var alvo = document.querySelector('[data-countdown]');
  if (!alvo) return;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    var agora = new Date();
    var fimDoDia = new Date(agora);
    fimDoDia.setHours(23, 59, 59, 999);

    var restante = fimDoDia.getTime() - agora.getTime();
    var h = Math.floor(restante / 3600000);
    var m = Math.floor((restante % 3600000) / 60000);
    var s = Math.floor((restante % 60000) / 1000);

    alvo.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ------------------------------------------------------------------ *
 * 2. Acordeao do FAQ
 * ------------------------------------------------------------------ *
 * Um item aberto por vez; clicar no item aberto fecha todos.
 * As perguntas e respostas ficam no proprio index.html — para editar,
 * mexa la, nao aqui.
 */

(function () {
  var faq = document.querySelector('[data-faq]');
  if (!faq) return;

  var MINUS = '<path d="M5 12h14"></path>';
  var PLUS = '<path d="M5 12h14"></path><path d="M12 5v14"></path>';

  faq.addEventListener('click', function (ev) {
    var botao = ev.target.closest('button');
    if (!botao || !faq.contains(botao)) return;

    var vaiAbrir = botao.getAttribute('aria-expanded') !== 'true';

    // fecha todos
    faq.querySelectorAll('button[aria-controls]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).hidden = true;

      var svg = b.querySelector('[data-faq-icon] svg');
      svg.innerHTML = PLUS;
      svg.classList.remove('lucide-minus');
      svg.classList.add('lucide-plus');
    });

    // reabre o clicado, se for o caso
    if (vaiAbrir) {
      botao.setAttribute('aria-expanded', 'true');
      document.getElementById(botao.getAttribute('aria-controls')).hidden = false;

      var svgAtivo = botao.querySelector('[data-faq-icon] svg');
      svgAtivo.innerHTML = MINUS;
      svgAtivo.classList.remove('lucide-plus');
      svgAtivo.classList.add('lucide-minus');
    }
  });
})();

/* ------------------------------------------------------------------ *
 * 3. Modal de upsell
 * ------------------------------------------------------------------ *
 * O markup esta no fim do index.html.
 *
 * Abre com qualquer elemento marcado com data-upsell-trigger no HTML.
 * Hoje quem tem essa marca e o botao "Quero o pacote basico".
 *
 * IMPORTANTE — esse gatilho precisa ser um <button>, nunca um <a> com
 * href de checkout. O pixel da UTMify monitora todos os <a> cujo endereco
 * pareca um checkout: ele intercepta o clique, chama stopPropagation()
 * (o que ja impediria o listener abaixo de rodar) e depois forca a
 * navegacao com window.location.href, abrindo o checkout e matando o
 * modal. A UTMify ainda registra o listener duas vezes no mesmo link,
 * entao nem o onclick inline escapa: a segunda passagem le o onclick ja
 * zerado pela primeira e navega assim mesmo.
 *
 * Sendo <button>, a UTMify nao monitora o elemento e nada disso acontece.
 *
 * Para tirar o upsell, apague data-upsell-trigger do HTML.
 */

var openUpsell, closeUpsell;

(function () {
  var modal = document.getElementById('upsell');
  if (!modal) return;

  var ultimoFoco = null;

  // A lista "O que vem no Pacote Completo" e um <details open>: fica aberta
  // por padrao, inclusive se este script nao rodar. No celular ela sozinha
  // ocupa 300px e faria o modal passar da altura da tela, entao recolhe.
  // O limite 640px e o mesmo do @media que encolhe a arte no styles.css.
  function ajustaLista() {
    var lista = modal.querySelector('.upsell-lista');
    if (lista) lista.open = window.innerWidth >= 640;
  }

  openUpsell = function () {
    if (!modal.hidden) return; // ja esta aberto, nao faz nada
    ultimoFoco = document.activeElement;
    ajustaLista();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var fechar = modal.querySelector('[data-upsell-close]');
    if (fechar) fechar.focus();
  };

  closeUpsell = function () {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    // devolve o foco para o botao que abriu o modal
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
    ultimoFoco = null;
  };

  // fecha ao clicar no fundo escuro, mas nao dentro do cartao
  modal.addEventListener('click', function (ev) {
    if (!ev.target.closest('[data-upsell-panel]')) closeUpsell();
  });

  modal.querySelector('[data-upsell-close]').addEventListener('click', closeUpsell);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !modal.hidden) closeUpsell();
  });

  // --- GATILHO: links marcados com data-upsell-trigger ---
  // Um unico listener no documento cobre qualquer botao com a marca,
  // inclusive os que forem adicionados depois.
  document.addEventListener('click', function (ev) {
    var gatilho = ev.target.closest('[data-upsell-trigger]');
    if (!gatilho) return;

    // Nao sequestra ctrl+clique, clique do meio nem "abrir em nova aba":
    // nesses casos o visitante quer mesmo ir direto ao checkout.
    if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;

    ev.preventDefault();
    openUpsell();
  });
})();

