import React from 'react'
import Current from './Current'
import Playlist from './Playlist'
import Members from './Members'
import Requests from './Requests'
import SubscribeAndAnnouncements from './SubscribeAndAnnouncements'
import URL from './../urls'
import socketClass from './../socket'
import { Input, Spin, Modal, message, Icon, Tooltip, Button } from 'antd';
import cryptoRandomString from 'random-string';
import Clipboard from 'react-clipboard.js';

const QRCode = require('qrcode.react');

class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            playlist: [],
            requested: false,
            loaded: true,
            username: '',
            name: '',
            newMember: false,
            newMemberName: '',
            showAll: true,
            requestAccess: false,
            actionId: '',
            currentVideoId: 0,
            videoDetails: [],
            members: [],
            requests: [],
            subscribeCard: false
        }
    }

    componentDidMount() {
        this.setState({
            username: this.props.match.params.username || 'John Doe'
        })
        if (!localStorage.getItem('subscribed')) {
            this.setState({ subscribeCard: true })
        }
        console.log(socketClass)
        this.socket = socketClass().getSocket()
        const socket = this.socket

        if (localStorage.getItem('isCreator') && localStorage.getItem('username') && localStorage.getItem('playThisPass') && !(this.props.location && this.props.location.state)) {
            const username = localStorage.getItem('username')
            const password = localStorage.getItem('playThisPass')


            this.getMembers()

            this.setState({ isOwner: true }, () => this.refreshPlaylist())
            socket.emit('join', { username, password })

            //listeners
            socket.on("message_from_user", this.actionListener)
        }
        else if ((this.props.location && this.props.location.state)) {

            const { username, password } = this.props.location.state
            localStorage.setItem('isCreator', 'true')
            localStorage.setItem('username', username)
            localStorage.setItem('playThisPass', password)

            console.log('home state', this.props.location.state)

            this.setState({ playlist: this.props.location.state.playlist.urls, isOwner: true }, () => this.refreshPlaylist())
            this.getMembers()
            socket.emit('join', { username, password })

            //listeners
            socket.on("message_from_user", this.actionListener)
        } else if (this.props.match.params.username) {
            console.log(this.props)
            if (!sessionStorage.getItem('uniqueIdPlayThis')) {
                this.setState({ showAll: false, requestAccess: true })
            }
            else {
                this.refreshPlaylist()
            }
            socket.emit('join', { username: this.props.match.params.username })
            socket.on('message_from_server', (data) => console.log('connected to _join', data))
            socket.on('message_from_owner', this.ownerActionListener)
        }


    }

    shiftCurrentActive = (shift) => {
        const username = localStorage.getItem('username')
        const password = localStorage.getItem('playThisPass')
        if (shift === 'p' && this.state.currentVideoId > 0) {
            this.setState({ currentVideoId: this.state.currentVideoId - 1 })
            fetch(`${URL.SEND_ACTION}/${username}/shift-current`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: this.state.currentVideoId - 1,
                    username,
                    password
                })
            })
        }
        else if (shift === 'n' && this.state.currentVideoId < this.state.playlist.length - 1) {
            this.setState({ currentVideoId: this.state.currentVideoId + 1 })
            fetch(`${URL.SEND_ACTION}/${username}/shift-current`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: this.state.currentVideoId + 1,
                    username,
                    password
                })
            })
        } else {
            this.setState({ currentVideoId: shift })
            fetch(`${URL.SEND_ACTION}/${username}/shift-current`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: shift,
                    username,
                    password
                })
            })
        }
    }

    actionListener = data => {
        console.log('actionListener', data)
        let { action } = data
        if (action) {
            if (action === 'new_member_request') {
                this.setState({
                    newMember: true,
                    newMemberName: data.name
                })
            } else if (/play|pause|previous|next|vol-up|vol-down/.test(action)) {
                console.log(action)
                this.setState({ action, actionId: data.data.actionId })
            } else if (action && action === 'request') {
                if (data) {
                    console.log('requests', data)
                    this.setState({ requests: data.data }, () => {
                        let scrl = this.requestRef
                        if (scrl) {
                            scrl.scrollTop = scrl.scrollHeight;
                        }
                    })
                }
            }
        }
    }

    ownerActionListener = data => {
        console.log('owner action', data)
        let action = data.action
        if (action && action === 'join_request_success' && data.success) {
            console.log('action add', data)
            this.setState({ requested: false })
            sessionStorage.setItem('uniqueIdPlayThis', data.data.memberId)
            sessionStorage.setItem('username', this.props.match.params.username)
            this.refreshPlaylist()
        } else if (action && action === 'playlist') {
            this.setState({ playlist: data.data })
        } else if (action && action === 'shift-current') {
            this.setState({ currentVideoId: data.data })
        } else if (action && action === 'remove_request_success') {
            sessionStorage.removeItem('uniqueIdPlayThis')
            sessionStorage.removeItem('username')
            sessionStorage.removeItem('prevActionId')
            this.setState({ showAll: false, requestAccess: true })
            message.warn('You were removed from the club by the owner. Try requesting access again.')
        } else if (action && action === 'request') {
            if (data) {
                console.log('requests', data)
                this.setState({ requests: data.data }, () => {
                    let scrl = this.requestRef
                    if (scrl) {
                        scrl.scrollTop = scrl.scrollHeight;
                    }
                })

            }
        }
    }

    onOkRequestAccess = () => {
        const username = this.props.match.params.username
        this.setState({ loaded: false, username })
        //directly opened club page, then get memberId
        fetch(`${URL.REQUEST_ADD}/${username}/join`, {
            method: 'POST', body: JSON.stringify({ name: this.state.name }), headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                this.setState({ loaded: true, showAll: true, requested: true, requestAccess: false })
            })
    }

    onOkNewMember = () => {
        const { username, password } = this.props.location.state
        const uniqueId = cryptoRandomString({ length: 10 })
        this.setState({ loading: true })
        fetch(`${URL.ADD_MEMBER}/${uniqueId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        }).then(res => res.json()).then(res => {
            if (res.success) {
                this.setState({ newMember: false, loading: false })
                this.getMembers()
            }
        })

    }

    onCancelNewMember = () => {
        this.setState({ newMember: false })
    }

    getMembers = () => {
        const username = localStorage.getItem('username')
        const password = localStorage.getItem('playThisPass')
        fetch(`${URL.LOGIN}`, {
            body: JSON.stringify({
                username,
                password
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.setState({ members: data.user.members })
                }
            })
    }

    removeMember = m => {
        const username = localStorage.getItem('username')
        const password = localStorage.getItem('playThisPass')
        fetch(`${URL.REMOVE_MEMBER}/${m}`, {
            body: JSON.stringify({
                username,
                password
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.setState({ members: this.state.members.filter(mem => m !== mem) })
                }
            })
    }

    sendRequest = (r, scrl) => {
        let newRequests = [...this.state.requests, r]
        if (this.state.isOwner) {
            const username = localStorage.getItem('username')
            const password = localStorage.getItem('playThisPass')
            fetch(`${URL.SEND_ACTION}/${username}/request`, {
                body: JSON.stringify({
                    username,
                    password,
                    data: newRequests
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ requests: newRequests }, () => {
                            let scrl = this.requestRef
                            if (scrl) {
                                scrl.scrollTop = scrl.scrollHeight;
                            }
                        })
                    }
                })
        } else {
            fetch(`${URL.SEND_ACTION}/${this.props.match.params.username}/request`, {
                body: JSON.stringify({
                    username: this.props.match.params.username,
                    memberId: sessionStorage.getItem('uniqueIdPlayThis'),
                    data: newRequests
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ requests: newRequests }, () => {
                            let scrl = this.requestRef
                            if (scrl) {
                                scrl.scrollTop = scrl.scrollHeight;
                            }
                        })
                    }
                })
        }
    }

    getRequestRef = r => {
        this.requestRef = r
    }

    logout = () => {
        if (this.state.isOwner) {
            localStorage.removeItem('isCreator')
            localStorage.removeItem('username')
            localStorage.removeItem('playThisPass')
        } else {
            sessionStorage.removeItem('uniqueIdPlayThis')
        }
        sessionStorage.removeItem('prevActionId')
        window.location = '/'
    }

    closeSubscribeCard = (subscribed) => {
        this.setState({ subscribeCard: false })
        if (subscribed) localStorage.setItem('subscribed', 'yes')
    }

    fetchVideoDetails = () => {
        fetch(`https://www.googleapis.com/youtube/v3/videos?part=id%2C+snippet&id=${this.state.playlist.join(',')}&key=AIzaSyDDQYujKUcXTr9gxMONP4UgyouF4ghjB3c`)
            .then(res => res.json())
            .then(res => {
                this.setState({
                    videoDetails: res.items.map(i => i.snippet)
                })
            })
    }

    refreshPlaylist = () => {
        if (this.state.isOwner) {
            const username = localStorage.getItem('username')
            const password = localStorage.getItem('playThisPass')
            fetch(`${URL.LOGIN}`, {
                body: JSON.stringify({
                    username,
                    password
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ playlist: data.playlist.urls }, () => this.fetchVideoDetails())
                    }
                })
        } else {
            fetch(`${URL.LOGIN}`, {
                body: JSON.stringify({
                    username: this.props.match.params.username,
                    memberId: sessionStorage.getItem('uniqueIdPlayThis')
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ playlist: data.playlist.urls }, () => this.fetchVideoDetails())
                    }
                })
        }
    }
    YouTubeGetID = (url) => {
        var ID = '';
        url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        if (url[2] !== undefined) {
            ID = url[2].split(/[^0-9a-z_\-]/i);
            ID = ID[0];
        }
        else
            ID = url

        if (ID.length < 20 && typeof ID === 'string')
            return ID;
    }

    modifyPlaylist = (action, data) => {
        let newPlaylist
        const username = localStorage.getItem('username')
        const password = localStorage.getItem('playThisPass')
        if (action === 'add') {
            let newUrl = this.YouTubeGetID(this.state.newVideoUrl)
            if (newUrl)
                newPlaylist = [...this.state.playlist, newUrl]
        } else if ('remove') {
            if (data) {
                console.log(data, this.state.playlist)
                if (this.state.playlist.length > 1) {
                    newPlaylist = [...this.state.playlist]
                    newPlaylist.splice(data.id, 1)
                    if (!newPlaylist[this.state.currentVideoId]) {
                        this.shiftCurrentActive('p')
                    }
                }
            }
        }
        if (newPlaylist) {
            this.setState({ playlist: newPlaylist }, () => this.fetchVideoDetails())
            fetch(`${URL.SEND_ACTION}/${username}/playlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: newPlaylist,
                    username,
                    password
                })
            })
        }
    }

    render() {
        return (
            <div>
                {this.state.showAll ? (this.state.loaded ?
                    (!this.state.requested ?
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                                <h1 style={{ marginBottom: 0, fontSize: getFontSize(this.state.username.length) }} className="leftMargin">{this.state.username}</h1>
                                <div class="share-playlist">
                                    <div class="clipboard">
                                        <Clipboard data-clipboard-text={window.location.href} onSuccess={() => message.info('Url copied, now share this so that others can Play This playlist')}>
                                            <Tooltip title="Copy link to share"><Icon type="copy" /></Tooltip>
                                        </Clipboard>
                                    </div>
                                    <div className="headerRight"><QRCode size={64} value={window.location.href} />
                                        {this.state.isOwner && window.innerWidth >= 600 ? <Button style={{ marginLeft: '1rem' }} onClick={this.logout}>Logout</Button> : null}</div>
                                </div>
                            </div>
                            <hr />
                            <div className="myrow">
                                <div className="left">
                                    <Current
                                        username={this.props.match.params.username}
                                        password={this.props.location && this.props.location.state && this.props.location.state.password}
                                        current={this.state.playlist[this.state.currentVideoId]}
                                        shiftCurrentActive={this.shiftCurrentActive}
                                        action={this.state.action}
                                        actionId={this.state.actionId}
                                        isOwner={this.state.isOwner}
                                        currentDetails={this.state.videoDetails[this.state.currentVideoId]}
                                    />
                                    <Playlist
                                        refresh={this.refreshPlaylist}
                                        playlist={this.state.playlist}
                                        videoDetails={this.state.videoDetails}
                                        isOwner={this.state.isOwner}
                                        modifyPlaylist={this.modifyPlaylist}
                                        currentVideoId={this.state.currentVideoId}
                                        shiftCurrentActive={this.shiftCurrentActive}
                                    />
                                    {this.state.isOwner ? <span className="leftMargin"><Input value={this.state.newVideoUrl} style={{ width: 300, marginBottom: '1rem' }} onChange={e => this.setState({ newVideoUrl: e.target.value })} placeholder="Add a video url" onPressEnter={() => { this.setState({ newVideoUrl: '' }); this.modifyPlaylist('add') }} /></span> : null}
                                </div>
                                <div className="right">
                                    {this.state.subscribeCard ? <SubscribeAndAnnouncements closeSubscribeCard={this.closeSubscribeCard} /> : null}
                                    {this.state.isOwner && this.state.members.length ? <Members members={this.state.members} removeMember={this.removeMember} /> : null}
                                    <Requests getRequestRef={this.getRequestRef} requests={this.state.requests} sendRequest={this.sendRequest} isOwner={this.state.isOwner} />
                                </div></div></div> :
                        <div>
                            <h1>You have requested to join {this.state.username}'s club.</h1>
                            <p>Please wait until the owner of the club accepts your request.</p>
                        </div>

                    ) : <Spin />) : null}

                <Modal
                    visible={this.state.newMember}
                    title="Add request"
                    onOk={this.onOkNewMember}
                    onCancel={this.onCancelNewMember}
                >
                    <p>{this.state.newMemberName} is requesting to join your room.</p>
                    {this.state.loading ? <Spin /> : null}
                </Modal>
                <Modal
                    visible={this.state.requestAccess}
                    title="Request access"
                    onOk={this.onOkRequestAccess}
                    onCancel={this.onCancelRequestAccess}
                    closable={false}
                    okText={'Request'}
                    cancelButtonProps={{ disabled: true }}
                >
                    <p>Your name</p>
                    <Input onPressEnter={this.onOkRequestAccess} onChange={e => this.setState({ name: e.target.value })} />
                </Modal>
            </div>
        )
    }
}

const getFontSize = length => {
    if (window.innerWidth >= 600) {
        return '3rem'
    } else {
        if (length <= 7) return '3rem'
        return `${3 * (1 / log7(length))}rem`
    }
}

const log7 = (val) => {
    return Math.log(val) / Math.log(7);
}

export default Home