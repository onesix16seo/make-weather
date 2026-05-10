/**
 * Wiring: PRD flows + Stitch layouts (입력 / 오늘 / 기록).
 */
(function () {
  var PWM = window.PWM;
  if (!PWM) return;

  var ACCENT_ICON = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary",
  };

  var state = {
    view: "input",
    yesterday: 7,
    today: 5,
    goal: "",
    lastResult: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateNavHighlight(active) {
    document.querySelectorAll("header [data-nav]").forEach(function (btn) {
      var v = btn.getAttribute("data-nav");
      var on = v === active;
      btn.classList.toggle("bg-white/10", on);
      btn.classList.toggle("text-primary", on);
      btn.classList.toggle("text-on-surface-variant", !on);
    });

    document.querySelectorAll(".pwm-bottom-nav [data-nav]").forEach(function (btn) {
      var v = btn.getAttribute("data-nav");
      var on = v === active;
      btn.classList.toggle("bg-primary-container/80", on);
      btn.classList.toggle("text-on-primary-container", on);
      btn.classList.toggle("rounded-full", on);
      btn.classList.toggle("px-5", on);
      btn.classList.toggle("py-2", on);
      btn.classList.toggle("shadow-[0_0_20px_rgba(207,188,255,0.3)]", on);
      btn.classList.toggle("scale-110", on);
      btn.classList.toggle("text-on-surface-variant/60", !on);
      var icon = btn.querySelector(".material-symbols-outlined");
      if (icon) icon.style.fontVariationSettings = on ? "'FILL' 1" : "";
    });
  }

  function setView(name) {
    state.view = name;
    ["panel-input", "panel-result", "panel-archive"].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.add("hidden");
    });

    var map = { input: "panel-input", result: "panel-result", archive: "panel-archive" };
    var panel = $(map[name]);
    if (panel) panel.classList.remove("hidden");

    updateNavHighlight(name);

    if (name === "archive") renderArchive();

    if (name === "result") {
      var actions = $("result-actions");
      if (!state.lastResult) {
        $("panel-result-empty").classList.remove("hidden");
        $("panel-result-content").classList.add("hidden");
        if (actions) actions.classList.add("hidden");
      } else {
        $("panel-result-empty").classList.add("hidden");
        $("panel-result-content").classList.remove("hidden");
        if (actions) actions.classList.remove("hidden");
        renderResult();
      }
    }
  }

  function syncSliderUI(which) {
    var val = which === "y" ? state.yesterday : state.today;
    var pct = ((val - 1) / 9) * 100;
    var prefix = which === "y" ? "y" : "t";
    var fill = $("slider-" + prefix + "-fill");
    var thumb = $("slider-" + prefix + "-thumb");
    var label = $("score-" + prefix);
    if (fill) fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
    if (label) label.textContent = String(val);
    var input = $("range-" + prefix);
    if (input) input.value = String(val);
  }

  function wireSlider(which) {
    var prefix = which === "y" ? "y" : "t";
    var input = $("range-" + prefix);
    if (!input) return;
    input.addEventListener("input", function () {
      var v = parseInt(input.value, 10);
      if (which === "y") state.yesterday = v;
      else state.today = v;
      syncSliderUI(which);
    });
  }

  function renderResult() {
    var r = state.lastResult;
    if (!r) return;
    var meta = r.meta;
    var quote = r.quote;
    var bg = $("result-bg-gradient");
    if (bg) {
      bg.className =
        "absolute inset-0 z-0 bg-gradient-to-b transition-colors duration-500 " + meta.bgClass;
    }
    var iconEl = $("result-icon");
    if (iconEl) {
      iconEl.textContent = meta.icon;
      iconEl.className =
        "material-symbols-outlined text-[80px] relative z-10 drop-shadow-[0_0_15px_rgba(207,188,255,0.4)] " +
        (ACCENT_ICON[meta.accent] || "text-primary");
      iconEl.style.fontVariationSettings = "'FILL' 1";
    }
    var quoteEl = $("result-quote");
    if (quoteEl) quoteEl.textContent = '"' + quote.text + '"';
    var authorEl = $("result-author");
    if (authorEl) authorEl.textContent = "— " + quote.author;
    $("chip-yesterday").textContent = "어제: " + r.yesterday_score;
    $("chip-today").textContent = "오늘: " + r.today_score;
    $("chip-weather").textContent = meta.ko;
    var goalFoot = $("result-goal-foot");
    if (goalFoot) {
      goalFoot.textContent = r.goal_text
        ? "오늘의 목표: " + r.goal_text
        : "오늘의 목표가 아직 없습니다.";
    }
    var saveBtn = $("btn-save-log");
    var saveLbl = $("btn-save-log-label");
    if (saveBtn) saveBtn.disabled = false;
    if (saveLbl) saveLbl.textContent = "나의 기록에 저장하기";
  }

  function renderArchive() {
    var logs = PWM.loadLogs();
    var empty = $("archive-empty");
    var grid = $("archive-grid");
    if (!logs.length) {
      empty.classList.remove("hidden");
      grid.innerHTML = "";
      grid.classList.add("hidden");
      return;
    }
    empty.classList.add("hidden");
    grid.classList.remove("hidden");
    grid.innerHTML = logs
      .map(function (log) {
        var meta = PWM.WEATHER_META[log.weather_id] || {
          ko: log.weather_id,
          icon: "wb_sunny",
          accent: "primary",
        };
        var iconClass = ACCENT_ICON[meta.accent] || "text-primary";
        var q = escapeHtml(log.quote_text || "");
        var goal = log.goal_text ? escapeHtml(log.goal_text) : "";
        return (
          '<div class="glass-panel rounded-xl p-card-padding flex flex-col gap-4 relative overflow-hidden group hover:bg-white/5 transition-colors duration-300">' +
          '<div class="flex justify-between items-start">' +
          '<div><span class="font-label-caps text-label-caps text-on-surface-variant">' +
          escapeHtml(PWM.formatDateKo(log.created_at)) +
          "</span>" +
          '<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">' +
          escapeHtml(meta.ko) +
          "</h2></div>" +
          '<span class="material-symbols-outlined text-4xl ' +
          iconClass +
          '" style="font-variation-settings: \'FILL\' 1;">' +
          escapeHtml(meta.icon) +
          "</span></div>" +
          '<div class="flex gap-2 mt-2 flex-wrap">' +
          '<span class="bg-surface-container-highest rounded-full px-3 py-1 font-label-caps text-label-caps text-primary">어제: ' +
          escapeHtml(String(log.yesterday_score)) +
          "</span>" +
          '<span class="bg-surface-container-highest rounded-full px-3 py-1 font-label-caps text-label-caps text-tertiary">오늘: ' +
          escapeHtml(String(log.today_score)) +
          "</span></div>" +
          '<p class="text-on-surface-variant mt-2 line-clamp-3">&ldquo;' +
          q +
          "&rdquo;</p>" +
          (goal ? '<p class="text-on-surface-variant/90 text-sm mt-1">오늘의 목표: ' + goal + "</p>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function onSubmitWeather() {
    var goalInput = $("input-goal");
    state.goal = goalInput ? goalInput.value.trim() : "";
    var res = PWM.computeResult(state.yesterday, state.today);
    state.lastResult = {
      weatherId: res.weatherId,
      meta: res.meta,
      quote: res.quote,
      yesterday_score: state.yesterday,
      today_score: state.today,
      goal_text: state.goal,
    };
    setView("result");
  }

  function onSaveLog() {
    if (!state.lastResult) return;
    PWM.saveLog({
      yesterday_score: state.lastResult.yesterday_score,
      today_score: state.lastResult.today_score,
      goal_text: state.lastResult.goal_text,
      weather_id: state.lastResult.weatherId,
      quote_text: state.lastResult.quote.text,
      quote_author: state.lastResult.quote.author,
    });
    var saveBtn = $("btn-save-log");
    var saveLbl = $("btn-save-log-label");
    if (saveBtn) saveBtn.disabled = true;
    if (saveLbl) saveLbl.textContent = "저장됨";
  }

  function init() {
    syncSliderUI("y");
    syncSliderUI("t");
    wireSlider("y");
    wireSlider("t");

    document.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var v = btn.getAttribute("data-nav");
        setView(v);
      });
    });

    var submitBtn = $("btn-submit-weather");
    if (submitBtn) submitBtn.addEventListener("click", onSubmitWeather);

    var saveBtn = $("btn-save-log");
    if (saveBtn) saveBtn.addEventListener("click", onSaveLog);

    var backBtn = $("btn-result-back");
    if (backBtn)
      backBtn.addEventListener("click", function () {
        setView("input");
      });

    setView("input");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
