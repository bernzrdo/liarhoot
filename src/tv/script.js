$(()=>{

    const maxPoints = 5;
    var token;
    $.get('token.txt',res=>token = res.split('\n')[0]);

    // -------------------------------------------------------------

    const tts = new SpeechSynthesisUtterance();
    speechSynthesis.onvoiceschanged=()=>tts.voice=speechSynthesis.getVoices()[3];
    tts.rate = .9;

    // -------------------------------------------------------------

    const zap = new Audio('sounds/zap.mp3');

    const elevator = new Audio('sounds/elevator.mp3');
    elevator.loop = true;

    const music = new Audio('sounds/music.mp3');
    music.loop = true;
    music.volume = .25;

    const pop = new Audio('sounds/pop.mp3');
    const unpop = new Audio('sounds/unpop.mp3');

    const zap2 = new Audio('sounds/zap2.mp3');
    const unzap2 = new Audio('sounds/unzap2.mp3');

    const round = new Audio('sounds/round.mp3');
    round.volume = .3;

    const doubt = new Audio('sounds/doubt.mp3');
    const win = new Audio('sounds/win.mp3');

    // -------------------------------------------------------------

    var players,points={},roundNumber=0,doubtPlayer;

    // -------------------------------------------------------------

    const socket = io();

    socket.emit('tv');
    socket.on('player',(p,username)=>{
        players = p;
        points[username] = maxPoints;
        pop.play();
        $('#players').text(players.join(', '));
    });
    socket.on('start',()=>{
        players.sort(()=>Math.random()-.5);
        elevator.pause();
        zap.play();
        $('#waiting').addClass('off');
        setTimeout(()=>{
            music.play();
            showPoints();
        },1e3);
        setTimeout(showRounds,4500);
        setTimeout(showQuestion,7500);
    });
    socket.on('doubt',u=>{
        $('#doubt').text(`${u} doubts it!`);
        doubtPlayer = u;
        $('#doubt').removeClass('off');
        doubt.play();
    });
    socket.on('answered',()=>{
        unzap2.play();
        $('#question').addClass('off');
        setTimeout(()=>{
            tts.text = 'And the answer is';
            speechSynthesis.speak(tts);
        },500);
    });
    socket.on('right',()=>{
        zap2.play();
        $('#answer').removeClass('off');
        setTimeout(()=>{
            tts.text = `Correct!`;
            if(doubtPlayer==''){
                tts.text += ` No one loses any points!`;
            }else{
                tts.text += ` Since ${doubtPlayer} doubted ${$('#player').text()}'s answer. ${doubtPlayer} loses a point.`;
                points[doubtPlayer]--;
            }
            speechSynthesis.speak(tts);
            nextQuestion();
        },500);
    });
    socket.on('wrong',()=>{
        zap2.play();
        $('#answer').removeClass('off');
        setTimeout(()=>{
            tts.text = `Wrong, it was ${$('#answer').text()}!`;
            if(doubtPlayer==''){
                var lost = players.filter(p=>p!=$('#player').text());
                lost.forEach(p=>points[p]--);
                tts.text += ` Since no one doubted ${$('#player').text()}'s answer. ${makeString(lost)} lose${lost.length>1 ? 's' : ''} a point.`;
            }else{
                points[$('#player').text()]--;
                tts.text += ` Since ${doubtPlayer} doubted ${$('#player').text()}'s answer. ${$('#player').text()} loses a point.`;
            }
            speechSynthesis.speak(tts);
            nextQuestion();
        },500);
    });

    // -------------------------------------------------------------

    $('#start').click(()=>{
        $('#start').hide();
        elevator.play();
        socket.emit('init');
    });

    // -------------------------------------------------------------
    
    function nextQuestion(){
        var stillPlayingCount = 0;
        Object.keys(points).forEach(k=>{
            if(points[k]<0) points[k] = 0;
            if(points[k]>0) stillPlayingCount++;
        });
        if(stillPlayingCount>1){
            setTimeout(()=>{
                unzap2.play();
                $('#answer,#doubt').addClass('off');
            },2500);
            setTimeout(showPoints,3e3);
            setTimeout(showRounds,6500);
            setTimeout(showQuestion,9500);
        }else{
            setTimeout(()=>{
                unzap2.play();
                $('#answer,#doubt').addClass('off');
            },2500);
            setTimeout(showPoints,3e3);
            setTimeout(()=>{
                tts.text = 'Looks like we have a winner!';
                speechSynthesis.speak(tts);
                music.pause();
            },6500);
            setTimeout(()=>{
                var winner = Object.keys(points).filter(p=>points[p]>0);
                tts.text = `Congratulations ${winner}!`;
                speechSynthesis.speak(tts);
                $('#winner span:first-child').text(winner);
                $('#winner').removeClass('off');
                win.play();
            },7500);
        }
    }

    function showPoints(){
        var html = '<table><tr>';
        players.forEach(p=>{
            if(points[p]==0) html += `<td style="opacity:.5">${p}</td>`;
            else html += `<td>${p}</td>`;
        });
        html += '</tr><tr>';
        players.forEach(p=>{
            if(points[p]==0) html += `<td style="opacity:.5">${points[p]}</td>`;
            else html += `<td>${points[p]}</td>`;
        });
        $('#points').html(`${html}</tr></table>`);
        zap2.play();
        $('#points').removeClass('off');
        setTimeout(()=>{
            unzap2.play();
            $('#points').addClass('off');
        },3e3);
    }

    function showRounds(){
        roundNumber++;
        $('#round span:first-child').text(`Round ${roundNumber}`);
        $('#round span:last-child').text(players[(roundNumber-1)%players.length]);
        $('#round').removeClass('off');
        round.play();
        setTimeout(()=>{
            unzap2.play();
            $('#round').addClass('off');
        },3e3);
    }

    function showQuestion(){
        doubtPlayer = '';
        $.getJSON('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=easy&category=9&token='+token,res=>{
            $('#questionText').html(res.results[0].question);
            $('#player').text(players[(roundNumber-1)%players.length]);
            zap2.play();
            $('#question').removeClass('off');
            $('#answer').html(res.results[0].correct_answer);
            var options = res.results[0].incorrect_answers;
            options.push(res.results[0].correct_answer);
            options.sort(()=>Math.random()-.5);
            $('#options').html(`<span>${options.join('</span><span>')}</span>`);
            socket.emit('question',res.results[0].correct_answer);
            setTimeout(()=>{
                tts.text = `Question for ${players[(roundNumber-1)%players.length]}. ${$('#questionText').text()}`;
                speechSynthesis.speak(tts);
            },500);
        });
    }

    function makeString(a) {
        if(a.length==1) return a[0];
        const firsts = a.slice(0, a.length - 1);
        const last = a[a.length - 1];
        return firsts.join(', ') + ' and ' + last;
    }

});