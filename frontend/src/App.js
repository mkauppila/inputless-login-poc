import './App.css';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import {Admin} from './Pages/Admin'
import {Default} from './Pages/Default'

function App() {
  return (
      <Router>
      <Switch>
        <Route path="/admin/">
          <Admin/>
        </Route>
        <Route path="/">
          <Default/>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
