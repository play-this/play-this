import io from 'socket.io-client';
import URL from './urls'

let s
class SocketCreator {
    constructor(){
        this.socket = io(URL.SOCKET)
    }

    getSocket(){
        return this.socket
    }
}

export default () => {
    if(!s) s = new SocketCreator()
    return s
}


