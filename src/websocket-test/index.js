window.onload = function() {
    let form = document.getElementById('message-form');
    let messageField = document.getElementById('message');
    let messageList = document.getElementById('messages');
    let socketStatus = document.getElementById('statusText');
    let closeBtn = document.getElementById('close-button');
    let socket = new WebSocket('wss://echo.websocket.org');
    
    socket.onerror = function(error) {
        console.log('WebSocket Error: ', error);
    }
    
    socket.onopen = function(e) {
        console.log('WebSocket opened successfully!');
        socketStatus.innerHTML = 'Connected to: ' + e.currentTarget.url;
        socketStatus.className = 'open';
    }
    
    socket.onmessage = function(e) {
        console.log('Message received from server:', e.data);
        let message = e.data;
        messageList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
    }
    
    socket.onclose = function(e) {
        console.log('WebSocket closed. Code:', e.code, 'Reason:', e.reason);
        socketStatus.innerHTML = 'Disconnected from WebSocket.';
        socketStatus.className = 'closed';
    }
    form.onsubmit = function(e) {
        e.preventDefault();
        let message = messageField.value;
        
        console.log('Attempting to send message:', message);
        console.log('WebSocket readyState:', socket.readyState);
        
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
            messageList.innerHTML += '<li class="sent"><span>Sent:</span>' + message + '</li>';
            messageField.value = '';
        } else {
            console.log('Cannot send - WebSocket is not open');
            alert('WebSocket connection is not open!');
        }
    }
    socket.onmessage = function(e) {
        let message = e.data;
        messageList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
    }
    closeBtn.onclick = function(e) {
        e.preventDefault();
        socket.close();
    }
    socket.onclose = function(e) {
        socketStatus.innerHTML = 'Disconnected from WebSocket.';
        socketStatus.className = 'closed';
    }
}
