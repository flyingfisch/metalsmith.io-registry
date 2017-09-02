import React from 'react'
import App from './Components/App'
import registry from '../../pluginRegistry.json'
import { render } from 'react-dom'
import styles from './styles.less'

const root = (
  <App packages={registry.packages} />
)

render(root, document.getElementById('root'))
