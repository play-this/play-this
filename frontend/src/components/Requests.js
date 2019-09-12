import React from 'react'
import { Input } from 'antd';

export default class Requests extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            request: {
                by: '',
                text: ''
            }
        }
    }

    _onChange = (e) => {
        this.setState({
            request: {
                by: this.props.isOwner ? 'Club admin' : sessionStorage.getItem('uniqueIdPlayThis'),
                text: e.target.value
            }
        })
    }

    send = () => {
        this.setState({ request: {} })
        this.props.sendRequest(this.state.request)
    }

    render() {
        return (
            <div>
                <h2>Live chat</h2>
                <div className="requests" ref={r => this.props.getRequestRef && this.props.getRequestRef(r)}>
                    {this.props.requests && this.props.requests.map(r => <p><span className="requestName">{r.by}</span>: {r.text}</p>)}
                </div>
                <Input value={this.state.request.text} placeholder="Request a video to be added to the playlist" onChange={this._onChange} onPressEnter={this.send} />
            </div>
        )
    }
}