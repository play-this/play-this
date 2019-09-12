import React from 'react'
import { Button } from 'antd';

class Playlist extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            playlist: []
        }
    }

    componentDidMount() {
    }

    render() {
        console.log('inside playlist', this.props.playlist)
        return (
            <div className="playlist">
                <div style={{ display: 'flex' }}><h2>Playlist</h2> &nbsp;&nbsp;
                <Button icon="reload" onClick={this.props.refresh} /></div>
                <div className="innerPlaylist">
                    {this.props.videoDetails.map((p, i) => {
                        return (
                            <div className={this.props.isOwner ? "playlistItem hoverpointer" : "playlistItem"} onClick={() => this.props.isOwner ? this.props.shiftCurrentActive(i) : null}>
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}><img src={p.thumbnails.default.url} />
                                    <h6 style={{ marginLeft: '1rem', maxWidth: '60%', color: i === this.props.currentVideoId ? 'green' : '#333' }}>{p.title}</h6></div> {this.props.isOwner ? <Button icon="close" onClick={() => this.props.modifyPlaylist('remove', { id: i })} /> : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default Playlist