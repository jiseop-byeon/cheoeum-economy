// 한국은행 ECOS Open API에서 100대 통계지표를 받아 js/ecos.js로 저장한다.
// 인증키는 저장소 밖 파일(.ecos-key, .gitignore에 있음) 또는 환경변수 ECOS_KEY에서 읽는다.
// 실행: node scripts/fetch-ecos.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const KEY = (process.env.ECOS_KEY || fs.readFileSync(path.join(ROOT, ".ecos-key"), "utf8")).trim();
const API = "https://ecos.bok.or.kr/api";

// 카드 제목 → 보여 줄 100대 통계지표 이름. 경제 개념과 바로 이어지는 지표만 고른다.
const MAP = {
  "기준금리": ["한국은행 기준금리", "콜금리(익일물)"],
  "콜시장": ["콜금리(익일물)"],
  "코리보": ["KORIBOR(3개월)"],
  "양도성예금증서(CD)": ["CD수익률(91일)"],
  "통화안정증권": ["통안증권수익률(364일)"],
  "국채": ["국고채수익률(3년)", "국고채수익률(5년)"],
  "장단기금리차": ["국고채수익률(3년)", "국고채수익률(5년)", "CD수익률(91일)"],
  "회사채": ["회사채수익률(3년,AA-)"],
  "신용스프레드": ["회사채수익률(3년,AA-)", "국고채수익률(3년)"],
  "예대금리차(예대마진)": ["예금은행 수신금리", "예금은행 대출금리"],
  "가계신용통계": ["가계신용", "가계대출연체율"],
  "협의통화(M1)": ["M1(협의통화, 평잔)"],
  "광의통화(M2)": ["M2(광의통화, 평잔)"],
  "통화지표": ["M1(협의통화, 평잔)", "M2(광의통화, 평잔)", "Lf(평잔)", "L(말잔)"],
  "외환시장": ["원/달러 환율(종가)"],
  "재정환율": ["원/엔(100엔) 환율(매매기준율)", "원/유로 환율(매매기준율)"],
  "주가지수": ["코스피지수", "코스닥지수"],
  "주식시장": ["코스피지수", "주식거래대금(KOSPI)", "투자자예탁금"],
  "채권시장": ["채권거래대금", "국고채발행액"],
  "경제성장률": ["경제성장률(실질, 계절조정 전기대비)"],
  "국내총생산(GDP)": ["GDP(명목, 계절조정)", "경제성장률(실질, 계절조정 전기대비)"],
  "국민총소득(GNI)": ["1인당GNI"],
  "총저축/총저축률/평균소비성향/평균저축성향": ["총저축률", "평균소비성향"],
  "국내총투자율": ["국내총투자율"],
  "대외의존도/수출입의존도/무역의존도": ["수출입의 대 GNI 비율"],
  "전산업생산지수": ["전산업생산지수"],
  "제조업생산능력/가동률지수": ["제조업가동률지수"],
  "소매판매": ["소매판매액지수"],
  "동행종합지수": ["동행지수순환변동치"],
  "선행종합지수": ["선행지수순환변동치"],
  "기업심리지수(CBSI)": ["전산업 기업심리지수실적"],
  "소비자심리지수": ["소비자심리지수"],
  "경제심리지수": ["경제심리지수"],
  "부채비율": ["제조업부채비율"],
  "지니계수": ["지니계수"],
  "소득5분위배율": ["5분위배율"],
  "실업률": ["실업률", "고용률"],
  "고용률": ["고용률", "취업자수"],
  "경제활동인구/비경제활동인구/경제활동참가율": ["경제활동인구", "취업자수"],
  "노동생산성/노동생산성지수": ["노동생산성지수"],
  "단위노동비용": ["단위노동비용지수"],
  "합계출산율": ["합계출산율"],
  "인구고령화": ["고령인구비율", "추계인구"],
  "경상수지": ["경상수지"],
  "직접투자": ["직접투자(자산)", "직접투자(부채)"],
  "순상품교역조건지수": ["순상품교역조건지수"],
  "소득교역조건지수": ["소득교역조건지수"],
  "외환보유액": ["외환보유액"],
  "외채/대외채권": ["대외채무", "대외채권"],
  "소비자물가지수(CPI)": ["소비자물가지수"],
  "근원인플레이션율": ["농산물 및 석유류제외 소비자물가지수"],
  "생활물가지수": ["생활물가지수"],
  "생산자물가지수(PPI)": ["생산자물가지수"],
  "수출입물가지수": ["수출물가지수", "수입물가지수"],
  "국제원유가격": ["Dubai유(현물)"]
};
// 기둥 개념(p..)에도 붙일 지표
const PILLAR_MAP = {
  p01: ["소비자물가지수"],
  p04: ["한국은행 기준금리", "국고채수익률(3년)", "예금은행 대출금리"],
  p08: ["코스피지수"],
  p09: ["주택매매가격지수", "주택전세가격지수"],
  p11: ["원/달러 환율(종가)", "원/엔(100엔) 환율(매매기준율)"]
};

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + " " + url.replace(KEY, "KEY"));
  return r.json();
}

(async () => {
  global.window = {};
  require(path.join(ROOT, "js/terms.js"));
  const T = window.TERMS;

  const ks = (await get(`${API}/KeyStatisticList/${KEY}/json/kr/1/200`)).KeyStatisticList.row;
  const stats = ks.filter((r) => r.DATA_VALUE && r.DATA_VALUE !== "null").map((r) => ({
    name: r.KEYSTAT_NAME.trim(), value: Number(r.DATA_VALUE), unit: (r.UNIT_NAME || "").trim().replace(/^null$/, ""), cycle: r.CYCLE
  }));
  const byName = new Map(stats.map((s) => [s.name, s]));

  // 소비자물가 상승률(전년 동월 대비)은 시계열에서 계산한다.
  const now = new Date();
  const ym = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const from = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  const cpi = (await get(`${API}/StatisticSearch/${KEY}/json/kr/1/40/901Y009/M/${ym(from)}/${ym(now)}/0`)).StatisticSearch.row;
  const last = cpi[cpi.length - 1];
  const prevKey = String(Number(last.TIME.slice(0, 4)) - 1) + last.TIME.slice(4);
  const prev = cpi.find((r) => r.TIME === prevKey);
  if (prev) {
    const yoy = Math.round((Number(last.DATA_VALUE) / Number(prev.DATA_VALUE) - 1) * 1000) / 10;
    const s = { name: "소비자물가 상승률(전년 동월 대비, 계산값)", value: yoy, unit: "%", cycle: last.TIME };
    stats.push(s); byName.set(s.name, s);
  }
  const CPI_RATE = "소비자물가 상승률(전년 동월 대비, 계산값)";

  const links = {};
  const missing = [];
  for (const [title, names] of Object.entries(MAP)) {
    const t = T.find((x) => x.title === title);
    if (!t) { missing.push("term " + title); continue; }
    const extra = title === "소비자물가지수(CPI)" ? [CPI_RATE] : [];
    links[t.id] = names.concat(extra).filter((n) => byName.has(n) || (missing.push("stat " + n), false));
  }
  for (const [pid, names] of Object.entries(PILLAR_MAP)) {
    links[pid] = names.concat(pid === "p01" ? [CPI_RATE] : []).filter((n) => byName.has(n));
  }
  const t504 = T.find((x) => x.title === "인플레이션");
  if (t504) links[t504.id] = [CPI_RATE, "소비자물가지수"].filter((n) => byName.has(n));

  const out = {
    fetched: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    stats: Object.fromEntries(stats.map((s) => [s.name, s])),
    links
  };
  fs.writeFileSync(path.join(ROOT, "js/ecos.js"),
    "// 한국은행 ECOS Open API에서 받은 값. scripts/fetch-ecos.js가 만든다. 출처: 한국은행 경제통계시스템(ECOS).\n" +
    "window.ECOS = " + JSON.stringify(out, null, 1) + ";\n");
  console.log(`stats ${stats.length}, linked terms ${Object.keys(links).length}`);
  if (missing.length) console.log("missing:", missing.join(", "));
})().catch((e) => { console.error(e.message); process.exit(1); });
