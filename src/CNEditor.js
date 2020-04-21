import React, { Component } from "react";
import { WebView } from "react-native-webview";
import htmlEditor from "./html/editor";
import { StyleSheet, View, Image, Platform } from "react-native";
const shortid = require("shortid");

const isIos = Platform.OS === "ios";

export default class CNEditor extends Component {
  constructor(props) {
    super(props);
    this.isInit = false;
    this.state = {
      layoutWidth: 400
    };
    this.webViewRef = null;
    this._resolve = null;
  }

  rgb2hex(rgb) {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    return rgb && rgb.length === 4
      ? "#" +
          ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : "";
  }

  onMessage = event => {
    try {
      const { styleList } = this.props;
      const message = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case "getHtml":
          if (this._resolve) {
            this._resolve(message.data);
            this._resolve = null;
          }
          break;
        case "selectedStyles":
          let styles = message.data.styles;
          let colorHex = message.data.colors.color;
          if (colorHex.startsWith("rgb")) {
            colorHex = this.rgb2hex(colorHex);
          }

          let highlightHex = message.data.colors.highlight;
          if (highlightHex.startsWith("rgb")) {
            highlightHex = this.rgb2hex(highlightHex);
          }

          if (colorHex == styleList["red"].color) {
            styles.push("red");
          } else if (colorHex == styleList["black"].color) {
            styles.push("black");
          } else if (colorHex == styleList["blue"].color) {
            styles.push("blue");
          } else if (colorHex == styleList["green"].color) {
            styles.push("green");
          } else if (colorHex == styleList["default"].color) {
            styles.push("#737373");
          } else {
            const getAllHex = Object.values(styleList).filter(item =>
              item.color.startsWith("#")
            );
            styles = [...styles, ...getAllHex];
          }

          // console.log({colorHex}, message.data,{styles}, styleList)

          switch (highlightHex) {
            case styleList["blue_hl"].backgroundColor:
              styles.push("blue_hl");
              break;
            case styleList["green_hl"].backgroundColor:
              styles.push("green_hl");
              break;
            case styleList["pink_hl"].backgroundColor:
              styles.push("pink_hl");
              break;
            case styleList["yellow_hl"].backgroundColor:
              styles.push("yellow_hl");
              break;
            case styleList["orange_hl"].backgroundColor:
              styles.push("orange_hl");
              break;
            case styleList["purple_hl"].backgroundColor:
              styles.push("purple_hl");
              break;
            case styleList["default_hl"].backgroundColor:
              styles.push("default_hl");
              break;
            default:
              break;
          }

          // if(highlightHex == styleList['blue_hl'].backgroundColor){
          //     styles.push('blue_hl');
          // }else if(highlightHex == styleList['green_hl'].backgroundColor){
          //     styles.push('green_hl');
          // }else if(highlightHex == styleList['pink_hl'].backgroundColor){
          //     styles.push('pink_hl');
          // }else if(highlightHex == styleList['yellow_hl'].backgroundColor){
          //     styles.push('yellow_hl');
          // }else if(highlightHex == styleList['orange_hl'].backgroundColor){
          //     styles.push('orange_hl');
          // }else if(highlightHex ==styleList['purple_hl'].backgroundColor){
          //     styles.push('purple_hl');
          // }else{
          //     const getAllHex = Object.values(styleList).filter(item=> item.backgroundColor.startsWith('#'))
          //     styles = [...styles,...getAllHex]
          // }

          this.onSelectedStyleChanged(styles);
          break;
        case "selectedTag":
          this.onSelectedTagChanged(message.data);
          break;

        case "onChange":
          this.onValueChanged(message.data);
          break;

          break;
        default:
          break;
      }
    } catch (error) {}
  };

  insertImage(
    url,
    id = null,
    height = null,
    width = null,
    alt = "",
    align = "none"
  ) {
    let myHeight, myWidth;

    if (!width && !height) {
      width = 500;
      height = 200;
      Image.getSize(url, (width, height) => {
        width = width;
        height = height;

        myHeight =
          this.state.layoutWidth - 4 < width
            ? height * ((this.state.layoutWidth - 4) / width)
            : height;
        myWidth =
          this.state.layoutWidth - 4 < width
            ? this.state.layoutWidth - 4
            : width;

        const jsonString = JSON.stringify({
          type: "toolbar",
          command: "image",
          value: {
            url,
            id: id || shortid.generate(),
            height: myHeight,
            width: myWidth,
            alt,
            align
          }
        });

        if (this.webViewRef) {
          this.webViewRef.postMessage(jsonString);
        }
      });
    } else {
      myHeight =
        this.state.layoutWidth - 4 < width
          ? height * ((this.state.layoutWidth - 4) / width)
          : height;
      myWidth =
        this.state.layoutWidth - 4 < width ? this.state.layoutWidth - 4 : width;
      const jsonString = JSON.stringify({
        type: "toolbar",
        command: "image",
        value: {
          url,
          id: id || shortid.generate(),
          height: myHeight,
          width: myWidth,
          alt,
          align
        }
      });

      if (this.webViewRef) {
        this.webViewRef.postMessage(jsonString);
      }
    }
  }

  onSelectedStyleChanged = styles => {
    if (this.props.onSelectedStyleChanged) {
      this.props.onSelectedStyleChanged(styles);
    }
  };

  onSelectedTagChanged = tag => {
    if (this.props.onSelectedTagChanged) {
      this.props.onSelectedTagChanged(tag);
    }
  };

  onLoad = () => {
    if (this.props.initialHtml) {
      this.setHtml(this.props.initialHtml);
    }

    if (this.props.editorStyle) this.applyEditorStyle(this.props.editorStyle);

    if (this.props.placeholder) this.setPlaceholder(this.props.placeholder);

    const jsonString = JSON.stringify({ type: "editor", command: "focus" });
    const origBody = JSON.stringify({ type: "toolbar", command: "body" });

    if (this.webViewRef) {
      if (isIos) {
        this.webViewRef.postMessage(jsonString);
        this.webViewRef.postMessage(jsonString);
        this.webViewRef.postMessage(origBody);
      } else {
        setTimeout(() => {
          this.webViewRef.requestFocus();
        }, 100);
        this.webViewRef.postMessage(origBody);
      }
    }
  };

  onLayout = event => {
    const { width } = event.nativeEvent.layout;

    this.setState({
      layoutWidth: width
    });
  };

  applyToolbar = (tool, from) => {
    let jsonString = "";
    const { styleList } = this.props;

    if (tool !== "" && from === "color") {
      jsonString = JSON.stringify({
        type: "toolbar",
        command: "color",
        value: styleList[tool].color
      });
    } else if (tool !== "" && from === "background") {
      jsonString = JSON.stringify({
        type: "toolbar",
        command: "highlight",
        value:
          styleList[tool].backgroundColor === "#737373"
            ? "#00000000"
            : styleList[tool].backgroundColor
      });
    } else {
      // if(tool === 'highlight'){
      //   jsonString = JSON.stringify({
      //     type: "toolbar",
      //     command: "highlight",
      //     value: '#00000000'
      //   });

      jsonString = JSON.stringify({ type: "toolbar", command: tool });
    }

    console.log({ jsonString }, styleList[tool]);
    if (this.webViewRef) {
      const jsonStringFocus = JSON.stringify({
        type: "editor",
        command: "focus"
      });
      this.webViewRef.postMessage(jsonStringFocus);
      this.webViewRef.postMessage(jsonString);
    }
  };

  focus = () => {
    const jsonString = JSON.stringify({ type: "editor", command: "focus" });

    if (this.webViewRef) {
      this.webViewRef.postMessage(jsonString);
    }
  };

  setHtml = htmlString => {
    const jsonString = JSON.stringify({
      type: "editor",
      command: "setHtml",
      value: htmlString
    });

    if (this.webViewRef) {
      this.webViewRef.postMessage(jsonString);
    }
  };

  setPlaceholder = placeholder => {
    const jsonString = JSON.stringify({
      type: "editor",
      command: "placeholder",
      value: placeholder
    });

    if (this.webViewRef) {
      this.webViewRef.postMessage(jsonString);
    }
  };

  onValueChanged = data => {
    if (this.props.onValueChanged) {
      this.props.onValueChanged(data);
    }
  };

  applyEditorStyle = styleString => {
    const jsonString = JSON.stringify({
      type: "editor",
      command: "style",
      value: styleString
    });
    if (this.webViewRef) {
      this.webViewRef.postMessage(jsonString);
    }
  };

  blur = () => {
    const jsonString = JSON.stringify({ type: "editor", command: "blur" });

    if (this.webViewRef) {
      this.webViewRef.postMessage(jsonString);
    }
  };

  getHtml = () => {
    if (this.resolve) return;
    const _this = this;

    return new Promise(function(resolve, reject) {
      _this.applyGetContent(resolve);
    });
  };

  applyGetContent(resolve) {
    this._resolve = resolve;
    this.webViewRef.postMessage(
      JSON.stringify({ type: "editor", command: "getHtml" })
    );
  }

  render() {
    const {
      keyboardDisplayRequiresUserAction = false,
      customStyles = "p { display: inline }"
    } = this.props;
    const htmlEditorString = htmlEditor.replace(
      "/* PUT YOUR STYLE HERE */",
      customStyles
    );
    return (
      <View style={styles.container} onLayout={this.onLayout}>
        <WebView
          style={styles.webView}
          ref={webView => (this.webViewRef = webView)}
          onLoad={this.onLoad}
          allowFileAccess={true}
          domStorageEnabled={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          keyboardDisplayRequiresUserAction={keyboardDisplayRequiresUserAction}
          javaScriptEnabled={true}
          source={{ html: htmlEditorString }}
          domStorageEnabled={true}
          mixedContentMode="always"
          onMessage={this.onMessage}
          renderError={error => console.log("error:", error)}
          autoFocus={true}
          javaScriptEnabledAndroid={true}
        />
      </View>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1
  },
  webView: {
    flexGrow: 1
  }
});
