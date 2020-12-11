$(()=>{

    const socket = io();

    $('#username').on('keydown',e=>{
        if(e.key=='Enter' && $('#username').val().length>0){
            socket.emit('username',$('#username').val());
            $('#username').val('');
        }
    })

    $('#start').click(()=>{
        $('#username,#start').remove();
        socket.emit('start');
    });

    socket.on('question',(players,answer)=>{
        $('#doubt').html('');
        players.forEach(p=>{
            $('#doubt').append(`<button player="${p}">${p} doubts it!</button>`);
        });
        $('#answer').text(answer);
        $('#answered,#doubt,#options').show();
    });

    $('#doubt').on('click','button',function(){
        $('#doubt').hide();
        socket.emit('doubt',$(this).attr('player'));
    });

    $('#options').click(()=>{
        $('#options').hide();
        socket.emit('options');
    });

    $('#answered').click(()=>{
        $('#answer,#right,#wrong').show();
        $('#answered,#doubt,#options').hide();
        socket.emit('answered');
    });

    $('#right').click(()=>{
        $('#answer,#right,#wrong').hide();
        socket.emit('right');
    });

    $('#wrong').click(()=>{
        $('#answer,#right,#wrong').hide();
        socket.emit('wrong');
    });

});