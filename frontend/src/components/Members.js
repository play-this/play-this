import React from 'react'
import { Button } from 'antd';

class Members extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            members: []
        }
    }

    componentDidMount() {

    }

    render() {
        return (
            <div >
                <h2>Members ({this.props.members.length})</h2>
                <div className="members">
                    {this.props.members.map((m, i) => {
                        return (
                            <div className="membersItem">
                                <h6>{m}</h6>
                                <Button icon="close" onClick={() => this.props.removeMember(m)} />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default Members