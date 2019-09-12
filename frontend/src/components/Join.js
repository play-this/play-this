import React from 'react'
import URL from './../urls'
import { Button, Input, Modal, Spin, message } from 'antd'
import { Helmet } from 'react-helmet'

class Join extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: ''
        }
    }

    componentDidMount() {

    }

    change = (e) => {
        this.setState({
            username: e.target.value
        })
    }

    confirmCreateClub = () => {
        this.setState({ modalVisible: true })
    }

    checkPassword = () => {
        this.setState({ authModal: true })
    }

    //if club exists, then login
    onOkAuth = () => {
        if (this.state.username.length && this.state.password.length) {
            this.setState({ loading: true })
            fetch(`${URL.LOGIN}`, {
                body: JSON.stringify({
                    username: this.state.username,
                    password: this.state.password
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ loading: false, authModal: false })
                        this.props.history.push({
                            pathname: `/club/${this.state.username}`,
                            state: {
                                created: false,
                                username: this.state.username,
                                password: this.state.password,
                                playlist: data.playlist
                            }
                        })
                    } else {
                        this.setState({ loading: false })
                        message.error('Your login failed.')
                    }

                })
        } else {
            message.error('Password cannot be blank!')
        }
    }

    //if club does not exist, ask for a new password
    onOk = () => {
        if (this.state.username.length && this.state.password.length) {
            this.setState({ loading: true })
            fetch(`${URL.CREATE_CLUB}`, {
                body: JSON.stringify({
                    username: this.state.username,
                    password: this.state.password
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.setState({ loading: false, modalVisible: false })
                        this.props.history.push({
                            pathname: `/club/${this.state.username}`,
                            state: {
                                created: true,
                                username: this.state.username,
                                password: this.state.password,
                                playlist: data.playlist
                            }
                        })
                    } else {
                        message.error('Club could not be created.')
                    }

                })
        } else {
            message.error('Password is too short!')
        }
    }

    onCancel = () => {
        this.setState({ modalVisible: false })
    }

    onCancelAuth = () => {
        this.setState({ authModal: false })
    }

    join = () => {
        if (this.state.username.length) {
            this.setState({ loading: true })
            fetch(`${URL.IS_USERNAME}/${this.state.username}`)
                .then(res => res.json())
                .then(data => {
                    console.log('Data: ', data)
                    this.setState({ usernameCheck: data.success, loading: false })
                    if (!data.success)
                        this.checkPassword()
                    else
                        this.confirmCreateClub()
                })
        } else {
            message.error('Enter a username!')
        }
        //this.props.history.push(`/club/${this.state.username}`)
    }

    render() {
        return (
            <div className="join">
                <Helmet>
                    <meta property="og:title" content="Play This" />
                    <meta property="og:url" content="https://playthis.netlify.com"/>
                    <meta property="og:description" content="Create a club and let people control your playlist"/>
                    <meta property="og:image" content="https://i.imgur.com/u6hZDlQ.png"/>
                </Helmet>
                <div className="join-left">
                    <img src="/logo512.png" width={100} style={{marginBottom: '5px'}}/>
                    <h2>Play This</h2>
                    <p>Choose your club name or login if already created</p>
                    <Input style={{ width: '20rem' }} onPressEnter={this.join} onChange={this.change} value={this.state.username} className="username_input" type="text" placeholder="Username" />
                    <br />
                    <Button type="primary" style={{ width: 100 }} onClick={this.join}>Go!</Button><br /><br />
                    <br />{this.state.loading ? <Spin /> : null}
                </div>
                <Modal
                    visible={this.state.modalVisible}
                    title="Create a club"
                    onOk={this.onOk}
                    onCancel={this.onCancel}
                >
                    <p>Enter a password</p>
                    <Input onPressEnter={this.onOk} placeholder="Password" onChange={(e) => this.setState({ password: e.target.value })} />
                    <br /><br />{this.state.loading ? <Spin /> : null}
                </Modal>
                <Modal
                    visible={this.state.authModal}
                    title="Login"
                    onOk={this.onOkAuth}
                    onCancel={this.onCancelAuth}
                >
                    <p>Enter your password</p>
                    <Input autoFocus type="password" onPressEnter={this.onOkAuth} placeholder="Password" onChange={(e) => this.setState({ password: e.target.value })} />
                    <br /><br />{this.state.loading ? <Spin /> : null}
                </Modal>
            </div>
        )
    }
}

const usernameMessage = bool => {
    if (bool) {
        return 'This username is available!'
    } else {
        return 'Sorry! This username is taken.'
    }
}

export default Join