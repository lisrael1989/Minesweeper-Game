"use strict";

const MINE = "💣";
const EMPTY = "";
const FLAG = "🚩";
const NUM_ICONS = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];

var gGame;
var gBoard;
var gLevel = {
  size: 4,
  mines: 2,
};
var gTimerInterval;
var gLives;

function onInit() {
  clearInterval(gTimerInterval);
  document.querySelector("span.seconds").innerText = "00";
  document.querySelector("span.minutes").innerText = "00";

  hideModal();
  gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
  };
  gBoard = buildBoard();
  setMinesLocations();
  setMinesNegsCount();
  renderBoard();
  gLives = 3;
  document.querySelector(".live").innerText = gLives;

  // console.table(gBoard);
}

function buildBoard() {
  const board = [];
  for (let i = 0; i < gLevel.size; i++) {
    board[i] = [];
    for (let j = 0; j < gLevel.size; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      };
    }
  }
  board[1][1].isMine = board[2][3].isMine = false;
  return board;
}

function renderBoard() {
  var strHTML = "";
  for (let i = 0; i < gBoard.length; i++) {
    strHTML += "<tr>";
    for (let j = 0; j < gBoard[0].length; j++) {
      const cell = "";
      const className = `cell cell-${i}-${j}`;
      strHTML += `<td class="${className}" onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(event,${i},${j})"></td>`;
    }
    strHTML += "</tr>";
  }
  const elBoard = document.querySelector(".board");
  elBoard.innerHTML = strHTML;
}

function setMinesNegsCount() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      gBoard[i][j].minesAroundCount = countNegsMines(i, j);
    }
  }
}

function countNegsMines(rowIdx, colIdx) {
  var negsCount = 0;
  const rowLimit = Math.min(rowIdx + 1, gBoard.length);
  const colLimit = Math.min(colIdx + 1, gBoard[0].length);

  for (let i = Math.max(rowIdx - 1, 0); i < rowLimit; i++) {
    for (let j = Math.max(colIdx - 1, 0); j < colLimit; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (gBoard[i][j].isMine) negsCount++;
    }
  }
  return negsCount;
}

function setMinesLocations() {
  for (let i = 0; i < gLevel.mines; i++) {
    const randCell = getRandCell();
    gBoard[randCell.i][randCell.j].isMine = true;
  }
}

function onCellClicked(elCell, i, j) {
  if (!gGame.isOn) return;
  if (gBoard[i][j].isMine && gGame.shownCount === 0) {
    onInit();
  }

  if (gBoard[i][j].isShown) return;
  if (gBoard[i][j].isMine && gBoard[i][j].isMarked) return;

  if (gGame.shownCount === 0) {
    var startTime = Date.now();
    startTimer(startTime);
  }

  expandShown(i, j);

  const elCell2 = document.querySelector(`.cell-${i}-${j}`);
  elCell2.classList.add("shown");

  var cellValue;
  if (gBoard[i][j].isMine) {
    cellValue = MINE;

    gLives--;

    document.querySelector(".live").innerText = gLives;

    if (gLives === 0) {
      return gameOver();
    }
  } else if (gBoard[i][j].minesAroundCount > 0) {
    cellValue = gBoard[i][j].minesAroundCount;
  } else {
    cellValue = "";
    expandShown(i, j);
  }

  renderCell({ i, j }, cellValue);

  checkVictory();
}

function onCellMarked(ev, i, j) {
  ev.preventDefault(); //right click
  if (!gGame.isOn) return;
  if (!gBoard[i][j].isMarked) {
    gBoard[i][j].isMarked = true;
    gGame.markedCount++;
    renderCell({ i, j }, FLAG);
    checkVictory();
  } else {
    gBoard[i][j].isMarked = false;
    gGame.markedCount--;
    renderCell({ i, j }, "");
  }
}

function expandShown(rowIdx, colIdx) {
  if (rowIdx < 0 || rowIdx >= gBoard.length) return;
  if (colIdx < 0 || colIdx >= gBoard[0].length) return;

  if (gBoard[rowIdx][colIdx].isShown) return;
  if (gBoard[rowIdx][colIdx].isMine) return;

  gBoard[rowIdx][colIdx].isShown = true;
  gGame.shownCount++;

  const elCell = document.querySelector(`.cell-${rowIdx}-${colIdx}`);
  elCell.classList.add("shown");

  if (gBoard[rowIdx][colIdx].minesAroundCount) {
    renderCell(
      { i: rowIdx, j: colIdx },
      gBoard[rowIdx][colIdx].minesAroundCount
    );
    return;
  }

  renderCell({ i: rowIdx, j: colIdx }, "");
  for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
    for (let j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (i < 0 || i >= gBoard.length || j < 0 || j >= gBoard[0].length)
        continue;

      expandShown(i, j);
    }
  }
}

function checkVictory() {
  if (gGame.shownCount === gLevel.size ** 2 - gLevel.mines) {
    endGame("You Won! 🥇");
  }
}

function gameOver() {
  endGame("Game Over!");
}

function endGame(msg) {
  clearInterval(gTimerInterval);
  const elModalH3 = document.querySelector(".modal h3");
  elModalH3.innerText = msg;
  showModal();
  const elLoseFace = document.querySelector(".restart-on-game");
  elLoseFace.innerText = " 😤";
  gGame.isOn = false;
}

function onChangeLevel(size, mines) {
  gLevel.size = size;
  gLevel.mines = mines;
  onInit();
}

function renderCell(location, value) {
  const elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  if (value === MINE || value === FLAG || value === EMPTY) {
    elCell.innerHTML = value;
  } else {
    elCell.innerHTML = NUM_ICONS[value];
  }
}

function startTimer(startTime) {
  clearInterval(gTimerInterval);
  gTimerInterval = setInterval(() => {
    const timeDiff = Date.now() - startTime;
    const seconds = getSeconds(timeDiff);
    const minutes = getMinutes(timeDiff);
    document.querySelector("span.seconds").innerText = seconds;
    document.querySelector("span.minutes").innerText = minutes;
  }, 1000);
}

function getSeconds(timeDiff) {
  const seconds = new Date(timeDiff).getSeconds();
  return (seconds + "").padStart(2, "0");
}

function getMinutes(timeDiff) {
  const minutes = new Date(timeDiff).getMinutes();
  return (minutes + "").padStart(2, "0");
}

// function handleMineClick() {
//   gLives--;
//   document.querySelector("span.lives").innerText = gLives;
// }
