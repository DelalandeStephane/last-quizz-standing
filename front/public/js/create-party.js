
(function(window, io){ 
    window.addEventListener('DOMContentLoaded',function(){
        
        var socket = io('http://localhost:8080/');
        
        const btnCreateParty = document.getElementById('btn-create-party');
        btnCreateParty.addEventListener('click', () => {
            socket.emit('createParty');
            socket.on('getRoom', (room) => {
                    window.location.href = `/join/${room.roomId}`;
            })
        })
    });
})(window, io);