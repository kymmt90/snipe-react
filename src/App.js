import Cookies from 'js-cookie';
import LogIn from './LogIn';
import React, { Component } from 'react';
import SnippetCreate from './SnippetCreate';
import SnippetShow from './SnippetShow';
import SnippetsIndex from './SnippetsIndex';
import SnippetUpdate from './SnippetUpdate';
import UserSnippetsIndex from './UserSnippetsIndex';
import parse from 'parse-link-header';
import request from 'superagent';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import _ from 'lodash';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      snippets: [],
      firstPage: {},
      lastPage: {},
      nextPage: {},
      previousPage: {},
      loggedIn: false,
    }

    this.fetchSnippets = this.fetchSnippets.bind(this);
    this.setPagesToState = this.setPagesToState.bind(this);
    this.handleClickPaginator = this.handleClickPaginator.bind(this);
    this.getCurrentPage = this.getCurrentPage.bind(this);
    this.getUserToken = this.getUserToken.bind(this);
    this.getRequestWithAuth = this.getRequestWithAuth.bind(this);
    this.postRequestWithAuth = this.postRequestWithAuth.bind(this);

    this.fetchSnippets('http://localhost:3001/snippets');
  }

  handleClickPaginator(event) {
    event.preventDefault();
    this.fetchSnippets(event.target.href);
  }

  getCurrentPage() {
    if (!_.isEmpty(this.state.nextPage)) {
      return this.toDecimalNumber(this.state.nextPage.number) - 1;
    } else {
      return this.toDecimalNumber(this.state.previousPage.number) + 1;
    }
  }

  toDecimalNumber(intRepresentation) {
    return parseInt(intRepresentation, 10)
  }

  getUserToken(email, password) {
    const params = {
      auth: {
        email: email,
        password: password
      }
    };

    this.postRequestWithAuth('http://localhost:3001/user_token')
      .send(params)
      .end((err, res) => {
        if (err) {
          console.log(err);
        } else {
          if (res.body.jwt) {
            Cookies.set('jwt', res.body.jwt);
            this.setState({loggedIn: true});
          } else {
            Cookies.remove('jwt');
            this.setState({loggedIn: false});
          }
        }
      });
  }

  fetchSnippets(url) {
    this.getRequestWithAuth(url)
      .end((err, res) => {
        if (err) {
          console.log(err);
        } else {
          this.setState({
            snippets: res.body
          });
          this.setPagesToState(res);
        }
      });
  }

  getRequestWithAuth(url) {
    const jwt = Cookies.get('jwt');
    if (jwt) {
      return request.get(url).accept('json').set('Authorization', `Bearer ${jwt}`);
    } else {
      return request.get(url).accept('json');
    }
  }

  postRequestWithAuth(url) {
    const jwt = Cookies.get('jwt');
    if (jwt) {
      return request.post(url).accept('json').set('Authorization', `Bearer ${jwt}`);
    } else {
      return request.post(url).accept('json');
    }
  }

  patchRequestWithAuth(url) {
    const jwt = Cookies.get('jwt');
    if (jwt) {
      return request.patch(url).accept('json').set('Authorization', `Bearer ${jwt}`);
    } else {
      return request.patch(url).accept('json');
    }
  }

  deleteRequestWithAuth(url) {
    const jwt = Cookies.get('jwt');
    if (jwt) {
      return request.delete(url).accept('json').set('Authorization', `Bearer ${jwt}`);
    } else {
      return request.delete(url).accept('json');
    }
  }

  setPagesToState(res) {
    const linkHeader = parse(res.headers['link']);

    this.setState({
      firstPage: {
        number: linkHeader.first.page,
        url: linkHeader.first.url
      },
      lastPage: {
        number: linkHeader.last.page,
        url: linkHeader.last.url
      }
    });

    if (linkHeader.previous) {
      this.setState({
        previousPage: {
          number: linkHeader.previous.page,
          url: linkHeader.previous.url
        }
      });
    } else {
      this.setState({
        previousPage: {}
      });
    }

    if (linkHeader.next) {
      this.setState({
        nextPage: {
          number: linkHeader.next.page,
          url: linkHeader.next.url
        }
      });
    } else {
      this.setState({
        nextPage: {}
      });
    }
  }

  render() {
    const snippetsIndex = () => (
      <SnippetsIndex snippets={this.state.snippets} first={this.state.firstPage} previous={this.state.previousPage} next={this.state.nextPage} last={this.state.lastPage} onClickPaginator={this.handleClickPaginator} />
    );

    const userSnippetsIndex = ({ match }) => (
      <UserSnippetsIndex id={match.params.id} first={this.state.firstPage} previous={this.state.previousPage} next={this.state.nextPage} last={this.state.lastPage} onClickPaginator={this.handleClickPaginator} getRequestWithAuth={this.getRequestWithAuth}  />
    );

    const snippetShow = ({ match }) => (
      <SnippetShow id={match.params.id} currentPage={this.getCurrentPage()} getRequestWithAuth={this.getRequestWithAuth} />
    );

    const snippetCreate = () => (
      <SnippetCreate postRequestWithAuth={this.postRequestWithAuth} />
    );

    const snippetUpdate = ({ match }) => (
      <SnippetUpdate id={match.params.id} getRequestWithAuth={this.getRequestWithAuth} patchRequestWithAuth={this.patchRequestWithAuth} deleteRequestWithAuth={this.deleteRequestWithAuth} />
    );

    const logIn = () => (
      <LogIn getUserToken={this.getUserToken} loggedIn={this.state.loggedIn} />
    );

    return(
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={snippetsIndex} />
          <Route path="/snippets/new" component={snippetCreate} />
          <Route path="/snippets/:id/edit" component={snippetUpdate} />
          <Route path="/snippets/:id" component={snippetShow} />
          <Route path="/users/:id" component={userSnippetsIndex} />
          <Route path="/login" component={logIn} />
          <Route component={snippetsIndex} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
