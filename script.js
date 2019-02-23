$(document).ready(function (e) {
    $("#jeu").p4({
        // x: 4,
        // y: 4,
        puissance: 4,
        idWinner: "win",
        colorPlayer1: 'blue',
        colorPlayer2: 'blue',
    });
});

$.fn.p4 = function (param) {
    /** INIT **/
    let settings = $.extend(
        {
            tblWidth: 500,
            y: 6, // nb of lines
            x: 7, // nb of cols
            puissance: 4,
            colorPlayer1: "#e74c3c",
            colorPlayer2: "#f1c40f",
            idInterface: "interface",
            idRestart: "restart",
            idjeu: 'grid',
            idWinner: 'won',
            idScore: 'scores',
            idUndo: 'undo',
        },
        param,
    );

    if (settings.colorPlayer1 == settings.colorPlayer2) {
        settings.colorPlayer1 = "#e74c3c";
        settings.colorPlayer2 = "#f1c40f";
    }

    const that = this; // keep first this, prevent changes
    let turnCount = 0; // +1 per turn
    let maxTurn = settings["x"] * settings["y"]; // max possible turns = nb of cells
    let gameArray = []; //map
    let player = 0; // current player
    let currentCell; // clicked cell
    let col; // col of clicked cell
    let row; // row of clicked cell
    let cell; // if cell to fill is founded in game function
    let victoryFlag = 0; // if victory, flag = 1
    let lastMove;
    // score of players
    let score1 = 0;
    let score2 = 0;


    /** GENERATE GRID **/
    const playPlaceGen = () => {
        $(that).css("display", `inline-block`);

        $(`#${settings.idInterface}`).prepend(`
            <form id='modalites'>
                <div class="row">
                    <label for='colorPlayerOne'>Couleur j1</label>
                    <input id='colorPlayerOne' type='color'>
                    <label for='colorPlayerTwo'>Couleur j2</label>
                    <input id='colorPlayerTwo' type='color'>
                </div>
                
                <div class="row">
                    <label for='sizeX'>X=</label>
                    <input id='sizeX' type='number' min='4' max='20'>
                    <label for='sizeY'>Y=</label>
                    <input id='sizeY' type='number' min='4' max='20'>
                    <label for='puissance'>Puissance</label>
                    <input id="puissance" type="number" min="3" max="20">
                </div>
                
                <button type='submit'>Valider</button>
            </form>
        `);

        $('#modalites').submit((e) => {
            e.preventDefault();
            console.log($("#colorPlayerOne").val(), $("#colorPlayerTwo").val(), $("#sizeX").val(), $("#sizeY").val(), $("#puissance").val());
            if ($("#colorPlayerOne").val()) settings.colorPlayer1 = $("#colorPlayerOne").val();
            if ($("#colorPlayerTwo").val()) settings.colorPlayer2 = $("#colorPlayerTwo").val();
            if ($("#sizeX").val()) settings.x = parseInt($("#sizeX").val());
            if ($("#sizeY").val()) settings.y = parseInt($("#sizeY").val());
            if ($("#puissance").val()) settings.puissance = parseInt($("#puissance").val());

            if (settings.colorPlayer1 == settings.colorPlayer2) {
                settings.colorPlayer1 = "#e74c3c";
                settings.colorPlayer2 = "#f1c40f";
            }

            console.log(settings);
            $(`#${settings.idjeu}`).find("table").remove();
            generateGrid();
        });

        // div interface joueur
        $(`#${settings.idInterface}`).append("<div id='gameOptions' style='display: flex; justify-content: space-between'>" +
            "<span id='turn1'>Joueur 1</span><span id='turn2'>Joueur 2</span>" +
            "</div>");

        // scores
        $(`#${settings.idScore}`).append(`<div id="playerOne">Score du joueur 1: ${score1}</div>` +
            `<div id="playerTwo">Score du joueur 2: ${score2}</div>`);

        // reset
        $(`#${settings.idRestart}`).css("display", "none");

        function generateGrid() {
            // div jeu
            let table = $("<table></table>"); //create table
            let Table0 = table.get(0); //get table instead of object

            table.css("border", "1px solid black");

            // for each row ...
            for (let i = 0; i < settings.y; i++) {
                let tr = Table0.insertRow();
                let arrRow = [];
                // ... and for each cell in the row
                for (let j = 0; j < settings.x; j++) {
                    let td = tr.insertCell();

                    td.style.border = "2px solid black";
                    td.style.width = `${settings.tblWidth / settings.x}px`;
                    td.style.height = `${settings.tblWidth / settings.x}px`;
                    td.style.borderRadius = "50%";
                    td.style.position = "relative";

                    $(td).attr('data-col', j);
                    $(td).attr('data-row', i);

                    arrRow.push(0);
                }
                gameArray.push(arrRow);
            }
            $(`#${settings.idjeu}`).append(table);
            bindGridEvents();
        }

        generateGrid();

        if (player === 1) {
            $("#turn1").css("background-color", "yellow");
        } else if (player === 2) {
            $("#turn2").css("background-color", "yellow");
        }

        if (turnCount < 1) {
            $(`#${settings.idUndo}`).css('display', 'none');
        }
    };
    playPlaceGen();

    /**  GAME **/
    function bindGridEvents() {
        $(`#${settings.idjeu} td`).click(function () {
            if (victoryFlag === 1) return; // prevent click if victory

            if (victoryFlag === 0 && turnCount >= 0) {
                $(`#${settings.idUndo}`).css('display', 'unset');
            }

            // get informations of the current cell (this = current Cell)
            col = parseInt($(this).attr('data-col'));
            row = parseInt($(this).attr('data-row'));


            // get current player
            if ((turnCount % 2) === 0) {
                player = 1;
                $("#turn2").css("background-color", "yellow");
                $("#turn1").css("background-color", "unset");
            } else {
                player = 2;
                $("#turn1").css("background-color", "yellow");
                $("#turn2").css("background-color", "unset");
            }

            const selectedCol = $(`td[data-col=${col}]`); // get list of cells in actual column
            cell = null; // reset founded cell

            /*
            * From last cell of the culums (bottom cell)
            * If cell is already played, take cell before
            */
            for (let i = selectedCol.length - 1; i >= 0; --i) {
                currentCell = selectedCol[i];
                // if currentCell does not have 'player' attribute
                if (!$(currentCell).attr('player')) {
                    cell = currentCell;
                    gameArray[i][col] = player;
                    lastMove = [i, col];
                    row = i;
                    break;
                }
            }

            /*
            * if empty cell in colums is found
            * add attribute player with player number
            * new turn
            * add skin of player
            */
            if (cell) {
                $(cell).attr('player', player);
                $(cell).css({
                    top: -settings.tblWidth,
                }).animate({
                    top: 0,
                }, 200);
                turnCount++;

                //let p = new Promise (function(resolve, reject) {
                $("[player*='1']").css("background-color", settings['colorPlayer1']);
                $("[player*='2']").css("background-color", settings['colorPlayer2']);

                //resolve ()
                //});

                //p.then(function (value) {
                //verify victory
                setTimeout(function () {
                        victory();
                    },
                    50);

                //});

            }
        });
    }

    $(`#${settings.idUndo}`).click(() => {
        let sel = $(`*[data-row="${lastMove[0]}"][data-col="${lastMove[1]}"]`);
        sel.removeAttr("player");
        sel.css("background-color", "#00000000");
        gameArray[lastMove[0]][lastMove[1]] = 0;
        turnCount--;
        $(`#${settings.idUndo}`).css('display', 'none');

    });

    /** VICTORY CHECKER **/
    const verif = (start, stop, dx, dy) => {
        let counter = 0;
        let verifCell = start;

        while ((verifCell[0] !== (stop[0] + dx) || verifCell[1] !== (stop[1]) + dy) && counter < settings.puissance) {

            let select = $(`*[data-row="${verifCell[0]}"][data-col="${verifCell[1]}"]`);
            if (parseInt(select.attr('player')) === player) {
                counter++;
            } else {
                counter = 0;
            }

            verifCell[0] += dx;
            verifCell[1] += dy;
        }

        return counter === settings.puissance;
    };

    const victory = () => {
        col = parseInt($(cell).attr('data-col'));
        row = parseInt($(cell).attr('data-row'));

        let maxRight = col + (settings.puissance - 1) > settings['x'] ? [row, settings['x']] : [row, col + (settings.puissance - 1)];
        let maxLeft = col - (settings.puissance - 1) < 0 ? [row, 0] : [row, col - (settings.puissance - 1)];
        let maxTop = row - (settings.puissance - 1) < 0 ? [0, col] : [row - (settings.puissance - 1), col];
        let maxBottom = row + (settings.puissance - 1) > settings['y'] - 1 ? [settings['y'] - 1, col] : [row + (settings.puissance - 1), col];

        let maxDiagLeft = [row, col];
        for (let i = 0; i < (settings.puissance - 1); i++) {
            if (maxDiagLeft[0] + 1 > settings.y - 1 || maxDiagLeft[1] - 1 < 0) {
                break;
            }

            maxDiagLeft[0] = maxDiagLeft[0] + 1;
            maxDiagLeft[1] = maxDiagLeft[1] - 1;
        }

        let maxDiagRight = [row, col];
        for (let i = 0; i < (settings.puissance - 1); i++) {
            if (maxDiagRight[1] + 1 > settings.x - 1 || maxDiagRight[0] - 1 < 0) {
                break;
            }
            maxDiagRight[0] = maxDiagRight[0] - 1;
            maxDiagRight[1] = maxDiagRight[1] + 1;
        }

        let maxAntiLeft = [row, col];
        for (let i = 0; i < (settings.puissance - 1); i++) {
            if (maxAntiLeft[0] + 1 > settings.x - 1 || maxAntiLeft[1] - 1 < 0) {
                break;
            }
            maxAntiLeft[0] = maxAntiLeft[0] - 1;
            maxAntiLeft[1] = maxAntiLeft[1] - 1;
        }

        let maxAntiRight = [row, col];
        for (let i = 0; i < (settings.puissance - 1); i++) {
            if (maxAntiRight[0] + 1 > settings.y - 1 || maxAntiRight[1] - 1 > settings.x - 1) {
                break;
            }
            maxAntiRight[0] = maxAntiRight[0] + 1;
            maxAntiRight[1] = maxAntiRight[1] + 1;
        }

        /*
         * Lecture: "DE ... A ... ROW+... COL+..."
         *
         * Ordre de verification:
         *  - ligne
         *  - colone
         *  - diagonale
         *  - antidiagonale
         */
        let result =
            verif(maxLeft, maxRight, 0, 1) ||
            verif(maxTop, maxBottom, 1, 0) ||
            verif(maxDiagLeft, maxDiagRight, -1, 1) ||
            verif(maxAntiLeft, maxAntiRight, 1, 1);

        if (result) {
            victoryFlag = 1;
            $(`#${settings.idUndo}`).css('display', 'none');
            if (player === 1) {
                score1++;
                $('#playerOne').text(`Score du joueur 1: ${score1}`);
            } else {
                score2++;
                $("#playerTwo").text(`Score du joueur 2: ${score2}`);
            }

            let alerte = confirm(`Player ${player} won!\nReplay?`);
            if (alerte) {
                $(`#${settings.idjeu} td`).removeAttr("player");
                $(`#${settings.idjeu} td`).css("background-color", "#00000000");
                $(gameArray).each(function (_, line) {
                    $(line).each(function (i) {
                        line[i] = 0;
                    });
                });
                turnCount = 0;
                victoryFlag = 0;
            } else {
                $(`#${settings.idRestart}`).css("display", "unset");
            }


            $(`#${settings.idRestart}`).click(function () {
                $(`#${settings.idjeu} td`).removeAttr("player");
                $(`#${settings.idjeu} td`).css("background-color", "#00000000");
                $(gameArray).each(function (_, line) {
                    $(line).each(function (i) {
                        line[i] = 0;
                    });
                });
                turnCount = 0;
                victoryFlag = 0;
                $(`#${settings.idRestart}`).css("display", "none");
            })
        }

        //match null
        if (turnCount >= maxTurn) {
            console.log("MATCH NUL");
            let alerte = confirm(`Match null!\nReplay?`);
            if (alerte) {
                $(`#${settings.idjeu} td`).removeAttr("player");
                $(`#${settings.idjeu} td`).css("background-color", "#00000000");
                $(gameArray).each(function (_, line) {
                    $(line).each(function (i) {
                        line[i] = 0;
                    });
                });
                turnCount = 0;
                victoryFlag = 0;
            } else {
                $(`#${settings.idRestart}`).css("display", "unset");
            }
        }
    }

};