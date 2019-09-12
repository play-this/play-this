import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import Join from './components/Join'
import Home from './components/Home'

class Main extends React.Component {
    render() {
        return(
            <div>
                <Switch>
                    <Route exact path="/" component={Join}/>
                    <Route exact path="/club/:username" component={Home} />
                    <Redirect to="/" />
                </Switch>
            </div>
        )
    }
}

export default Main