import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import { styles, resizeButtonStyle } from './styles';
import {Controlled as CodeMirror} from 'react-codemirror2'

import { Card, Panel } from "energetic-ui"

require('codemirror/mode/clike/clike');

function isMobile() {
  return window.innerWidth < 720;
}

class App extends Component {

  ecs = null;
  ecm = null;
  env = null;
  eval = null;
  inputEl = null;
  shift = false;
  first = true;
  cameraActivated = false;
  state = {
    out: [],
    command: `/*type*/ help() + "for documentation";`,
    layoutMode: 1,
    layoutType: -1
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const ecs = this.props.ecs,
      url = this.props.url,
      qrc = this.props.qrc,
      ecm = this.props.ecm;

    qrc.app = this;

    let env = ecs.makeEnvironment();

    this.ecs = ecs;
    this.ecm = ecm;
    this.env = env;
    this.url = url;
    this.qrc = qrc;
    this.eval = ecs.parseAndEvaluate;

    let layoutMode = 2;
    let layoutType = -1;

    let urlData = url.parseURL();

   if (urlData) {
      this.setState({
        command: urlData.data,
      });
      setTimeout(() => {
        this.evaluate();
      }, 100);
      setTimeout(() => {
        if (urlData.config.v) {
          layoutMode = parseInt(urlData.config.v);
        }
        if (urlData.config.h) {
          layoutType = parseInt(urlData.config.h);
          if (urlData.config.v === null || urlData.config.v === undefined) {
            layoutMode = -1;
          }
        }
        this.setState({
          layoutMode,
          layoutType
        });
      }, 200);

    }

    this.eval("'version 1.2'",
      this.env,
      (errs) => console.warn(errs)
    );
    this.setState({
      out: this.state.out,
      layoutMode,
      layoutType
    });
    //this.inputEl.current.focus();
  }

  evaluate() {
    const more = this.eval(
      this.state.command,
      this.env,
      (errs) => {
        console.warn(errs)
        this.state.out.reverse();
        this.state.out.push(JSON.stringify(errs, null, 2));
        this.state.out.reverse();
      },
      false
    );

    this.state.out.reverse();
    this.state.out.push(more);
    this.state.out.reverse();

    this.setState({
      out: this.state.out
    });
  }

  clear() {
    this.setState({
      out: []
    });
    document.querySelector("#ecs-output").innerHTML = "";
    document.querySelector("#qr-output").innerHTML = "";
  }

  getOutputClass(value) {
    if (!isNaN(value)) {
      if (value % 1 !== 0) {
        return "float"
      }
      return 'number'
    } else if (typeof value === "string") {
      const val =value.toLowerCase();

      if (val.indexOf("error") > -1) {
        return "error"
      }
      if (value.indexOf("null") > -1) {
        return "null"
      }
      if (value[0] === "[") {
        return "array"
      }
      if (value.indexOf("true") > -1 || value.indexOf("false") > -1) {
        return "boolean"
      }
    }
    return "string";
  }

  keys = {
    ctrl: false,
    shift: false,
    s: false
  }

  handleKeyDown(evt) {
    const key = evt.keyCode,
      keys = this.keys;

    if (key === 17 || key === 91 || key === 224) {
      keys.ctrl = true;
    } else if (key === 83) {
      keys.s = true;
      if (keys.ctrl) {
        evt.preventDefault();
        evt.stopPropagation();
        this.makeCode();
        return false;
      }
    } else if (key === 16) {
      keys.shift = true;
    } else if(keys.shift && key === 13) {
      evt.preventDefault();
      this.evaluate();
    }
  }

  handleKeyUp(evt) {
    const key = evt.keyCode;

    if (key == 16) {
      this.keys.shift = false;
    } else if (key === 83) {
      this.keys.s = false;
    } else if  (key == 17 || key == 91 || key == 224) {
      this.keys.ctrl = false;
    }
  }

  makeCode(sheet = 0) {
    const url = this.url.makeURL(this.state.command, sheet, this.state.layoutMode, this.state.layoutType)[0];

    window.history.pushState({}, "", "?"+ url.indexOf("?") > -1 ? url.split("?")[1] : url);
    this.qrc.makeCode([url]);
  }

  scanCode ()  {
    if (!this.cameraActivated) {
      this.cameraActivated = !this.cameraActivated;
      this.qrc.activate(data => this.onScan(data));
    }
  }

  onScan = (code) => {
    console.log("on scan ", code)
    this.setState({
      command: this.url.decode(code.split(/http.*\?r=0&c=/)[1])
    });
    this.evaluate();
  }

  getLayoutHeight(i) {
   let h = 0;

    if (this.state.layoutMode === -1) {
      h = 86;
    } else {
      h = Math.min(86, 100 - this.getInputContainerHeight());
    }

    let computed = { height: h+"%", maxHeight: h+"vh" };

    return computed;
  }

  getInputContainerHeight() {
    return (100 / (1+this.state.layoutMode)) + 1;
  }
  getInputContainerWidth() {
    return (100 / (1+this.state.layoutType));
  }
  getOutputContainerWidth() {
    let width = (100 - this.getInputContainerWidth());

    if (width < 20) {
      width = 98;
    }

    return width;
  }

  getLayoutWidth(i) {
    let w = 0;

    if (this.state.layoutType === -1) {
      w = 100;
    } else {
      w = i == 0
        ? this.getInputContainerWidth()
        : this.getOutputContainerWidth();

      w = Math.max(12, w);
    }

    let style = { width: w+"%", maxWidth: w+"%" };

    return style;
  }

  resize() {
    let layoutMode = this.state.layoutMode + 1;

    if (layoutMode == 4) { layoutMode = 0; }
    this.setState({
      layoutMode,
      layoutType: -1
    })
  }

  reLayout() {
    let layoutType = this.state.layoutType + 1;

    if (layoutType == 4) { layoutType = 0; }
    this.setState({
      layoutType,
      layoutMode: -1
    });
  }

  render() {
    return (
      <div className="App">
        <Panel title="main.ecs" customStyle={styles.leftRightPadding}>
          <Card compact={true} showTitle={true} title="pretend-file.ecs"></Card>
          <Card compact={true} showTitle={true} title="foo.ecs"></Card>
          <Card compact={true} showTitle={true} title="bar.ecs"></Card>
          
        </Panel>
        <section style={styles.editor} style={styles.leftRightPadding}>
          <div className="input-container" style={ { ...this.getLayoutWidth(0) }}>
            <CodeMirror
              id="ecs-input"
              value={this.state.command}
              onKeyDown={(editor, evt)=>{ this.handleKeyDown(evt); }}
              onKeyUp={(editor, evt)=>{ this.handleKeyUp(evt); }}
              options={{
                mode: 'text/x-java',
                theme: 'seti',
                lineNumbers: true,
              }}
              onBeforeChange={(editor, data, value) => {
                this.setState({command: value});
              }}
              onChange={(editor, data, value) => {
                this.setState({
                  command: value
                })
              }}
            />
            <div id="toolbar" style={{position: "relative"}}>
              <input type="button" className="button" id="ecs-button" value="▶" title="evaluate" onClick={()=>{ this.evaluate(); }} />
              <input type="button" className="button" id="clear-button" value={ isMobile() ? "🔥" : "clear"} onClick={()=>{ this.clear(); }} />
              <input type="button" className="button" id="make-code-button" value="💾" onClick={()=>{ this.makeCode(); }} />
              <input type="button" className="button" id="read-code-button" value="📷" onClick={()=>{ this.scanCode(); }} />
              <input type="button" className="button" id="layout-button" value="↔" onClick={()=>{ this.reLayout(); }} 
                style={{ ...resizeButtonStyle, display: isMobile() ? "none" : "inline-block"}} />
            </div>
          </div>
          <div id="ecs-output-container" style={ { ...this.getLayoutWidth(1), ...this.getLayoutHeight(1),}}>
            { this.state.out.map((output, i) => (
              <div key={`output-line-${i}`} className={this.getOutputClass(output)}>
              <span className="gt-sign">&gt;</span>{ output }
              </div>
           ))}
              <pre id="ecs-output">

              </pre>
              <div id="qr-output"></div>
          </div>
        </section>
      </div>
    );
  }
}

export default App;
