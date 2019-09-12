import React from 'react'
import { Input, Button, message, Icon } from 'antd';
import URL from './../urls'

export default class SAndAnn extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loading: false
        }
    }

    componentDidMount(){

    }

    subscribe = () => {
        const regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(regx.test(this.state.email)){
            this.setState({loading: true})
            fetch(URL.SUBSCRIBE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.state.email
                })
            }).then(res => res.json())
            .then(res => {
                if(res.success){
                    this.setState({loading: false}, () => this.props.closeSubscribeCard(true))
                    message.success('You have successfully subscribed to the newsletter!')
                }
            })
        } else {
            message.warn('Please enter a valid email!')
        }
    }

    render(){
        return(
            <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <b>Subscribe to our newsletter for further updates!</b>
                    {!this.state.loading ? <Icon className="hoverpointer" type="close" onClick={() => this.props.closeSubscribeCard(false)} /> : null}
                </div>
                <div style={styles}>
                    <Input type="email" placeholder="Your email" onChange={e => this.setState({email: e.target.value})} /><br/>
                    <Button type="primary" style={{marginLeft: '0.5rem'}} onClick={this.subscribe}>Subscribe</Button>
                </div> 
            </div>
        )
    }
}

const styles = {
    display: 'flex',
    marginTop: '0.5rem',
}