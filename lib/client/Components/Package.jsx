import React from 'react'
import PropTypes from 'prop-types'

const Package = function ({ pkg }) {
  return (
    <div className="panel panel-default">
      <div className="panel panel-body">
        {pkg.name} {pkg.stars} <i className="fa fa-star" />
      </div>
    </div>
  )
}

Package.propTypes = {
  pkg: PropTypes.object.isRequired
}

export default Package
