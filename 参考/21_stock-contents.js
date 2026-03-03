// stock/js/pages/21_stock-contents.js

import { loadCSV, parseCSV, CDN_BASE } from "../shared/util.js";
import {
  buildMotifList,
  setFooterItem,
  cancelMotif,
  sortMotifs,
  resetMenus,
} from "../managers/motifManager.js";
import {
  setTransitionData,
  cancelTransition,
} from "../managers/transitionManager.js";
import { PDFExporter } from "../shared/pdfExporter.js";
import {
  initTakeoffLanding,
  cancelTakeoffLanding,
} from "../managers/takeoffLandingManager.js";

// --------------------
// DOM参照
// --------------------
const footerItem = document.getElementById("footerItem");
const pdfOutputBtn = document.getElementById("PDFoutput");
const motifModalSelect = document.getElementById("motifModalSelect");
const select = document.getElementById("select");
const colorList = document.getElementById("color_list");

// --------------------
// 初期化処理
// --------------------
document.addEventListener("DOMContentLoaded", async () => {
  // ログイン状態チェック（ローカルセッションストレージ利用）
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
    return;
  }

  showMainUI();
});

function showMainUI() {
  initializeMainApp();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }

  const backToMenuBtn = document.getElementById("backToMenuBtn");
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "20_user-menu.html";
    });
  }
}

/* ----------------------------------
   階層型メニュー クリック式フィルタ
---------------------------------- */
function setupCascadingFilter() {
  const menu = document.getElementById("filterMenu");

  // ------ クリック / Enter / Space ------
  menu.addEventListener("click", handleSelect);
  menu.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.key === " ") handleSelect(e);
  });

  // ------ メニュー外をクリックしたら全て閉じる ------
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) {
      menu
        .querySelectorAll(".open")
        .forEach((li) => li.classList.remove("open"));
    }
  });

  function handleSelect(e) {
    const li = e.target.closest("li");
    if (!li) return;

    // ▼ サブメニューを持つ項目（root / has-sub）は開閉トグルだけ
    if (li.classList.contains("root") || li.classList.contains("has-sub")) {
      // 並び替えメニューを全部閉じる
      document
        .querySelectorAll("#sortMenu .open")
        .forEach((n) => n.classList.remove("open"));

      // 同じ階層にある兄弟の open を全て除去
      const siblings = li.parentElement.querySelectorAll(
        ":scope > li.has-sub.open"
      );
      siblings.forEach((sib) => {
        if (sib !== li) sib.classList.remove("open");
      });

      // クリックした要素だけトグル
      li.classList.toggle("open");
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // ▼ データ属性がある＝フィルタ対象の「葉」項目
    const { type, value } = li.dataset;
    if (!type) return;

    menu
      .querySelectorAll(`li[data-type="${type}"].selected`)
      .forEach((n) => n.classList.remove("selected"));
    // ② 今回クリックした項目を選択状態に
    li.classList.add("selected");

    switch (type) {
      case "planes":
        filterByPlanes(value);
        break;
      case "season":
        filterBySeason(value);
        break;
      case "category":
        filterByCategory(value);
        break;
      case "popular":
        filterByPopular(value);
        break;
    }

    // クリック後にメニューを閉じたい場合はここで open クラスを除去
    menu.querySelectorAll(".open").forEach((n) => n.classList.remove("open"));

    e.stopPropagation();
    e.preventDefault();
  }
}

/* --- 機体数フィルタ --- */
function filterByPlanes(val) {
  resetVisibility();
  const targetClass = `m_${Number(val)}`;

  document.querySelectorAll("#setGrid > section").forEach((sec) => {
    if (val === "0000" || sec.classList.contains(targetClass)) {
      sec.removeAttribute("id"); // 表示
    } else {
      sec.setAttribute("id", "m_none"); // 非表示
    }
  });
}

/* --- 季節フィルタ --- */
function filterBySeason(season) {
  resetVisibility();
  document.querySelectorAll("#setGrid > section").forEach((sec) => {
    const show = sec.classList.contains(`season_${season}`);
    if (!show) sec.style.display = "none";
  });
}

/* --- カテゴリーフィルタ --- */
function filterByCategory(category) {
  resetVisibility();
  document.querySelectorAll("#setGrid > section").forEach((sec) => {
    const show = sec.classList.contains(`category_${category}`);
    if (!show) sec.style.display = "none";
  });
}

/* --- 人気順フィルタ --- */
function filterByPopular(pop) {
  resetVisibility();
  document.querySelectorAll("#setGrid > pop").forEach((sec) => {
    const show = sec.classList.contains(`pop_${pop}`);
    if (!show) sec.style.display = "none";
  });
}

// フィルタリングリセット
function resetVisibility() {
  document.querySelectorAll("#setGrid > section").forEach((sec) => {
    sec.removeAttribute("id"); // m_none を外す
    sec.style.display = ""; // display を戻す
  });
}

window.resetVisibility = resetVisibility;

/* ----------------------------------
   ソート
---------------------------------- */
function setupSortMenu() {
  const menu = document.getElementById("sortMenu");
  if (!menu) return;

  // クリック／Enter／Space
  menu.addEventListener("click", handleSelect);
  menu.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.key === " ") handleSelect(e);
  });

  // メニュー外クリックで閉じる
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target))
      menu
        .querySelectorAll(".open")
        .forEach((li) => li.classList.remove("open"));
  });

  function handleSelect(e) {
    const li = e.target.closest("li");
    if (!li) return;

    // ▼ サブメニュー開閉
    if (li.classList.contains("root") || li.classList.contains("has-sub")) {
      // フィルターメニューを全部閉じる
      document
        .querySelectorAll("#filterMenu .open")
        .forEach((n) => n.classList.remove("open"));

      // 同階層の open を閉じる
      li.parentElement
        .querySelectorAll(":scope > li.has-sub.open")
        .forEach((sib) => sib !== li && sib.classList.remove("open"));
      li.classList.toggle("open");
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // 既存の選択をすべて解除
    menu
      .querySelectorAll("li[data-sort].selected")
      .forEach((n) => n.classList.remove("selected"));
    // 今回クリックした項目をハイライト
    li.classList.add("selected");

    // ▼ 並び替え実行
    const sortKey = li.dataset.sort;
    if (sortKey) sortMotifs(sortKey);

    // クリック後にメニューを閉じる
    menu.querySelectorAll(".open").forEach((n) => n.classList.remove("open"));
    e.stopPropagation();
    e.preventDefault();
  }
}

// --------------------
// キャンセル処理（Motif/Transition）
// --------------------
footerItem.addEventListener("click", (e) => {
  // Motif Cancel
  if (e.target.classList.contains("motifCancel")) {
    const motifEl = e.target.parentElement;
    cancelMotif(motifEl);
    return;
  }

  // Transition Cancel
  if (e.target.classList.contains("transitionCancel")) {
    const transitionEl = e.target.parentElement;
    cancelTransition(transitionEl);
    /* ★ ダブルクリックなども完全に殺す */
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }

  // ★★ Take-off / Landing Cancel
  if (e.target.classList.contains("tlCancel")) {
    const tlEl = e.target.parentElement; // img ラッパ
    cancelTakeoffLanding(tlEl);
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    return;
  }
});

function initializeMainApp() {
  // 💡 プレースホルダーを初期化（重複防止）
  document.querySelectorAll(".tlPlaceholder").forEach((el) => el.remove());

  // motifManager に footerItem をセット
  setFooterItem(footerItem);

  // 離陸／着陸プレースホルダを配置
  initTakeoffLanding(footerItem);

  // モチーフデータの読み込み（★ローカルファイルから取得）
  loadCSV("./assets/csv/motifs.csv", (text) => {
    // モチーフデータの読み込み（★R2 から取得）
    // loadCSV(`${CDN_BASE}/assets/csv/motifs.csv`, (text) => {
    const csvArray = parseCSV(text);
    buildMotifList(csvArray, colorList);
  });

  // トランジションデータの読み込み（★ローカルファイルから取得）
  loadCSV("./assets/csv/transitions.csv", (text) => {
    // トランジションデータの読み込み（★R2 から取得）
    // loadCSV(`${CDN_BASE}/assets/csv/transitions.csv`, (text) => {
    const transitionCsvArray = parseCSV(text);
    setTransitionData(transitionCsvArray);
  });

  // 階層型メニューのイベント登録
  setupCascadingFilter();

  // PDF出力ボタン設定
  const pdfExporter = new PDFExporter("#footerItem");
  pdfOutputBtn.addEventListener("click", () => {
    pdfExporter.export();
  });
  // ソートメニューを有効化
  setupSortMenu();
  document
    .getElementById("resetMenusBtn")
    .addEventListener("click", resetMenus);
}
