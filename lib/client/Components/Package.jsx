import React from 'react'
import PropTypes from 'prop-types'

const Package = function ({ pkg }) {
  return (
    <div className="panel panel-default">
      <div className="panel-body">
        <h2>{pkg.name}</h2>
        <ul className="col-xs-3 pull-right list-inline">
          <li className="col-xs-4"><i className="fa fa-star" /> {pkg.stars}</li>
          <li className="col-xs-4"><i className="fa fa-download" /> {pkg.downloads}</li>
          <li className="col-xs-4"><i className="fa fa-bug" /> {pkg.issues}</li>
        </ul>
        <p>{pkg.description}</p>
      </div>
    </div>
  )
}

Package.propTypes = {
  pkg: PropTypes.object.isRequired
}

export default Package
