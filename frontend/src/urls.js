const BASE = 'https://go-jagrata.herokuapp.com'

const urls = {
    IS_USERNAME: 'user/is',
    REQUEST_ADD: 'action',
    ADD_MEMBER: 'add/member',
    REMOVE_MEMBER: 'remove/member',
    SEND_ACTION: 'action',
    CREATE_CLUB: 'user/create',
    LOGIN: 'user/login',
    SUBSCRIBE: 'add/news-letter',
    GET_PLAYLIST: '',
    SOCKET: ''
}

let URL = {}

Object.keys(urls).forEach(key => {
    URL[key] = `${BASE}/${urls[key]}`
})

export default URL