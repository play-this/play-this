import React from 'react'
import YouTube from 'react-youtube'
import URL from './../urls'
import cryptoRandomString from 'random-string'
import { Button, Tooltip } from 'antd';

class Current extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            play: false,
            volume: 50
        }
    }

    componentDidMount() {
        console.log('current', this.props.current)

    }

    componentDidUpdate(prevProps) {
        if (prevProps.current !== this.props.current) {
            console.log(`https://www.googleapis.com/youtube/v3/videos?part=id%2C+snippet&id=${this.props.current}&key=AIzaSyDDQYujKUcXTr9gxMONP4UgyouF4ghjB3c`)
            fetch(`https://www.googleapis.com/youtube/v3/videos?part=id%2C+snippet&id=${this.props.current}&key=AIzaSyDDQYujKUcXTr9gxMONP4UgyouF4ghjB3c`)
                .then(res => res.json())
                .then(res => {
                    console.log('name', res.items)
                })
        }
        if (prevProps.action !== this.props.action) {
            if (sessionStorage.getItem('prevEventId') !== this.props.actionId) {
                this.respondToAction(this.props.action)
            }
        }
        else if (prevProps.actionId !== this.props.actionId && (this.props.action === 'vol-up' || this.props.action === 'vol-down')) {
            this.respondToAction(this.props.action)
        }
    }

    _onReady = event => {
        console.log('player ready')
        event.target.setVolume(this.state.volume)
        this.setState({
            yt: event.target
        })
    }

    respondToAction = type => {
        const { yt } = this.state
        switch (type) {
            case 'play':
                yt.playVideo()
                break;
            case 'pause':
                yt.pauseVideo()
                break;
            case 'previous':
                this.props.shiftCurrentActive('p')
                break;
            case 'next':
                this.props.shiftCurrentActive('n')
                break;
            case 'vol-up':
                if (this.state.volume < 100) {
                    yt.setVolume(this.state.volume + 10)
                    this.setState({ volume: this.state.volume + 10 })
                }
                break;
            case 'vol-down':
                if (this.state.volume > 0) {
                    yt.setVolume(this.state.volume - 10)
                    this.setState({ volume: this.state.volume - 10 })
                }
                break
            default:
                break
        }
    }

    sendAction = event => {
        console.log('sendAction', event)
        let body = {}
        if (!sessionStorage.getItem('uniqueIdPlayThis')) {
            body.username = this.props.username
            body.password = this.props.password
        } else {
            body.memberId = sessionStorage.getItem('uniqueIdPlayThis')
        }
        const prevAction = cryptoRandomString({ length: 5 })
        sessionStorage.setItem('prevActionId', prevAction)
        body.data = {}
        body.data.actionId = prevAction
        fetch(`${URL.SEND_ACTION}/${this.props.username}/${event}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
    }

    _onEnd = event => {
        this.props.shiftCurrentActive('n')
    }

    _onPause = event => {
        console.log('pause', event)
    }

    stateChange = event => {
        console.log('state change', event)
    }

    render() {
        const opts = {
            width: window.innerWidth < 600 ? window.innerWidth.toString() : window.innerWidth * 0.5,
            height: window.innerWidth < 600 ? window.innerHeight * 0.3 : window.innerHeight * 0.4,
            playerVars: { // https://developers.google.com/youtube/player_parameters
                autoplay: 1
            }
        }
        return (
            <div className={this.props.isOwner ? "current" : "current-user"}>
                <h2 className={this.props.isOwner ? "leftMargin" : ""}>Now playing</h2>
                {this.props.isOwner ? <div>
                    <YouTube
                        videoId={this.props.current}
                        opts={opts}
                        onReady={this._onReady}
                        onPlay={this._onPlay}
                        onPause={this._onPause}
                        onEnd={this._onEnd}
                    />
                </div> :
                    <div>
                        <h6>{this.props.currentDetails && this.props.currentDetails.title}</h6>
                        <Button onClick={() => this.sendAction('play')} icon="caret-right" />&nbsp;&nbsp;
                    <Button onClick={() => this.sendAction('pause')} icon="pause" />&nbsp;&nbsp;
                    <Button onClick={() => this.sendAction('previous')} icon="step-backward" />&nbsp;&nbsp;
                    <Button onClick={() => this.sendAction('next')} icon="step-forward" />&nbsp;&nbsp;
                    <Tooltip title="Volume up"><Button onClick={() => this.sendAction('vol-up')} icon="up-circle" /></Tooltip>&nbsp;&nbsp;
                    <Tooltip title="Volume down"><Button onClick={() => this.sendAction('vol-down')} icon="down-circle" /></Tooltip>
                    </div>}
            </div>
        )
    }
}

export default Current