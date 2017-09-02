import React from 'react'
import PropTypes from 'prop-types'
import Package from './Package'
import query from 'array-query'
import update from 'immutability-helper'

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sort: 'stars',
      sortDir: '-1',
      filter: '',
      packages: props.packages.slice(0, 20)
    }
  }
  onFilter = () => {
    let newState = update(this.state, {filter: {$set: this.filterInput.value}})
    this.query(newState)
  }
  onSortStars = () => {
    let newState
    if (this.state.sort === 'stars') {
      newState = update(this.state, {sortDir: {$set: this.state.sortDir * -1}})
    } else {
      newState = update(this.state, {sort: {$set: 'stars'}})
    }
    this.query(newState)
  }
  onSortIssues = () => {
    let newState
    if (this.state.sort === 'issues') {
      newState = update(this.state, {sortDir: {$set: this.state.sortDir * -1}})
    } else {
      newState = update(this.state, {sort: {$set: 'issues'}})
    }
    this.query(newState)
  }
  onSortDownloads = () => {
    let newState
    if (this.state.sort === 'downloads') {
      newState = update(this.state, {sortDir: {$set: this.state.sortDir * -1}})
    } else {
      newState = update(this.state, {sort: {$set: 'downloads'}})
    }
    this.query(newState)
  }
  query (newState) {
    let packages = query('name').search(newState.filter)
    .or('keywords').has(newState.filter)
    .limit(20)
    .sort(newState.sort)[newState.sortDir === 1 ? 'asc' : 'desc']()
    .on(this.props.packages)
    this.setState(update(newState, {packages: {$set: packages}}))
    console.log(packages)
  }
  render () {
    const pkgs = this.state.packages.map((pkg) => {
      return <Package key={pkg.name} pkg={pkg} />
    }) || null
    return (
      <div className="container">
        <div className="row margin-top">
          <div id='filter' className='col-xs-6'>
            <input placeholder="filter" onChange={this.onFilter} ref={(el) => { this.filterInput = el }} />
          </div>
          <div id='sort' className='col-xs-6'>
            <div className="btn-group">
              <button className="btn btn-default" onClick={this.onSortStars}>Stars</button>
              <button className="btn btn-default" disabled onClick={this.onSortIssues}>Issues</button>
              <button className="btn btn-default" disabled onClick={this.onSortDownloads}>Downloads</button>
            </div>
          </div>
        </div>
        <div className="row margin-top">
          <div className='col-xs-12'>
            {[pkgs]}
          </div>
        </div>
      </div>
    )
  }
}

App.propTypes = {
  packages: PropTypes.array
}
