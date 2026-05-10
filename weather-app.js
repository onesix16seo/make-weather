/**
 * 날씨를 만들어드립니다 — TRD §3.1 3×3 matrix + quotes + local archive (localStorage).
 */
(function (global) {
  var STORAGE_KEY = "pwm_daily_logs_v1";

  function bucket(score) {
    var n = Number(score);
    if (n <= 3) return 0;
    if (n <= 7) return 1;
    return 2;
  }

  var MATRIX = [
    ["stormy", "foggy", "sunrise"],
    ["rainy", "cloudy", "sunny"],
    ["sunshower", "bright", "rainbow"],
  ];

  function resolveWeatherId(yesterdayScore, todayScore) {
    var r = bucket(yesterdayScore);
    var c = bucket(todayScore);
    return MATRIX[r][c];
  }

  var WEATHER_META = {
    stormy: {
      ko: "폭풍우",
      icon: "thunderstorm",
      accent: "primary",
      bgClass: "from-indigo-950/90 via-background to-background",
    },
    foggy: {
      ko: "안개",
      icon: "foggy",
      accent: "secondary",
      bgClass: "from-slate-800/90 via-background to-background",
    },
    sunrise: {
      ko: "동트는 새벽",
      icon: "wb_twilight",
      accent: "tertiary",
      bgClass: "from-amber-900/40 via-background to-background",
    },
    rainy: {
      ko: "비",
      icon: "rainy",
      accent: "secondary",
      bgClass: "from-blue-950/80 via-background to-background",
    },
    cloudy: {
      ko: "흐림",
      icon: "cloud",
      accent: "secondary",
      bgClass: "from-zinc-800/80 via-background to-background",
    },
    sunny: {
      ko: "맑음",
      icon: "wb_sunny",
      accent: "tertiary",
      bgClass: "from-yellow-900/30 via-background to-background",
    },
    sunshower: {
      ko: "여우비",
      icon: "rainy_snow",
      accent: "primary",
      bgClass: "from-violet-900/50 via-background to-background",
    },
    bright: {
      ko: "화창함",
      icon: "light_mode",
      accent: "tertiary",
      bgClass: "from-amber-700/35 via-background to-background",
    },
  rainbow: {
    ko: "무지개",
    icon: "looks",
    accent: "primary",
    bgClass: "from-fuchsia-900/40 via-background to-background",
  },
  };

  var QUOTES = {
    stormy: [
      { text: "폭풍은 영원하지 않다. 버티면 반드시 지나간다.", author: "어디선가" },
      { text: "번개 친 하늘도 결국 맑아진다.", author: "속담" },
      { text: "거친 파도가 노련한 뱃사공을 만든다.", author: "격언" },
    ],
    foggy: [
      { text: "안개 속에서는 한 걸음씩만 생각하면 된다.", author: "생각의 여유" },
      { text: "전망이 흐릴 때는 내 마음의 나침반을 보라.", author: "현대 명언" },
      { text: "모든 길은 안개가 걷히면 보인다.", author: "길 위에서" },
    ],
    sunrise: [
      { text: "새벽은 언제나 어둠 뒤에 온다.", author: "자연의 순서" },
      { text: "동쪽 하늘이 밝아오면 어제의 무게는 가벼워진다.", author: "아침의 약속" },
      { text: "시작은 작아도 방향은 높게.", author: "동트는 새벽" },
    ],
    rainy: [
      {
        text: "비 온 뒤에 땅이 굳는다. 오늘의 비는 내일의 단단함을 위한 것입니다.",
        author: "오늘의 생성된 날씨",
      },
      { text: "잠시 멈추어 세상을 적시는 소리를 들어보자.", author: "비 오는 날" },
      { text: "마음의 우산이 있다면 걸음은 멈추지 않는다.", author: "산책" },
    ],
    cloudy: [
      { text: "구름은 햇살을 가리지만 빼앗지는 않는다.", author: "하늘 보기" },
      { text: "답답한 하루도 숨 고르기에는 좋다.", author: "중용" },
      { text: "흐린 날은 부드럽게 나 자신에게 집중하기 좋다.", author: "내향의 시간" },
    ],
    sunny: [
      { text: "맑은 날에는 감사가 더 또렷하게 보인다.", author: "감사 일기" },
      { text: "햇살 한 줌이면 마음의 방도 환해진다.", author: "맑음" },
      { text: "오늘의 빛은 어제의 노력이 비춘 결과다.", author: "성장" },
    ],
    sunshower: [
      { text: "햇살 속 빗방울처럼 모순 속 기쁨도 있다.", author: "여우비" },
      { text: "예측 불가한 날에야 놀라운 무지개가 뜬다.", author: "여우비 뒤" },
      { text: "데이터와 감정이 겹치는 순간, 새로운 가능성이 열린다.", author: "교차의 날" },
    ],
    bright: [
      { text: "화창함은 노력의 날씨다.", author: "화창함" },
      { text: "밝은 하루는 작은 친절에서 시작된다.", author: "온기" },
      { text: "넓게 펼쳐진 하늘처럼 마음도 넓게.", author: "열린 하루" },
    ],
    rainbow: [
      { text: "무지개는 비와 햇살이 함께 있을 때만 선물된다.", author: "무지개" },
      { text: "색이 많을수록 삶은 풍부해진다.", author: "스펙트럼" },
      { text: "끝과 시작이 동시에 있는 아름다운 곡선.", author: "무지개 아래" },
    ],
  };

  function randomQuote(weatherId) {
    var list = QUOTES[weatherId];
    if (!list || list.length === 0) {
      return { text: "오늘도 한 걸음.", author: "날씨를 만들어드립니다" };
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  function computeResult(yesterdayScore, todayScore) {
    var weatherId = resolveWeatherId(yesterdayScore, todayScore);
    var meta = WEATHER_META[weatherId];
    var quote = randomQuote(weatherId);
    return { weatherId: weatherId, meta: meta, quote: quote };
  }

  function loadLogs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveLog(entry) {
    var logs = loadLogs();
    var id =
      global.crypto && global.crypto.randomUUID
        ? global.crypto.randomUUID()
        : String(Date.now());
    logs.unshift({
      id: id,
      created_at: new Date().toISOString(),
      yesterday_score: entry.yesterday_score,
      today_score: entry.today_score,
      goal_text: entry.goal_text,
      weather_id: entry.weather_id,
      quote_text: entry.quote_text,
      quote_author: entry.quote_author,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  function formatDateKo(iso) {
    var d = new Date(iso);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "." + m + "." + day;
  }

  global.PWM = {
    STORAGE_KEY: STORAGE_KEY,
    bucket: bucket,
    MATRIX: MATRIX,
    resolveWeatherId: resolveWeatherId,
    WEATHER_META: WEATHER_META,
    QUOTES: QUOTES,
    computeResult: computeResult,
    loadLogs: loadLogs,
    saveLog: saveLog,
    formatDateKo: formatDateKo,
  };
})(typeof window !== "undefined" ? window : globalThis);
