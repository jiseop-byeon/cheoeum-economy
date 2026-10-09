const KEY = "cheoeum-v1";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.lessons) && Array.isArray(s.known)) return s;
  } catch (_) {}
  return { lessons: [], known: [] };
}
function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function glossLine(t, tag) {
  const bits = [];
  if (t.hanja) bits.push(esc(t.hanja));
  if (t.en) bits.push("(" + esc(t.en) + ")");
  if (!bits.length) return "";
  const name = tag || "p";
  return `<${name} class="gloss">${bits.join(" ")}</${name}>`;
}

const terms = () => window.TERMS || [];
const tracks = () => window.TRACKS || [];

const PATH = [
  { id: "map", phase: "생활", why: "뉴스를 사람 이름이 아니라 가계, 기업, 정부, 외국으로 읽습니다. 국내총생산은 그 주고받음을 한 줄로 모은 것이고, 매출을 그냥 더하면 같은 밀가루가 두 번 들어가는 이유까지 계산합니다." },
  { id: "prices", phase: "생활", why: "합계가 커진 것이 물건이 늘어선 것인지, 값만 오른 것인지를 가릅니다. 밥·월세·교통의 가중평균으로 물가 3.5%를 직접 만들고, 월급이 3% 오를 때 살 수 있는 양이 왜 줄어드는지도 나눕니다." },
  { id: "jobs", phase: "생활", why: "그 생산을 누가 하는지가 일자리입니다. 구직을 포기하면 실업률 분모에서 빠져 숫자가 좋아 보이는 함정을, 1,000명으로 계산합니다. 고용률과 구인배수를 같이 읽는 이유까지 갑니다." },
  { id: "household", phase: "생활", why: "월급에서 세금과 갚을 돈을 빼야 쓸 수 있는 돈이 나옵니다. DSR과 DTI가 다른 숫자인 이유, 스트레스 DSR이 이자에 더하는 제도가 아닌 이유를 구분합니다. 이자가 복리로 불어나는 식은 다음 강의입니다." },
  { id: "rates", phase: "돈의 값", why: "빚과 예금의 값이 금리입니다. 1,000만 원을 연 5%로 10년 맡기면 복리가 16,288,946원인 이유, 물가 3%를 뺀 실질금리가 왜 1%포인트와 다른지를 계산합니다. 대출 금리의 기준칸인 코픽스와 KOFR의 이름도 여기서 붙입니다." },
  { id: "banks", phase: "돈의 값", why: "그 금리를 주고받는 곳이 은행입니다. 짧은 예금으로 긴 대출을 만드는 틈, 2025년 9월 1일부터인 예금보험 1억 원의 경계, 자기자본비율의 나눗셈, 결제가 확정되는 순간까지 갑니다." },
  { id: "policy", phase: "돈의 값", why: "은행끼리 하루짜리 돈을 빌리는 금리를 한국은행이 옮깁니다. 기준금리 위아래 0.50%포인트 복도, 2026년 8월 27일의 결정, 테일러 준칙의 예시 계산을 넣습니다. 그 준칙은 한국은행의 실제 공식이 아닙니다." },
  { id: "cycle", phase: "나라와 세계", why: "물가, 일자리, 금리가 같이 늘었다 줄었다 하는 것이 경기입니다. 명목 성장과 실질 성장의 나눗셈, 선행지수와 동행지수, 기저효과를 구분합니다." },
  { id: "fiscal", phase: "나라와 세계", why: "정부가 걷고 쓰는 살림입니다. 적자는 한 해의 흐름이고 국가채무는 쌓인 자리입니다. 채무 비율의 분자와 분모가 따로 움직이는 것을 계산으로 봅니다." },
  { id: "fx", phase: "나라와 세계", why: "외국과 거래하면 환율이 붙습니다. 100달러가 1,300원과 1,400원에서 얼마인지, 숫자가 커지면 누가 이득인지, 삼불원칙과 J커브까지 읽습니다." },
  { id: "bonds", phase: "시장", why: "금리의 가격표가 채권입니다. 1년 뒤 10,000원의 오늘 가격이 금리 5%와 4%에서 9,524원, 9,615원이 되는 계산과, 듀레이션이 그 가격을 얼마나 흔드는지를 봅니다." },
  { id: "stocks", phase: "시장", why: "채권이 약속이라면 주식은 이익의 몫입니다. 같은 주가로 PER, PBR, 배당수익률을 계산하고, 그 배수가 사고팔라는 신호가 아닌 이유를 적습니다." },
  { id: "housing", phase: "시장", why: "집은 사는 곳이고 가장 큰 대출이 붙는 자산입니다. LTV에 보증금이 더해지는 이유, 전세로 집값 −10%가 집주인 돈 −50%가 되는 계산, 역전세와 깡통전세의 차이를 구분합니다." },
  { id: "crypto", phase: "시장", why: "예금, 주식, 코인은 발행하는 주체와 보호가 다릅니다. 비트코인, 스테이블코인, 중앙은행 디지털화폐, 예금토큰, 프로젝트 한강을 가르고, 가상자산이 예금보험 밖인 이유를 남깁니다." },
  { id: "desk", phase: "읽는 법", why: "여기까지 온 단어로 발표 한 장을 읽습니다. 전년과 전월이 같은 달에 동시에 참일 수 있는 이유, 이 사이트를 만든 날 옮겨 적은 공표 세 줄, FedWatch가 연준의 공식 전망이 아닌 이유를 적습니다." },
  { id: "frame", phase: "읽는 법", why: "상품 이름 앞에 네 칸을 둡니다. 기대하는 수익, 잃을 수 있는 폭, 현금이 되는 속도, 돈이 묶이는 시간입니다. 빌린 돈이 있을 때 자산 −10%가 내 돈 −50%가 되는 식을 다시 계산합니다. 종목은 고르지 않습니다." }
];

const PHASE_LINE = {
  "생활": "누가 만들고, 값이 무엇이며, 월급과 빚이 어떻게 남는지.",
  "돈의 값": "금리에서 은행을 거쳐 한국은행까지. 하루짜리 금리가 대출로 번집니다.",
  "나라와 세계": "경기, 정부 살림, 환율. 나라 단위의 문장을 읽습니다.",
  "시장": "채권, 주식, 집, 가상자산. 가격이 생기는 방식과 레버리지.",
  "읽는 법": "발표를 읽는 순서와, 돈을 넣기 전의 네 칸."
};

function lessons() {
  const by = new Map((window.LESSONS || []).map((l) => [l.id, l]));
  return PATH.map((step, i) => {
    const src = by.get(step.id);
    if (!src) return null;
    return Object.assign({}, src, {
      no: String(i + 1).padStart(2, "0"),
      phase: step.phase,
      why: step.why
    });
  }).filter(Boolean);
}
const trackName = (id) => tracks().find((t) => t.id === id)?.name || id;
const byId = (id) => terms().find((t) => t.id === id);
const byTitle = (title) => terms().find((t) => t.title === title);

function normTitle(s) {
  return String(s ?? "").normalize("NFKC").replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2060\uFEFF]/g, "").replace(/\s+/g, "").toLowerCase();
}

function byRelated(name) {
  const n = normTitle(name);
  if (!n) return null;
  const all = terms();
  const exact = all.filter((t) => normTitle(t.title) === n);
  if (exact.length === 1) return exact[0];
  const hits = all.filter((t) => {
    const tk = normTitle(t.title);
    if (!tk) return false;
    if (t.title.split("/").map(normTitle).includes(n)) return true;
    if (tk.startsWith(n) && /^[(/]/.test(tk.slice(n.length))) return true;
    if (n.startsWith(tk) && tk.length >= 4 && /^[(/]/.test(n.slice(tk.length))) return true;
    return false;
  });
  const ids = [...new Set(hits.map((h) => h.id))];
  return ids.length === 1 ? hits[0] : null;
}

function lessonForTerm(t) {
  const all = lessons();
  const byCore = all.find((l) => (l.core || []).includes(t.title));
  if (byCore) return byCore;
  const same = all.filter((l) => l.track === t.track);
  if (!same.length) return null;
  return same.find((l) => l.id === t.track) || same[same.length - 1];
}

function parse() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  return { name: parts[0] || "home", arg: parts[1] ? decodeURIComponent(parts[1]) : "" };
}

function setNav(name) {
  const map = { home: "#/", learn: "#/learn", lesson: "#/learn", terms: "#/terms", term: "#/terms", review: "#/review", sources: "#/sources" };
  document.querySelectorAll(".nav a").forEach((a) => {
    a.setAttribute("aria-current", a.getAttribute("href") === map[name] ? "page" : "false");
  });
}

function home() {
  const s = load();
  const next = lessons().find((l) => !s.lessons.includes(l.id)) || lessons()[0];
  const known = s.known.length;
  const total = terms().length;
  return `
    <section class="hero">
      <p class="kicker">정책과 시장을 읽기 위한 기초</p>
      <h1>경제를 처음 보는 사람을 위한 강의.</h1>
      <p class="dek">월급과 물가에서 시작합니다. 금리와 은행, 한국은행으로 올라간 뒤 경기와 재정, 환율을 지나고, 그다음에 채권, 주식, 집, 가상자산을 읽습니다. 계산은 빼지 않습니다. 용어 787개는 강의 옆의 카드입니다.</p>
      <figure class="atlas">
        <p class="kicker">한 장의 지도</p>
        <h2>네 곳이 주고받고, 그 값에 이름이 붙습니다.</h2>
        <div class="atlas-board">
          <a class="place foreign" href="#/lesson/fx">
            <span class="place-k">외국</span>
            <span>우리 물건을 사 가거나, 우리에게 팝니다.</span>
          </a>
          <p class="flow">수출은 나가고 수입은 들어옵니다. 바꿀 때의 값이 환율입니다.</p>
          <a class="place home" href="#/lesson/household">
            <span class="place-k">가계<i class="han">家計</i></span>
            <span>일하고, 벌고, 씁니다.</span>
          </a>
          <div class="exchange">
            <span>일 →</span>
            <span>← 임금</span>
            <span>← 상품</span>
          </div>
          <a class="place firm" href="#/lesson/map">
            <span class="place-k">기업<i class="han">企業</i></span>
            <span>사람을 쓰고, 물건을 만듭니다.</span>
          </a>
          <p class="flow">세금은 정부로 가고, 정부 지출은 다시 가계와 기업으로 옵니다.</p>
          <a class="place gov" href="#/lesson/fiscal">
            <span class="place-k">정부</span>
            <span>걷어서 쓰고, 모자라면 빚을 집니다.</span>
          </a>
          <div class="atlas-core">
            <a href="#/lesson/prices"><b>물가<i class="han">物價</i></b><span>상품의 값</span></a>
            <a href="#/lesson/rates"><b>금리<i class="han">金利</i></b><span>돈의 시간값</span></a>
            <a href="#/lesson/fx"><b>환율<i class="han">換率</i></b><span>외국과 바꿀 때의 값</span></a>
          </div>
          <div class="atlas-floor">
            <a href="#/lesson/banks"><b>금융<i class="han">金融</i></b><span>쓰고 남은 돈은 은행, 채권, 주식, 집으로 갑니다.</span></a>
            <a href="#/lesson/policy"><b>한국은행<i class="han">韓國銀行</i></b><span>은행끼리 하루짜리 돈을 빌리는 금리를 옮깁니다.</span></a>
          </div>
        </div>
        <p class="atlas-read">뉴스는 이 가운데 한 줄이 커지거나 막힌 이야기입니다. 칸을 누르면 그 강의로 갑니다.</p>
      </figure>
      <p class="kicker">이 지도를 읽는 순서</p>
      <ol class="path">
        ${Object.entries(PHASE_LINE).map(([name, line]) => `<li><strong>${esc(name)}</strong><span>${esc(line)}</span></li>`).join("")}
      </ol>
      <div class="row">
        <a class="btn" href="#/lesson/${esc(next.id)}">${s.lessons.length ? "이어서" : "1강부터"} · ${esc(next.title)}</a>
        <a class="btn-quiet" href="#/learn">강의 전체</a>
      </div>
      <p class="meta">${known} / ${total}개 용어를 알았다고 표시했습니다. 표시는 이 브라우저에만 남습니다.</p>
    </section>
    <div class="grid">
      <a class="card" href="#/learn"><span class="no">강의</span><h3>숫자로 한 번 계산합니다</h3><p>각 강의에 검산된 예시와, 숫자 하나만 바꾼 확인 문제가 있습니다.</p></a>
      <a class="card" href="#/terms"><span class="no">용어 787</span><h3>뉴스에 나오는 말을 찾습니다</h3><p>범위는 한국은행 『경제금융용어 800선』(2026)의 표제어입니다. 문장은 그 책의 해설이 아닙니다.</p></a>
      <a class="card" href="#/sources"><span class="no">출처</span><h3>숫자는 기관 페이지에서 봅니다</h3><p>한국은행, 통계청, 기재부, 금융위원회, 예금보험공사, 연준, IMF, OECD, BIS.</p></a>
    </div>
    <section class="note">
      <p class="note-kicker">이 사이트가 하지 않는 일</p>
      <p>종목을 고르거나 지금 사라고 말하지 않습니다. 대출 한도의 실제 산식, 세금, 상품 약관은 해당 기관과 금융회사의 최신 자료를 따릅니다. 여기의 계산은 개념을 보기 위한 식입니다.</p>
    </section>`;
}

function phasesHtml(s) {
  const groups = [];
  lessons().forEach((l) => {
    const last = groups[groups.length - 1];
    if (!last || last.name !== l.phase) groups.push({ name: l.phase, items: [l] });
    else last.items.push(l);
  });
  return groups.map((g) => `
    <section class="phase-head">
      <h2>${esc(g.name)}</h2>
      <p>${esc(PHASE_LINE[g.name] || "")}</p>
    </section>
    <div class="grid">${g.items.map((l) => `
      <a class="card" href="#/lesson/${esc(l.id)}">
        <span class="no">${esc(l.no)} · ${l.minutes}분${s && s.lessons.includes(l.id) ? " · 읽음" : ""}</span>
        <h3>${esc(l.title)}</h3>
        <p>${esc(l.dek)}</p>
      </a>`).join("")}</div>`).join("");
}

function learn() {
  const s = load();
  const done = s.lessons.length;
  const all = lessons().length;
  const pct = all ? Math.round(done / all * 100) : 0;
  return `
    <p class="kicker">강의</p>
    <h1>순서대로 읽으면 뉴스의 문장이 갈라집니다.</h1>
    <p class="dek">앞 강의의 단어를 다음 강의가 다시 씁니다. 순서는 생활, 돈의 값, 나라와 세계, 시장, 읽는 법입니다. ${done}/${all}강을 읽음으로 표시했습니다.</p>
    <div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
    ${phasesHtml(s)}`;
}

function lessonView(id) {
  const l = lessons().find((x) => x.id === id);
  if (!l) return `<h1>강의를 찾지 못했습니다.</h1>`;
  const s = load();
  const idx = lessons().findIndex((x) => x.id === id);
  const prev = lessons()[idx - 1];
  const next = lessons()[idx + 1];
  const cores = (l.core || []).map((title) => {
    const t = byTitle(title);
    return t ? `<a class="chip" href="#/term/${esc(t.id)}">${esc(t.title)}</a>` : "";
  }).join("");
  const done = s.lessons.includes(l.id);
  return `
    <article class="lesson">
      <p class="kicker">${esc(l.no)} · ${l.minutes}분</p>
      <h1>${esc(l.title)}</h1>
      <p class="dek">${esc(l.dek)}</p>
      ${l.why ? `<p class="bridge"><span class="bridge-kicker">${esc(l.phase)} · 이 자리인 이유</span>${esc(l.why)}</p>` : ""}
      ${l.html}
      ${cores ? `<h2>이 강의의 말</h2><div class="chips">${cores}</div><p class="meta"><a href="#/terms/${esc(l.track)}">${esc(trackName(l.track))} 용어 더 보기</a></p>` : ""}
      <div class="row">
        <button class="btn" type="button" id="mark" data-id="${esc(l.id)}">${done ? "읽음 표시를 지우기" : "이 강을 읽음으로 표시"}</button>
      </div>
      <div class="pager">
        ${prev ? `<a href="#/lesson/${esc(prev.id)}">← ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a href="#/lesson/${esc(next.id)}">${esc(next.title)} →</a>` : `<a href="#/terms">용어로</a>`}
      </div>
    </article>`;
}

function termsView(track) {
  const q = track && !tracks().some((t) => t.id === track) ? track : "";
  const active = tracks().some((t) => t.id === track) ? track : "";
  const chips = [`<button class="chip" type="button" data-track="" aria-pressed="${active ? "false" : "true"}">전체</button>`]
    .concat(tracks().map((t) => `<button class="chip" type="button" data-track="${esc(t.id)}" aria-pressed="${t.id === active ? "true" : "false"}">${esc(t.name)}</button>`))
    .join("");
  return `
    <p class="kicker">용어 ${terms().length}</p>
    <h1>말을 찾고, 강의로 돌아갑니다.</h1>
    <p class="dek">표제어는 한국은행 『경제금융용어 800선』(2026)을 따릅니다. 설명은 이 사이트가 처음 공부하는 사람을 위해 다시 쓴 문장입니다. 한자는 뜻이 갈라지는 말에만 달았고, 영어는 뉴스에서 그 이름으로 만날 때 괄호에 넣었습니다.</p>
    <input class="search" id="q" type="search" placeholder="예: DSR, 환율, 기준금리" value="${esc(q)}" aria-label="용어 검색">
    <div class="chips" id="filters">${chips}</div>
    <div class="term-list" id="list"></div>`;
}

function paintTerms(track) {
  const q = (document.getElementById("q")?.value || "").trim().toLowerCase();
  const list = terms().filter((t) => {
    if (track && t.track !== track) return false;
    if (!q) return true;
    return (t.title + " " + (t.hanja || "") + " " + (t.en || "") + t.one + t.body).toLowerCase().includes(q);
  });
  const host = document.getElementById("list");
  if (!host) return;
  host.innerHTML = list.slice(0, 400).map((t) => `
    <a class="term-link" href="#/term/${esc(t.id)}">
      <strong>${esc(t.title)}${glossLine(t, "span")}</strong>
      <span class="tag">${esc(trackName(t.track))}</span>
      <span>${esc(t.one)}</span>
    </a>`).join("") || `<p>해당하는 말이 없습니다.</p>`;
  if (list.length > 400) host.insertAdjacentHTML("beforeend", `<p class="meta">앞 400개만 보여 줍니다. 검색을 더 좁혀 보세요.</p>`);
}

function termView(id) {
  const t = byId(id);
  if (!t) return `<h1>용어를 찾지 못했습니다.</h1>`;
  const s = load();
  const known = s.known.includes(t.id);
  const rel = (t.related || []).map((name) => {
    const hit = byRelated(name);
    return hit ? `<a class="chip" href="#/term/${esc(hit.id)}">${esc(hit.title)}</a>` : "";
  }).join("");
  const lesson = lessonForTerm(t);
  return `
    <article class="lesson">
      <p class="kicker">${esc(trackName(t.track))}</p>
      <h1>${esc(t.title)}</h1>
      ${glossLine(t)}
      <p class="dek">${esc(t.one)}</p>
      ${t.body.split(/(?<=다\.|요\.|까\.|죠\.|니다\.)\s+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}
      <div class="note"><p class="note-kicker">뒤집어서 이해하기 쉬운 점</p><p>${esc(t.watch)}</p></div>
      ${rel ? `<h2>옆에 두면 좋은 말</h2><div class="chips">${rel}</div>` : ""}
      <div class="row">
        <button class="btn" type="button" id="know" data-id="${esc(t.id)}">${known ? "알았음 표시를 지우기" : "이 말을 알았다고 표시"}</button>
        ${lesson ? `<a class="btn-quiet" href="#/lesson/${esc(lesson.id)}">${esc(lesson.no)}강 ${esc(lesson.title)}</a>` : ""}
      </div>
    </article>`;
}

function reviewView(track) {
  const pool = terms().filter((t) => !track || t.track === track);
  const s = load();
  const unknown = pool.filter((t) => !s.known.includes(t.id));
  const bag = (unknown.length ? unknown : pool).slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  window.__queue = bag.slice(0, 8).map((t) => t.id);
  window.__ri = 0;
  const chips = [`<a class="chip" href="#/review" ${track ? "" : "aria-current=\"true\""}>전체</a>`]
    .concat(tracks().map((t) => `<a class="chip" href="#/review/${esc(t.id)}" ${t.id === track ? "aria-current=\"true\"" : ""}>${esc(t.name)}</a>`))
    .join("");
  return `
    <p class="kicker">복습</p>
    <h1>제목만 보고 한 문장으로 말해 보세요.</h1>
    <div class="chips">${chips}</div>
    <div id="card"></div>`;
}

function paintCard() {
  const host = document.getElementById("card");
  if (!host) return;
  const q = window.__queue || [];
  const i = window.__ri || 0;
  if (!q.length) {
    host.innerHTML = `<p>아직 용어 카드가 없습니다.</p>`;
    return;
  }
  if (i >= q.length) {
    host.innerHTML = `<div class="sheet"><h2>여덟 장을 봤습니다.</h2><p><a href="#/review">한 번 더</a></p></div>`;
    return;
  }
  const t = byId(q[i]);
  host.innerHTML = `
    <div class="sheet">
      <p class="meta">${i + 1} / ${q.length} · ${esc(trackName(t.track))}</p>
      <h2>${esc(t.title)}</h2>
      <div id="reveal" hidden>
        ${glossLine(t)}
        <p>${esc(t.one)}</p>
        <p>${esc(t.body)}</p>
        <p class="meta">${esc(t.watch)}</p>
      </div>
      <div class="row">
        <button class="btn" type="button" id="show">뜻을 보기</button>
        <button class="btn-quiet" type="button" id="no">아직</button>
        <button class="btn-quiet" type="button" id="yes">이제 알겠어요</button>
      </div>
    </div>`;
  document.getElementById("show").onclick = () => { document.getElementById("reveal").hidden = false; };
  document.getElementById("no").onclick = () => { window.__ri++; paintCard(); };
  document.getElementById("yes").onclick = () => {
    const s = load();
    if (!s.known.includes(t.id)) s.known.push(t.id);
    save(s);
    window.__ri++;
    paintCard();
  };
}

function sources() {
  const rows = window.SOURCES || [];
  const body = rows.map((g) => `
    <h2>${esc(g.name)}</h2>
    <ul>${g.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a>${l.why ? ` — ${esc(l.why)}` : ""}</li>`).join("")}</ul>`).join("");
  return `
    <article class="lesson">
      <p class="kicker">출처</p>
      <h1>숫자는 여기서 다시 확인합니다.</h1>
      <p class="dek">강의에 적은 공표 숫자는 그 날짜의 자료입니다. 다음 발표가 나오면 기관 페이지가 이깁니다. 한국은행 책의 문장은 싣지 않았습니다.</p>
      ${body}
      <div class="note">
        <p class="note-kicker">학습 범위</p>
        <p>표제어 787개는 한국은행이 2026년 1월에 발간한 『경제금융용어 800선』의 표제어입니다. 책 한 권으로 세면 800선이고, 표제어 가운데 둘을 슬래시로 묶은 항목이 있어 이 사이트의 카드 수는 787입니다. 원문이 필요하면 한국은행 경제교육 자료와 정부간행물 안내를 따르세요. 이 사이트는 그 해설을 옮기지 않았습니다.</p>
      </div>
    </article>`;
}

function render() {
  const { name, arg } = parse();
  setNav(name);
  const main = document.getElementById("main");
  if (name === "home") main.innerHTML = home();
  else if (name === "learn") main.innerHTML = learn();
  else if (name === "lesson") main.innerHTML = lessonView(arg);
  else if (name === "terms") main.innerHTML = termsView(arg);
  else if (name === "term") main.innerHTML = termView(arg);
  else if (name === "review") main.innerHTML = reviewView(arg);
  else if (name === "sources") main.innerHTML = sources();
  else main.innerHTML = home();

  main.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.parentElement.querySelector(".answer");
      if (box) box.hidden = false;
      btn.hidden = true;
    });
  });
  const mark = document.getElementById("mark");
  if (mark) mark.onclick = () => {
    const s = load();
    const id = mark.dataset.id;
    s.lessons = s.lessons.includes(id) ? s.lessons.filter((x) => x !== id) : s.lessons.concat(id);
    save(s);
    render();
  };
  const know = document.getElementById("know");
  if (know) know.onclick = () => {
    const s = load();
    const id = know.dataset.id;
    s.known = s.known.includes(id) ? s.known.filter((x) => x !== id) : s.known.concat(id);
    save(s);
    render();
  };
  if (name === "terms") {
    const active = tracks().some((t) => t.id === arg) ? arg : "";
    const q = document.getElementById("q");
    const filters = document.getElementById("filters");
    let track = active;
    const go = () => paintTerms(track);
    q.addEventListener("input", go);
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-track]");
      if (!b) return;
      track = b.dataset.track;
      filters.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
      go();
    });
    go();
  }
  if (name === "review") paintCard();
  window.scrollTo(0, 0);
}

function setTheme(light) {
  const root = document.documentElement;
  if (light) root.dataset.theme = "light"; else delete root.dataset.theme;
  try { localStorage.setItem("cheoeum-theme", light ? "light" : "dark"); } catch (_) {}
  const btn = document.getElementById("theme");
  if (btn) { btn.textContent = light ? "어둡게" : "밝게"; btn.setAttribute("aria-pressed", light ? "true" : "false"); }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f7f4ec" : "#142033");
}
setTheme(document.documentElement.dataset.theme === "light");
document.getElementById("theme").addEventListener("click", () => setTheme(document.documentElement.dataset.theme !== "light"));

addEventListener("hashchange", render);
addEventListener("scroll", () => {
  document.querySelector(".top").classList.toggle("scrolled", scrollY > 4);
}, { passive: true });
render();
