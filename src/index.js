import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { ECS } from 'convolvr-ecs'
import ECM from './package.js';
import URLUtil from './url';
import QRCodeController from './qrcode';

const urlUtil = new URLUtil(),
    qrCodeControl = new QRCodeController();

ReactDOM.render(
    <App
        ecs={ECS.makeRuntimeEnvironment()}
        ecm={ECM}
        qrc={qrCodeControl}
        url={urlUtil}

    />,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
